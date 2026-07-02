import { env } from "@/lib/env";
import type { AiProvider } from "./provider";
import { MockAiProvider } from "./mock-provider";
import { OpenAiProvider } from "./openai-provider";

let provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (!provider) {
    provider = env.AI_MOCK_MODE ? new MockAiProvider() : new OpenAiProvider();
  }
  return provider;
}

export type { PromptContext, OrientationContext, ExistingKeywordUsage } from "./prompt";
export type { AiOptimizationResult } from "./schema";
