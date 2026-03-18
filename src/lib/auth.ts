import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const SESSION_COOKIE = "sovereign-session";
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 30;

export async function generateMagicLink(email: string) {
  // Find or create account
  let account = await prisma.account.findUnique({ where: { email } });
  if (!account) {
    return null; // Only existing accounts can log in
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    url: `${appUrl}/api/auth/verify?token=${token}`,
    token,
    account,
  };
}

export async function verifyMagicLink(token: string) {
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { account: true },
  });

  if (!magicLink) return null;
  if (magicLink.usedAt) return null;
  if (magicLink.expiresAt < new Date()) return null;

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  // Create session
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const session = await prisma.session.create({
    data: {
      token: sessionToken,
      accountId: magicLink.accountId,
      expiresAt,
    },
  });

  return { session, account: magicLink.account };
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
    await prisma.session.deleteMany({ where: { token: sessionToken } });
  }
  await clearSessionCookie();
}

/**
 * Create an account + magic link for a brand new user (called from Stripe webhook)
 */
export async function createAccountWithMagicLink(
  email: string,
  name?: string
) {
  let account = await prisma.account.findUnique({ where: { email } });

  if (!account) {
    account = await prisma.account.create({
      data: { email, name },
    });
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    url: `${appUrl}/api/auth/verify?token=${token}`,
    token,
    account,
  };
}
