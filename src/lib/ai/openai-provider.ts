import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { env } from "@/lib/env";
import type { AiProvider } from "./provider";
import { buildSystemPrompt, buildUserPrompt, type PromptContext } from "./prompt";
import { aiOptimizationSchema, parseAiOptimizationResult, type AiOptimizationResult } from "./schema";

// Cap the number of images sent per request — controls cost/latency and
// matches the limit the mock/Shopify layers already assume.
const MAX_IMAGES = 5;

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async generateOptimization(
    ctx: PromptContext,
    imageUrls: string[],
  ): Promise<AiOptimizationResult> {
    // OpenAI accepts image URLs directly — no need to download/base64-encode
    // them ourselves (unlike some other vision APIs).
    const images = imageUrls.slice(0, MAX_IMAGES);

    const response = await this.client.responses.create({
      model: env.AI_MODEL,
      instructions: buildSystemPrompt(),
      input: [
        {
          role: "user",
          content: [
            ...images.map(
              (url): OpenAI.Responses.ResponseInputImage => ({
                type: "input_image",
                image_url: url,
                detail: "auto",
              }),
            ),
            { type: "input_text", text: buildUserPrompt(ctx) },
          ],
        },
      ],
      // zodTextFormat derives the strict JSON Schema straight from the Zod
      // schema that also validates the parsed result below — one source of
      // truth instead of a hand-maintained parallel schema.
      text: { format: zodTextFormat(aiOptimizationSchema, "product_seo_optimization") },
    });

    const refusal = findRefusal(response.output);
    if (refusal) {
      throw new Error(`L'IA a refusé de traiter cette demande : ${refusal}`);
    }

    if (!response.output_text) {
      throw new Error("Réponse IA sans contenu texte exploitable.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.output_text);
    } catch {
      throw new Error("La réponse IA n'est pas un JSON valide.");
    }

    return parseAiOptimizationResult(parsed);
  }
}

function findRefusal(output: OpenAI.Responses.Response["output"]): string | null {
  for (const item of output) {
    if (!("content" in item) || !item.content) continue;
    for (const part of item.content) {
      if (part.type === "refusal") return part.refusal;
    }
  }
  return null;
}
