import { env } from "@/lib/env";
import type { AiProvider } from "./provider";
import { MockAiProvider } from "./mock-provider";
import { AnthropicProvider } from "./anthropic-provider";

let provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (!provider) {
    provider = env.AI_MOCK_MODE ? new MockAiProvider() : new AnthropicProvider();
  }
  return provider;
}

export type { PromptContext, OrientationContext, ExistingKeywordUsage } from "./prompt";
export type { AiOptimizationResult } from "./schema";
