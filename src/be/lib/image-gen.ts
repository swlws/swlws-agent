import OpenAI from "openai";

function createClient(): OpenAI {
  const apiKey = process.env.SWLWS_IMAGE_GEN_API_KEY;
  if (!apiKey) throw new Error("SWLWS_IMAGE_GEN_API_KEY is not set");

  return new OpenAI({
    apiKey,
    baseURL: process.env.SWLWS_IMAGE_GEN_BASE_URL,
  });
}

/**
 * Image generation
 */
export async function generateImage(
  prompt: string,
  options: { model?: string } = {},
): Promise<string> {
  const client = createClient();
  const model = options.model || process.env.SWLWS_IMAGE_GEN_MODEL;
  if (!model) throw new Error("SWLWS_IMAGE_GEN_MODEL is not set");

  const response = await client.images.generate({
    model,
    prompt,
    response_format: "url",
  });

  if (!response.data || response.data.length === 0) {
    throw new Error("No image data returned from image generation service");
  }

  return response.data[0].url ?? "";
}
