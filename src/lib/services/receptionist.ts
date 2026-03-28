import { prisma } from "@/lib/db";
import { twilioPhoneNumber } from "@/lib/twilio";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractTextContent,
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CallScriptResult {
  greeting: string;
  mainScript: string;
  closingScript: string;
  objectionHandlers: Array<{
    objection: string;
    response: string;
  }>;
  callType: string;
}

export interface VoiceQueryResult {
  response: string;
  intent: string; // "scheduling" | "inquiry" | "emergency" | "complaint" | "general"
  shouldTransfer: boolean;
  suggestedAction: string;
  leadCaptured: boolean;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the AI Receptionist service for a client.
 * Creates a ReceptionistConfig record with defaults derived from the
 * client's business info and stores the Twilio phone number in the
 * ClientService config.
 */
export async function provisionReceptionist(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const existing = await prisma.receptionistConfig.findUnique({
    where: { clientId },
  });

  if (!existing) {
    await prisma.receptionistConfig.create({
      data: {
        clientId,
        isActive: true,
        greeting: `Thank you for calling ${client.businessName}! How can I help you today?`,
        businessName: client.businessName,
        emergencyKeywords: JSON.stringify([
          "emergency",
          "flood",
          "leak",
          "fire",
          "no heat",
          "no AC",
          "burst pipe",
        ]),
        emergencyAction: "transfer",
        emergencyPhone: client.phone ?? undefined,
        voiceId: "alloy",
        maxCallMinutes: 10,
        collectInfo: JSON.stringify([
          "name",
          "phone",
          "address",
          "issue_description",
        ]),
        canBookJobs: true,
      },
    });
  }

  const clientService = await prisma.clientService.findUnique({
    where: {
      clientId_serviceId: { clientId, serviceId: "ai-receptionist" },
    },
  });

  if (clientService) {
    const receptionistServiceConfig = {
      twilioPhoneNumber: twilioPhoneNumber ?? "pending-assignment",
      businessName: client.businessName,
      vertical: client.vertical ?? "home service",
    };

    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(receptionistServiceConfig) },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "call_booked",
      title: "AI Receptionist activated",
      description: `Your AI Receptionist is now live for ${client.businessName}. Incoming calls will be answered, qualified, and jobs will be booked automatically.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateCallScript — create call handling scripts
// ---------------------------------------------------------------------------

/**
 * Generate a call handling script for different call scenarios.
 *
 * Supports multiple call types:
 * - "new_inquiry"       — first-time caller looking for services
 * - "existing_customer" — returning customer with a question or request
 * - "emergency"         — urgent/emergency service request
 * - "after_hours"       — calls received outside business hours
 *
 * @param clientId - The client whose brand to use
 * @param callType - Type of call to script
 */
export async function generateCallScript(
  clientId: string,
  callType: string
): Promise<CallScriptResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const config = await prisma.receptionistConfig.findUnique({
    where: { clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeCallType = sanitizeForPrompt(callType, 50);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const callTypeGuidelines: Record<string, string> = {
    new_inquiry: `NEW INQUIRY CALL:
- Warmly greet the caller and introduce yourself as ${safeBusinessName}
- Ask what service they need and gather their address/location
- Explain your services briefly and build confidence
- Collect their name, phone number, email, and preferred scheduling
- Offer a free estimate and try to schedule on the call
- If they need to think about it, confirm you'll send follow-up info`,

    existing_customer: `EXISTING CUSTOMER CALL:
- Greet warmly and thank them for being a valued customer
- Quickly identify their account and previous service history
- Listen to their request (new service, warranty, complaint, scheduling)
- Resolve their issue or escalate appropriately
- Check if they need any additional services
- Thank them for their continued trust`,

    emergency: `EMERGENCY CALL:
- Immediately acknowledge the urgency and reassure the caller
- Collect critical info: what's the emergency, address, name, phone
- Confirm a technician will be dispatched ASAP
- Provide safety instructions if applicable (turn off water/gas/electric)
- Give realistic ETA expectations
- Transfer to the on-call technician if available at ${client.phone || "[phone]"}`,

    after_hours: `AFTER-HOURS CALL:
- Greet and let them know they've reached ${safeBusinessName} outside business hours
- Determine if this is an emergency (refer to emergency protocol if so)
- For non-emergency: collect their name, number, and brief description
- Assure them someone will call back first thing in the morning
- Provide business hours: Monday-Friday, 9 AM - 5 PM
- If emergency, offer to connect them to the emergency line`,
  };

