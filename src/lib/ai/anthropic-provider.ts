import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import type { AiProvider } from "./provider";
import { buildSystemPrompt, buildUserPrompt, type PromptContext } from "./prompt";
import { parseAiOptimizationResult, type AiOptimizationResult } from "./schema";
import { fetchAndEncodeImages } from "./image-utils";

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;

  constructor() {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async generateOptimization(
    ctx: PromptContext,
    imageUrls: string[],
  ): Promise<AiOptimizationResult> {
    const images = await fetchAndEncodeImages(imageUrls);

    const message = await this.client.messages.create({
      model: env.AI_MODEL,
      max_tokens: 8000,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            ...images.map(
              (img): Anthropic.ImageBlockParam => ({
                type: "image",
                source: { type: "base64", media_type: img.mediaType as never, data: img.base64 },
              }),
            ),
            { type: "text", text: buildUserPrompt(ctx) },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Réponse IA sans contenu texte exploitable.");
    }

    const jsonText = extractJson(textBlock.text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("La réponse IA n'est pas un JSON valide.");
    }

    return parseAiOptimizationResult(parsed);
  }
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  // Handle providers that wrap JSON in markdown fences despite instructions.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];
  return trimmed;
}
