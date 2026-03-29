import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import crypto from "crypto";

const SESSION_COOKIE = "sovereign-session";
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 7;
const SESSION_REFRESH_THRESHOLD_DAYS = 3;

/**
 * Resolve the application's base URL consistently across all auth functions.
 * Uses APP_URL (server-only env var) to avoid Next.js static replacement of
 * NEXT_PUBLIC_ vars at build time. Falls back for compatibility.
 */
export function getAppUrl(): string {
  return (
    process.env["APP_URL"] ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://www.trysovereignai.com"
      : "http://localhost:3000")
  );
}

export async function generateMagicLink(email: string) {
  // Find or create account — allow new signups via magic link.
  // Use upsert to prevent unique constraint violations from concurrent requests.
  const account = await prisma.account.upsert({
    where: { email },
    update: {},
    create: {
      email,
      role: "client",
    },
  });

  // Delete any existing unused magic links for this account
  await prisma.magicLink.deleteMany({
    where: { accountId: account.id, usedAt: null },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000
  );

  await prisma.magicLink.create({
    data: {
      token,
      accountId: account.id,
      expiresAt,
    },
  });

  logger.info("[auth] Magic link generated", {
    accountId: account.id,
  });

  return {
    url: `${getAppUrl()}/api/auth/verify?token=${token}`,
    token,
    account,
  };
}

export async function verifyMagicLink(
  token: string,
  metadata?: { userAgent?: string; ipAddress?: string }
) {
  // Use an atomic updateMany with conditions to prevent race conditions.
  // Two concurrent requests with the same token will race on this update;
  // only one will match (usedAt IS NULL + not expired), so only one succeeds.
  const now = new Date();
  const updated = await prisma.magicLink.updateMany({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  // If no rows were updated, the token was invalid, expired, or already used
  if (updated.count === 0) {
    logger.warn("[auth] Magic link verification failed — invalid, expired, or already used");
    return null;
  }

  // Fetch the magic link to get the account info
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { account: true },
  });

  if (!magicLink) return null;

  // Create session
  const session = await createSession(magicLink.accountId, metadata);

  logger.info("[auth] Magic link verified — session created", {
    accountId: magicLink.accountId,
  });

  return { session, account: magicLink.account };
}

/**
 * Create a new session for an account with optional metadata.
 * Used by magic link verification, Google OAuth, and any future auth providers.
 */
export async function createSession(
  accountId: string,
  metadata?: { userAgent?: string; ipAddress?: string }
) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const session = await prisma.session.create({
    data: {
      token: sessionToken,
      accountId,
      expiresAt,
      userAgent: metadata?.userAgent?.slice(0, 512) || null,
      ipAddress: metadata?.ipAddress || null,
    },
  });

  return session;
}

/**
 * List all active (non-expired) sessions for an account.
 */
export async function listSessions(accountId: string) {
  return prisma.session.findMany({
    where: {
      accountId,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      createdAt: true,
      lastUsedAt: true,
      userAgent: true,
      ipAddress: true,
      expiresAt: true,
    },
    orderBy: { lastUsedAt: "desc" },
  });
}

/**
 * Revoke a specific session by ID, but only if it belongs to the given account.
 */
export async function revokeSession(sessionId: string, accountId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, accountId: true },
  });
  if (!session || session.accountId !== accountId) return false;

  await prisma.session.delete({ where: { id: sessionId } });
  return true;
}

/**
 * Touch a session's lastUsedAt timestamp. Called on each authenticated request.
 */
export async function touchSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastUsedAt: new Date() },
  }).catch((err) => {
    // Non-critical — don't break the request if this fails
    logger.debug("[auth] Failed to touch session lastUsedAt", {
      sessionId,
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

/**
 * Find or create an account by email (used by OAuth providers).
 */
export async function findOrCreateAccountByEmail(
  email: string,
  name?: string
) {
  // Use upsert to prevent race conditions when two concurrent OAuth callbacks
  // for the same email both try to create an account simultaneously.
  // The update clause is a no-op ({}) because we only want to set the name
  // if it was previously missing, which we handle separately below.
  const account = await prisma.account.upsert({
    where: { email },
    update: {},
    create: { email, name },
  });

  // Update name only if it was missing and a name is provided
  if (name && !account.name) {
    return prisma.account.update({
      where: { id: account.id },
      data: { name },
    });
  }

  return account;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      account: {
        include: { client: true },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  // Update lastUsedAt in the background (non-blocking)
  touchSession(session.id);

  // Sliding window: if session is within the refresh threshold of expiry,
  // extend it by SESSION_EXPIRY_DAYS to keep active users logged in.
  const msUntilExpiry = session.expiresAt.getTime() - Date.now();
  const refreshThresholdMs =
    SESSION_REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  if (msUntilExpiry < refreshThresholdMs) {
    const newExpiry = new Date(
      Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );
    // Extend DB expiry and cookie in the background (non-blocking)
    prisma.session
      .update({
        where: { id: session.id },
        data: { expiresAt: newExpiry },
      })
      .catch((err) => {
        logger.debug("[auth] Failed to extend session expiry", {
          sessionId: session.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    });
  }

  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function setSessionCookie(sessionToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function signOut() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionToken) {
    // Delete the session from the database, but don't let a DB error prevent
    // cookie cleanup — the user should always be logged out client-side.
    await prisma.session.deleteMany({ where: { token: sessionToken } }).catch((err) => {
      logger.warnWithCause("[auth] Failed to delete session from DB during sign-out", err);
    });
  }
  logger.info("[auth] User signed out");
  await clearSessionCookie();
}

/**
 * Rotate an existing session: invalidate the old token and create a new one.
 */
export async function rotateSession(oldToken: string) {
  const session = await prisma.session.findUnique({
    where: { token: oldToken },
    select: { id: true, accountId: true, expiresAt: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  const newToken = crypto.randomBytes(32).toString("hex");
  await prisma.session.update({
    where: { id: session.id },
    data: { token: newToken },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });

  return newToken;
}

/**
 * Revoke all sessions for a given account.
 */
export async function revokeAllSessions(accountId: string) {
  const result = await prisma.session.deleteMany({ where: { accountId } });
  logger.info("[auth] All sessions revoked", {
    accountId,
    sessionsRevoked: result.count,
  });
}

/**
 * Revoke all unused magic links for a given account.
 */
export async function revokeAllMagicLinks(accountId: string) {
  await prisma.magicLink.deleteMany({ where: { accountId, usedAt: null } });
}

/**
 * Create an account + magic link for a brand new user (called from Stripe webhook)
 */
export async function createAccountWithMagicLink(
  email: string,
  name?: string
) {
  // Use upsert to prevent unique constraint violations from concurrent
  // Stripe webhook deliveries for the same email.
  const account = await prisma.account.upsert({
    where: { email },
    update: {},
    create: { email, name },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days for welcome link
  );

  await prisma.magicLink.create({
    data: {
      token,
      accountId: account.id,
      expiresAt,
    },
  });

  return {
    url: `${getAppUrl()}/api/auth/verify?token=${token}`,
    token,
    account,
  };
}
