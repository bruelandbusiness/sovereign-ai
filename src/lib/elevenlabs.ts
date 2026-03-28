import { logger } from "@/lib/logger";
/**
 * ElevenLabs Text-to-Speech integration
 *
 * Converts text to human-quality speech using ElevenLabs API.
 * Falls back gracefully if API key is not configured.
 *
 * Available voice IDs:
 *   "21m00Tcm4TlvDq8ikWAM" = Rachel (warm female)
 *   "EXAVITQu4vr4xnSDxMaL" = Bella (soft female)
 *   "ErXwobaYiN019PkySvjV"  = Antoni (warm male)
 *   "VR6AewLTigWG4xSOukaG"  = Arnold (professional male)
 *   "pNInz6obpgDQGcFmaJgB"  = Adam (deep male)
 */

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

/**
 * Convert text to speech using ElevenLabs API.
 *
 * @param text    The text to speak
 * @param voiceId ElevenLabs voice ID (defaults to ELEVENLABS_VOICE_ID env var)
 * @returns       Audio buffer (mp3) or null if ElevenLabs is not configured / fails
 */
export async function textToSpeech(
  text: string,
  voiceId?: string,
): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return null;
  }

  const resolvedVoiceId =
    voiceId ||
    process.env.ELEVENLABS_VOICE_ID ||
    "21m00Tcm4TlvDq8ikWAM"; // Rachel (warm female)

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout for TTS

  try {
    const response = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${resolvedVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      logger.error(
        `[elevenlabs] API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (controller.signal.aborted) {
      logger.error("[elevenlabs] Request timed out after 30s");
    } else {
      logger.errorWithCause("[elevenlabs] Request failed:", error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
