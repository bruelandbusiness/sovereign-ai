/**
 * VAPI Voice AI Client
 *
 * Handles inbound receptionist and outbound warm-call flows via the VAPI
 * platform.  Falls back to Bland.ai config when needed.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const AI_VOICE_MODEL =
  process.env.CLAUDE_VOICE_MODEL || "claude-sonnet-4-20250514";

export interface VAPIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface AssistantConfig {
  model: string;
  voice: string;
  firstMessage: string;
  systemPrompt: string;
  endCallPhrases: string[];
  maxDurationSeconds: number;
  silenceTimeoutSeconds: number;
  recordingEnabled: boolean;
}

export interface CallOutcome {
  callId: string;
  status: "completed" | "no_answer" | "voicemail" | "failed";
  durationSeconds: number;
  outcome:
    | "appointment_booked"
    | "interested"
    | "not_interested"
    | "voicemail"
    | "callback_requested"
    | "unknown";
  transcript?: string;
  recordingUrl?: string;
}

export interface ClientVoiceConfig {
  companyName: string;
  agentName: string;
  services: string[];
  businessHours: string;
  emergencyNumber?: string;
  brandVoice?: string;
}

// ---------------------------------------------------------------------------
// Defaults & Constants
// ---------------------------------------------------------------------------

export const VAPI_DEFAULTS: AssistantConfig = {
  model: AI_VOICE_MODEL,
  voice: "jennifer",
  firstMessage:
    "Hi, thanks for calling {company_name}! This is {agent_name}, how can I help you today?",
  systemPrompt: "", // Loaded from AGENTS.md voice receptionist config
  endCallPhrases: ["goodbye", "have a great day", "that's all I needed"],
  maxDurationSeconds: 300,
  silenceTimeoutSeconds: 10,
  recordingEnabled: true,
};

export const VAPI_RATE_LIMITS = {
  concurrentCalls: 10,
  callsPerMinute: 30,
};

export const VAPI_COSTS = {
  inboundPerMinute: 0.05,
  outboundPerMinute: 0.07,
  phoneNumberMonthly: 2.0,
};

/** Bland.ai alternative provider configuration. */
export const BLAND_CONFIG = {
  baseUrl: "https://api.bland.ai/v1",
  keyEnvVar: "BLAND_API_KEY",
  costPerMinute: 0.09,
  phoneNumberMonthly: 2.0,
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class VAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "VAPIError";
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

interface VAPIClient {
  config: VAPIConfig;
  createAssistant: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
  createCall: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

/**
 * Create a VAPI HTTP client.
 *
 * When no config (or partial config) is provided the missing values are read
 * from environment variables (`VAPI_API_KEY`).  The default base URL points
 * to the VAPI v1 API.
 */
export function createVAPIClient(config?: Partial<VAPIConfig>): VAPIClient {
  const resolved: VAPIConfig = {
    baseUrl: config?.baseUrl ?? "https://api.vapi.ai",
    apiKey: config?.apiKey ?? process.env.VAPI_API_KEY ?? "",
  };

  if (!resolved.apiKey) {
    throw new VAPIError("VAPI API key is required. Set VAPI_API_KEY or pass it in config.");
  }

  async function request(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const url = `${resolved.baseUrl}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resolved.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      const retryable = res.status === 429 || res.status >= 500;
      throw new VAPIError(
        `VAPI ${path} failed (${res.status}): ${text}`,
        res.status,
        retryable,
      );
    }

    return (await res.json()) as Record<string, unknown>;
  }

  return {
    config: resolved,
    createAssistant: (body) => request("/assistant", body),
    createCall: (body) => request("/call", body),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSystemPrompt(clientConfig: ClientVoiceConfig): string {
  const servicesList = clientConfig.services.map((s) => `- ${s}`).join("\n");
  const emergencyLine = clientConfig.emergencyNumber
    ? `If the caller has an emergency, transfer them to ${clientConfig.emergencyNumber}.`
    : "";
  const voiceLine = clientConfig.brandVoice
    ? `Speak in a ${clientConfig.brandVoice} tone.`
    : "Speak in a warm, professional tone.";

  return [
    `You are ${clientConfig.agentName}, the AI receptionist for ${clientConfig.companyName}.`,
    voiceLine,
    "",
    "Services offered:",
    servicesList,
    "",
    `Business hours: ${clientConfig.businessHours}`,
    emergencyLine,
    "",
    "Your goals:",
    "1. Answer questions about services and pricing.",
    "2. Book appointments when the caller is ready.",
    "3. Collect the caller's name, phone number, and service needed.",
    "4. If you cannot help, offer to have someone call them back.",
  ]
    .filter(Boolean)
    .join("\n");
}

function interpolateFirstMessage(template: string, clientConfig: ClientVoiceConfig): string {
  return template
    .replace("{company_name}", clientConfig.companyName)
    .replace("{agent_name}", clientConfig.agentName);
}

function classifyOutcome(transcript: string): CallOutcome["outcome"] {
  const lower = transcript.toLowerCase();
  if (lower.includes("appointment") || lower.includes("book") || lower.includes("schedule")) {
    return "appointment_booked";
  }
  if (lower.includes("interested") || lower.includes("tell me more") || lower.includes("sounds good")) {
    return "interested";
  }
  if (lower.includes("not interested") || lower.includes("no thanks") || lower.includes("remove me")) {
    return "not_interested";
  }
  if (lower.includes("voicemail") || lower.includes("leave a message")) {
    return "voicemail";
  }
  if (lower.includes("call me back") || lower.includes("callback") || lower.includes("call back")) {
    return "callback_requested";
  }
  return "unknown";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create an AI receptionist assistant in VAPI.
 *
 * Builds a system prompt from the supplied client configuration and registers
 * a new assistant via the VAPI API.
 *
 * @returns The newly created assistant's id.
 */
export async function createReceptionist(
  clientConfig: ClientVoiceConfig,
  vapiConfig?: Partial<VAPIConfig>,
): Promise<{ assistantId: string }> {
  const client = createVAPIClient(vapiConfig);
  const systemPrompt = buildSystemPrompt(clientConfig);
  const firstMessage = interpolateFirstMessage(VAPI_DEFAULTS.firstMessage, clientConfig);

  const result = await client.createAssistant({
    model: {
      provider: "anthropic",
      model: VAPI_DEFAULTS.model,
      systemMessage: systemPrompt,
    },
    voice: {
      provider: "11labs",
      voiceId: VAPI_DEFAULTS.voice,
    },
    firstMessage,
    endCallPhrases: VAPI_DEFAULTS.endCallPhrases,
    maxDurationSeconds: VAPI_DEFAULTS.maxDurationSeconds,
    silenceTimeoutSeconds: VAPI_DEFAULTS.silenceTimeoutSeconds,
    recordingEnabled: VAPI_DEFAULTS.recordingEnabled,
  });

  const assistantId = result.id as string | undefined;
  if (!assistantId) {
    throw new VAPIError("VAPI did not return an assistant id.");
  }

  return { assistantId };
}

/**
 * Initiate an outbound warm call to a qualified lead.
 *
 * Only leads with a score of 60 or above and a non-empty phone number are
 * eligible.  The call is placed via the VAPI outbound call API.
 *
 * @returns The call id and its initial status.
 */
export async function makeWarmCall(
  lead: { phone: string; name: string; score: number; signals: string[] },
  clientConfig: ClientVoiceConfig,
  vapiConfig?: Partial<VAPIConfig>,
): Promise<{ callId: string; status: string }> {
  if (lead.score < 60) {
    throw new VAPIError(`Lead score ${lead.score} is below the minimum threshold of 60.`);
  }
  if (!lead.phone || lead.phone.trim().length === 0) {
    throw new VAPIError("Lead phone number is required for outbound calls.");
  }

  const client = createVAPIClient(vapiConfig);

  const signalsSummary = lead.signals.length > 0 ? lead.signals.join(", ") : "general interest";
  const systemPrompt = [
    `You are ${clientConfig.agentName} calling on behalf of ${clientConfig.companyName}.`,
    `You are calling ${lead.name} who has shown interest (score: ${lead.score}).`,
    `Interest signals: ${signalsSummary}.`,
    "",
    "Your goals:",
    "1. Introduce yourself and the company warmly.",
    "2. Reference why you are calling (their expressed interest).",
    "3. Answer questions about services.",
    "4. Book an appointment or schedule a callback.",
    "5. Be respectful — if they are not interested, thank them and end the call.",
  ].join("\n");

  const firstMessage = `Hi ${lead.name}, this is ${clientConfig.agentName} from ${clientConfig.companyName}. I'm reaching out because you recently expressed interest in our services. Do you have a moment to chat?`;

  const result = await client.createCall({
    assistantOverrides: {
      model: {
        provider: "anthropic",
        model: VAPI_DEFAULTS.model,
        systemMessage: systemPrompt,
      },
      firstMessage,
      recordingEnabled: VAPI_DEFAULTS.recordingEnabled,
    },
    phoneNumber: lead.phone,
    type: "outbound",
  });

  const callId = result.id as string | undefined;
  const status = (result.status as string) ?? "queued";
  if (!callId) {
    throw new VAPIError("VAPI did not return a call id.");
  }

  return { callId, status };
}

/**
 * Process a VAPI call-ended webhook payload.
 *
 * Extracts the transcript, duration, and recording URL from the webhook data
 * and classifies the call outcome using simple keyword matching.
 */
export async function handleCallEnded(
  webhookData: Record<string, unknown>,
): Promise<CallOutcome> {
  const callId = (webhookData.call_id ?? webhookData.callId ?? "") as string;
  const rawStatus = (webhookData.status ?? "completed") as string;
  const durationSeconds = (webhookData.duration_seconds ?? webhookData.durationSeconds ?? 0) as number;
  const transcript = (webhookData.transcript ?? "") as string;
  const recordingUrl = (webhookData.recording_url ?? webhookData.recordingUrl) as string | undefined;

  const statusMap: Record<string, CallOutcome["status"]> = {
    completed: "completed",
    no_answer: "no_answer",
    "no-answer": "no_answer",
    voicemail: "voicemail",
    failed: "failed",
    error: "failed",
  };

  const status: CallOutcome["status"] = statusMap[rawStatus] ?? "completed";
  const outcome = transcript ? classifyOutcome(transcript) : "unknown";

  return {
    callId,
    status,
    durationSeconds,
    outcome,
    transcript: transcript || undefined,
    recordingUrl: recordingUrl || undefined,
  };
}

/**
 * Estimate the cost of a call based on duration and direction.
 *
 * @param durationSeconds - Length of the call in seconds.
 * @param type            - Whether the call was inbound or outbound.
 * @returns Estimated cost in USD (rounded to 2 decimal places).
 */
export function estimateCallCost(
  durationSeconds: number,
  type: "inbound" | "outbound",
): number {
  const minutes = Math.ceil(durationSeconds / 60);
  const rate =
    type === "inbound"
      ? VAPI_COSTS.inboundPerMinute
      : VAPI_COSTS.outboundPerMinute;
  return Math.round(minutes * rate * 100) / 100;
}
