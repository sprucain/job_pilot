import { AI_MODEL, getVeniceClient } from "@/lib/venice-client";

export type VeniceJsonFailureReason = "api_error" | "truncated" | "invalid_json";

export type VeniceJsonResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; reason: VeniceJsonFailureReason };

type VeniceJsonOptions = {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
};

// Shared scaffold for every "ask GLM 5.2 for structured JSON" call site (extraction,
// generation) — same response_format/venice_parameters contract, same JSON.parse
// try/catch. Also distinguishes a token-budget truncation (finish_reason: "length")
// from a genuine parse failure: retrying identical input after a truncation fails
// identically, so callers need to tell the two apart to give a useful error message
// instead of a generic "please try again" that can't actually be resolved by retrying.
export async function callVeniceJson(options: VeniceJsonOptions): Promise<VeniceJsonResult> {
  let response;
  try {
    response = await getVeniceClient().chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      // @ts-expect-error Venice-specific extension, not in the OpenAI SDK's types
      venice_parameters: { disable_thinking: true },
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
    });
  } catch (error) {
    console.error("[venice-json]", error);
    return { success: false, reason: "api_error" };
  }

  const choice = response.choices[0];
  if (choice.finish_reason === "length") {
    console.error("[venice-json] response truncated at max_tokens");
    return { success: false, reason: "truncated" };
  }

  try {
    const data = JSON.parse(choice.message.content ?? "");
    return { success: true, data };
  } catch (error) {
    console.error("[venice-json]", error);
    return { success: false, reason: "invalid_json" };
  }
}
