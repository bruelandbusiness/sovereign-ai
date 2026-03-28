import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/elevenlabs", () => ({
  textToSpeech: vi.fn(),
}));

vi.mock("@/app/api/services/voice/audio/[id]/route", () => ({
  cacheAudio: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { generateTwimlWithVoice } from "../voice-tts";
import { textToSpeech } from "@/lib/elevenlabs";
import { cacheAudio } from "@/app/api/services/voice/audio/[id]/route";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateTwimlWithVoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no ElevenLabs API key
    delete process.env.ELEVENLABS_API_KEY;
  });

  // --- XML escaping ---

  it("escapes XML special characters in Polly fallback", async () => {
    const result = await generateTwimlWithVoice('Hello & "goodbye" <world>');

    expect(result).toContain("&amp;");
    expect(result).toContain("&quot;");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
    expect(result).not.toContain("& ");
    expect(result).toContain("<Say");
  });

  it("escapes apostrophes in text", async () => {
    const result = await generateTwimlWithVoice("it's a test");

    expect(result).toContain("&apos;");
  });

  // --- Polly fallback ---

  it("returns Polly Say element when ElevenLabs is not configured", async () => {
    const result = await generateTwimlWithVoice("Hello there");

    expect(result).toBe('<Say voice="Polly.Joanna">Hello there</Say>');
  });

  it("uses custom Polly voice from config", async () => {
    const result = await generateTwimlWithVoice("Hello", {
      pollyVoice: "Polly.Matthew",
    });

    expect(result).toBe('<Say voice="Polly.Matthew">Hello</Say>');
  });

  it("falls back to Polly when useElevenLabs is explicitly false", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    const result = await generateTwimlWithVoice("Hello", {
      useElevenLabs: false,
    });

    expect(result).toContain("<Say");
    expect(textToSpeech).not.toHaveBeenCalled();
  });

  // --- ElevenLabs path ---

  it("uses ElevenLabs when API key is set and returns Play element", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    const fakeAudio = Buffer.from("fake-audio");
    vi.mocked(textToSpeech).mockResolvedValue(fakeAudio);

    const result = await generateTwimlWithVoice("Hello from ElevenLabs");

    expect(textToSpeech).toHaveBeenCalledWith("Hello from ElevenLabs", undefined);
    expect(cacheAudio).toHaveBeenCalled();
    expect(result).toContain("<Play>");
    expect(result).toContain("/api/services/voice/audio/");
    expect(result).toContain("</Play>");
  });

  it("passes custom voice ID to ElevenLabs", async () => {
    const fakeAudio = Buffer.from("audio");
    vi.mocked(textToSpeech).mockResolvedValue(fakeAudio);

    const result = await generateTwimlWithVoice("Hi", {
      useElevenLabs: true,
      elevenLabsVoiceId: "custom-voice-123",
    });

    expect(textToSpeech).toHaveBeenCalledWith("Hi", "custom-voice-123");
    expect(result).toContain("<Play>");
  });

  it("falls back to Polly when ElevenLabs returns null", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    vi.mocked(textToSpeech).mockResolvedValue(null);

    const result = await generateTwimlWithVoice("Fallback test");

    expect(result).toContain("<Say");
    expect(result).toContain("Fallback test");
  });

  it("falls back to Polly when ElevenLabs throws", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    vi.mocked(textToSpeech).mockRejectedValue(new Error("API down"));

    const result = await generateTwimlWithVoice("Error fallback");

    expect(result).toContain("<Say");
    expect(result).toContain("Error fallback");
  });

  it("escapes app URL in Play element to prevent XML injection", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_APP_URL = "http://evil.com&<script>";
    const fakeAudio = Buffer.from("audio");
    vi.mocked(textToSpeech).mockResolvedValue(fakeAudio);

    const result = await generateTwimlWithVoice("test");

    // The URL in Play should have & escaped
    expect(result).toContain("&amp;");
    expect(result).toContain("&lt;");
    expect(result).not.toContain("&<");

    // Cleanup
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
});
