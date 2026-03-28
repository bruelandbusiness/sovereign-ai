/**
 * Upstash Redis client singleton.
 *
 * Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the
 * environment. Returns `null` when the env vars are missing (local dev
 * without Redis).
 */

import { Redis } from "@upstash/redis";

let instance: Redis | null = null;

/**
 * Return the shared Upstash Redis client, or `null` when the required
 * environment variables are not configured.
 */
export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  if (!instance) {
    instance = new Redis({ url, token });
  }

  return instance;
}
