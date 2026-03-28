/**
 * Voice TTS helper — transparently switches between ElevenLabs and Polly.
 *
 * Call `generateTwimlWithVoice(text, config?)` wherever you would have written
 * `<Say voice="Polly.Joanna">{text}</Say>`. If ElevenLabs is configured and
 * the client has it enabled, the text is synthesized via ElevenLabs and served
 * through a <Play> URL. Otherwise the existing Polly <Say> is returned.
 */

import { randomUUID } from "crypto";
import { textToSpeech } from "@/lib/elevenlabs";
import { cacheAudio } from "@/app/api/services/voice/audio/[id]/route";

import { logger } from "@/lib/logger";
export interface VoiceConfig {
  /** Whether to use ElevenLabs (defaults to true when API key is set). */
  useElevenLabs?: boolean;
  /** ElevenLabs voice ID override for this client. */
  elevenLabsVoiceId?: string;
  /** Polly voice name fallback. */
  pollyVoice?: string;
}

/**
 * Generate a TwiML fragment for speaking `text`.
 *
 * - If ElevenLabs is configured and enabled: generates audio, caches it,
 *   and returns a `<Play>` element pointing at the audio endpoint.
 * - Otherwise: returns a `<Say voice="Polly.Joanna">` element (current behaviour).
 *
 * @param text   The text to speak
 * @param config Optional per-client voice configuration
 * @returns      A TwiML fragment string (e.g. `<Play>...</Play>` or `<Say ...>...</Say>`)
 */
export async function generateTwimlWithVoice(
  text: string,
  config?: VoiceConfig,
): Promise<string> {
  const pollyVoice = config?.pollyVoice || "Polly.Joanna";

  // Decide whether to attempt ElevenLabs
  const elevenLabsEnabled =
    config?.useElevenLabs !== undefined
      ? config.useElevenLabs
      : !!process.env.ELEVENLABS_API_KEY;

  if (elevenLabsEnabled) {
    try {
      const audio = await textToSpeech(text, config?.elevenLabsVoiceId);
      if (audio) {
        const id = randomUUID();
        cacheAudio(id, audio);
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return `<Play>${escapeXml(appUrl)}/api/services/voice/audio/${id}</Play>`;
      }
    } catch (error) {
      logger.errorWithCause("[voice-tts] ElevenLabs failed, falling back to Polly:", error);
    }
  }

  // Fallback: Polly
  return `<Say voice="${pollyVoice}">${escapeXml(text)}</Say>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
