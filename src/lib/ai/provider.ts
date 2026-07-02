import type { AiOptimizationResult } from "./schema";
import type { PromptContext } from "./prompt";

export interface AiProvider {
  generateOptimization(ctx: PromptContext, imageUrls: string[]): Promise<AiOptimizationResult>;
}
