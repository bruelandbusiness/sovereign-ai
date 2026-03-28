/**
 * Playbooks module — outreach sequences, sales scripts, templates.
 *
 * All content sourced from PLAYBOOKS.md specifications.
 */

export { generateAcquisitionSequence } from "./acquisition-emails";
export type { AcquisitionEmailContext, GeneratedEmail } from "./acquisition-emails";

export { getVerticalEmails, getAvailableCampaigns } from "./vertical-templates";
export type { VerticalEmailContext, VerticalEmail, Vertical, Season } from "./vertical-templates";

export { generateSms, SMS_TEMPLATES } from "./sms-templates";
export type { SmsContext, SmsMessage, SmsTemplateKey } from "./sms-templates";

export { SEQUENCES, ENGAGEMENT_TRIGGERS, getTriggeredAction, isStepConditionMet, getRecommendedSequence } from "./sequences";
export type { SequenceStep, SequenceDefinition, EngagementTrigger, TriggerAction } from "./sequences";

export { getObjectionResponse, detectObjection } from "./objection-handlers";
export type { ObjectionContext, ObjectionResponse } from "./objection-handlers";

export { generateDiscoveryCallScript, generateLoomScript } from "./sales-scripts";
export type { DiscoveryCallContext, CallScript, LoomContext } from "./sales-scripts";

export { generateProposalHtml } from "./proposal-template";
export type { ProposalContext } from "./proposal-template";

export { KICKOFF_CHECKLIST, createChecklistState, completeChecklistItem, getChecklistProgress, getManualActionItems } from "./kickoff-checklist";
export type { ChecklistItem, ClientChecklistState } from "./kickoff-checklist";
