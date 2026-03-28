import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// In-memory audio cache with TTL
//
// Generated ElevenLabs audio clips are stored here so Twilio can fetch them
// via <Play> URL. Each entry expires after 5 minutes to avoid unbounded
// memory growth.
// ---------------------------------------------------------------------------

interface AudioEntry {
  buffer: Buffer;
  createdAt: number;
}

/** TTL for cached audio clips (5 minutes). */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Global audio cache. Shared across all request handlers in the same
 * Node.js process. Exported so voice-tts.ts can write entries.
 */
const globalAudioCache = globalThis as unknown as {
  __audioCache?: Map<string, AudioEntry>;
};

if (!globalAudioCache.__audioCache) {
  globalAudioCache.__audioCache = new Map<string, AudioEntry>();
}

export const audioCache: Map<string, AudioEntry> = globalAudioCache.__audioCache;

/**
 * Store an audio buffer in the cache.
 */
export function cacheAudio(id: string, buffer: Buffer): void {
  // Evict expired entries opportunistically
  const now = Date.now();
  for (const [key, entry] of audioCache) {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      audioCache.delete(key);
    }
  }
  audioCache.set(id, { buffer, createdAt: now });
}

// ---------------------------------------------------------------------------
// GET /api/services/voice/audio/[id]
//
// Serves a cached audio clip to Twilio's <Play> verb.
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { rateLimitByIP } = await import("@/lib/rate-limit");
    const { allowed } = await rateLimitByIP(ip, "voice-audio", 300);
    if (!allowed) {
      return new Response("Too many requests", { status: 429 });
    }

    const { id } = await params;

    const entry = audioCache.get(id);
    if (!entry) {
      return new Response("Not found", { status: 404 });
    }

    // Check TTL
    if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
      audioCache.delete(id);
      return new Response("Expired", { status: 410 });
    }

    return new Response(new Uint8Array(entry.buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(entry.buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}
