import type { ClientLLM } from "@browserbasehq/stagehand";
import { AI_MODEL, getVeniceClient } from "@/lib/venice-client";

type GenerateParams = Parameters<ClientLLM["generate"]>[0];

// Stagehand V4 has no base-URL option — custom providers plug in through a `generate`
// callback (library-docs.md). Stagehand only ever issues structured generations, so this
// adapter forwards each one to Venice GLM 5.2 as a strict json_schema chat completion.
// Text-only: we never request screenshots, so image blocks are rejected rather than dropped.
export const veniceStagehandModel: ClientLLM = {
  generate: async (params: GenerateParams) => {
    if (params.responseFormat?.type !== "json_schema") {
      throw new TypeError("Stagehand only issues structured generations");
    }

    const messages = params.messages.map((message) => {
      const blocks = Array.isArray(message.content) ? message.content : [message.content];
      const text = blocks
        .map((block) => {
          if (block.type !== "text") throw new TypeError("Image content is not supported");
          return block.text;
        })
        .join("\n");
      return { role: message.role, content: text };
    });

    const response = await getVeniceClient().chat.completions.create({
      model: AI_MODEL,
      temperature: params.temperature,
      // @ts-expect-error Venice-specific extension, not in the OpenAI SDK's types
      venice_parameters: { disable_thinking: true },
      response_format: {
        type: "json_schema",
        json_schema: {
          name: params.responseFormat.name,
          schema: params.responseFormat.schema as Record<string, unknown>,
          strict: true,
        },
      },
      messages: params.systemPrompt
        ? [{ role: "system", content: params.systemPrompt }, ...messages]
        : messages,
    });

    const choice = response.choices[0];
    if (choice.finish_reason === "length") throw new Error("Venice response truncated");
    const text = choice.message.content ?? "";

    return {
      role: "assistant" as const,
      content: { type: "text" as const, text },
      outputFormat: "json_schema" as const,
      structuredContent: JSON.parse(text),
    };
  },
};