  const guidelines =
    callTypeGuidelines[safeCallType] ||
    `Handle this ${safeCallType} call professionally. Collect caller info and try to schedule service.`;

  const systemPrompt = `You are a call script writer for ${safeBusinessName}, a ${safeVertical} company${safeLocation ? ` in ${safeLocation}` : ""}. Write natural, conversational scripts that sound human — not robotic or overly formal. The AI receptionist should sound warm, knowledgeable, and efficient.`;

  const userPrompt = `Create a complete call script for ${safeBusinessName}.

Call type: ${safeCallType}
Business phone: ${client.phone || "N/A"}
Owner: ${safeOwnerName}
Greeting: ${config?.greeting || `Thank you for calling ${client.businessName}!`}

${guidelines}

Return a JSON object with:
- "greeting": the opening greeting (2-3 sentences)
- "mainScript": the main body of the call script with natural dialogue flow (use [CALLER] for caller responses). Include information gathering and service discussion.
- "closingScript": how to wrap up the call professionally
- "objectionHandlers": array of 3-4 common objections with responses:
  - "objection": what the caller might say
  - "response": how to handle it`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "receptionist.script",
      description: `Generate ${safeCallType} call script`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<CallScriptResult>>(response, {});

    const result: CallScriptResult = {
      greeting:
        parsed.greeting ||
        config?.greeting ||
        `Thank you for calling ${client.businessName}! How can I help you today?`,
      mainScript:
        parsed.mainScript ||
        `I'd be happy to help you with that. Let me get a few details so we can get you taken care of. Can I start with your name and the best number to reach you?`,
      closingScript:
        parsed.closingScript ||
        `Thank you for calling ${client.businessName}! We'll be in touch shortly. Have a great day!`,
      objectionHandlers: Array.isArray(parsed.objectionHandlers)
        ? parsed.objectionHandlers
        : generateFallbackObjectionHandlers(client.businessName),
      callType,
    };

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "call_booked",
        title: `Call script generated: ${callType}`,
        description: `AI-generated ${callType} call script created for ${client.businessName} with ${result.objectionHandlers.length} objection handlers.`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[receptionist] Call script generation failed:", error);

    return {
      greeting:
        config?.greeting || `Thank you for calling ${client.businessName}! How can I help you today?`,
      mainScript: `I'd be happy to help you with that. Can I get your name and the best number to reach you? I'll also need a brief description of what you need help with so we can get the right team member to assist you.`,
      closingScript: `Thank you for calling ${client.businessName}! We'll follow up with you shortly. Have a great day!`,
      objectionHandlers: generateFallbackObjectionHandlers(client.businessName),
      callType,
    };
  }
}

// ---------------------------------------------------------------------------
// handleVoiceQuery — process voice transcripts and generate responses
// ---------------------------------------------------------------------------

/**
 * Process a voice transcript from an incoming call and generate an
 * appropriate response.
 *
 * Analyzes the transcript for intent (scheduling, inquiry, emergency,
 * complaint), extracts relevant information, and generates a contextual
 * AI response.
 *
 * @param clientId   - The client whose receptionist is handling the call
 * @param transcript - The voice transcript text
 */
