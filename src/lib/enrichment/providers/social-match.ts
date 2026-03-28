import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const TAG = "[enrichment/social-match]";

export interface SocialProfiles {
  linkedin?: string;
  facebook?: string;
  twitter?: string;
}

/**
 * Search for social media profiles matching a person's name and optional
 * location. Uses a configurable social-match API (e.g. Pipl, FullContact).
 *
 * Returns an empty object when the API key is not configured.
 */
export async function findSocialProfiles(
  name: string,
  location?: string,
): Promise<SocialProfiles> {
  const apiKey = env.ENRICHMENT_SOCIAL_MATCH_KEY;

  if (!apiKey) {
    logger.warn(`${TAG} ENRICHMENT_SOCIAL_MATCH_KEY not configured — skipping`);
    return {};
  }

  const baseUrl =
    process.env.ENRICHMENT_SOCIAL_MATCH_URL ??
    "https://api.fullcontact.com/v3/person.enrich";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fullName: name,
        location: location ?? undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn(`${TAG} API returned ${response.status}`, {
        name,
        location,
        status: response.status,
      });
      return {};
    }

    const data = await response.json();

    // Normalize the response — different APIs use different shapes
    const profiles: SocialProfiles = {};
    const socials: Array<{ type?: string; url?: string }> =
      data.socialProfiles ?? data.social_profiles ?? data.profiles ?? [];

    for (const profile of socials) {
      const type = (profile.type ?? "").toLowerCase();
      const url = profile.url;
      if (!url) continue;

      if (type.includes("linkedin")) profiles.linkedin = url;
      else if (type.includes("facebook")) profiles.facebook = url;
      else if (type.includes("twitter") || type.includes("x.com"))
        profiles.twitter = url;
    }

    // Fallback: some APIs return direct fields
    if (!profiles.linkedin && data.linkedin) profiles.linkedin = data.linkedin;
    if (!profiles.facebook && data.facebook) profiles.facebook = data.facebook;
    if (!profiles.twitter && (data.twitter ?? data.x)) {
      profiles.twitter = data.twitter ?? data.x;
    }

    logger.info(`${TAG} Social match complete`, {
      name,
      found: Object.keys(profiles).length,
    });

    return profiles;
  } catch (error) {
    logger.errorWithCause(`${TAG} Social match failed`, error, {
      name,
      location,
    });
    return {};
  }
}
