import type { AgentDefinition } from "../runner";
import { campaignOptimizer } from "./campaign-optimizer";
import { contentStrategist } from "./content-strategist";
import { reviewResponder } from "./review-responder";
import { leadNurtureOptimizer } from "./lead-nurture-optimizer";

export const agentDefinitions: Record<string, AgentDefinition> = {
  "campaign-optimizer": campaignOptimizer,
  "content-strategist": contentStrategist,
  "review-responder": reviewResponder,
  "lead-nurture-optimizer": leadNurtureOptimizer,
};
