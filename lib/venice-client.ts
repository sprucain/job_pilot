import OpenAI from "openai";

export const AI_MODEL = "zai-org-glm-5-2";

let veniceClient: OpenAI | null = null;

export function getVeniceClient(): OpenAI {
  if (!veniceClient) {
    veniceClient = new OpenAI({
      apiKey: process.env.VENICE_API_KEY!,
      baseURL: "https://api.venice.ai/api/v1",
    });
  }
  return veniceClient;
}