export async function handleVoiceQuery(
  clientId: string,
  transcript: string
): Promise<VoiceQueryResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const config = await prisma.receptionistConfig.findUnique({
    where: { clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeTranscript = sanitizeForPrompt(transcript, 1000);

  // Check for emergency keywords
  let emergencyKeywords: string[] = [];
  try {
    emergencyKeywords = config?.emergencyKeywords
      ? JSON.parse(config.emergencyKeywords)
      : ["emergency", "flood", "leak", "fire"];
  } catch {
    emergencyKeywords = ["emergency", "flood", "leak", "fire"];
  }

  const isEmergency = emergencyKeywords.some((kw) =>
    safeTranscript.toLowerCase().includes(kw.toLowerCase())
  );

  const systemPrompt = `You are the AI receptionist for ${safeBusinessName}, a ${safeVertical} company. You are currently handling a phone call. Respond naturally and conversationally — keep responses brief (1-3 sentences) since this is a phone conversation. Be warm, helpful, and professional. Your goal is to help the caller and capture their information if they're a potential customer.`;

  const userPrompt = `The caller said: "${safeTranscript}"

${isEmergency ? "IMPORTANT: This appears to be an EMERGENCY call. Prioritize urgency and safety." : ""}

Analyze this transcript and respond appropriately.

Return a JSON object with:
- "response": your spoken response to the caller (1-3 sentences, conversational)
- "intent": the caller's intent: "scheduling" | "inquiry" | "emergency" | "complaint" | "general"
- "shouldTransfer": true if this call should be transferred to a human (emergencies, complex complaints, explicit requests)
- "suggestedAction": what should happen next (e.g., "book appointment", "send estimate", "transfer to owner", "follow up by email")
- "leadCaptured": true if the caller provided contact info (name, phone, email, address)`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "receptionist.voice",
      description: "Process voice query",
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<VoiceQueryResult>>(response, {});

    const result: VoiceQueryResult = {
      response:
        parsed.response ||
        extractTextContent(response, "") ||
        "I'd be happy to help you with that. Can you tell me a bit more about what you need?",
      intent: parsed.intent || (isEmergency ? "emergency" : "general"),
      shouldTransfer: parsed.shouldTransfer || isEmergency,
      suggestedAction:
        parsed.suggestedAction ||
        (isEmergency ? "Transfer to emergency line immediately" : "Continue gathering information"),
      leadCaptured: parsed.leadCaptured || false,
    };

    // Log the call interaction
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "call_booked",
        title: `Voice query handled: ${result.intent}`,
        description: `AI receptionist handled ${result.intent} call.${result.shouldTransfer ? " Call flagged for transfer." : ""} Action: ${result.suggestedAction}`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[receptionist] Voice query handling failed:", error);

    // Emergency fallback — always safe
    if (isEmergency) {
      return {
        response: `I understand this is urgent. Let me connect you with our emergency team right away. Please stay on the line.`,
        intent: "emergency",
        shouldTransfer: true,
        suggestedAction: "Transfer to emergency line immediately",
        leadCaptured: false,
      };
    }

    return {
      response: `Thank you for calling ${client.businessName}. I'd be happy to help you. Could you tell me your name and the best number to reach you?`,
      intent: "general",
      shouldTransfer: false,
      suggestedAction: "Continue gathering caller information",
      leadCaptured: false,
    };
  }
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackObjectionHandlers(businessName: string) {
  return [
    {
      objection: "How much does this cost?",
      response: `Great question! Pricing depends on the specific work needed, which is why we offer free estimates. We can have someone come out and give you an exact quote at no cost. Would you like to schedule that?`,
    },
    {
      objection: "I need to think about it / talk to my spouse.",
      response: `Absolutely, I understand. Would it be helpful if I sent you some information by email so you have everything you need to discuss? I can also hold a spot on our schedule for later this week in case you decide to move forward.`,
    },
    {
      objection: "I'm getting other quotes.",
      response: `That's smart — we always recommend getting multiple quotes. What I can tell you is that ${businessName} is fully licensed, insured, and we stand behind our work with a satisfaction guarantee. We'd love the chance to earn your business.`,
    },
    {
      objection: "Can you come today?",
      response: `Let me check our schedule for you. For emergencies we do our best to get someone out same-day. Can you tell me a bit more about what's going on so I can prioritize accordingly?`,
    },
  ];
}
