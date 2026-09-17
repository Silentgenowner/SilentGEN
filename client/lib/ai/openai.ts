import OpenAI from "openai";

/*
|--------------------------------------------------------------------------
| OPENAI SINGLETON
|--------------------------------------------------------------------------
|
| We create the client lazily instead of at module load time.
|
| This prevents Next.js build/dev environments from crashing
| before OPENAI_API_KEY is available.
|
*/

let openAIClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (openAIClient) {
    return openAIClient;
  }

  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured in .env.local"
    );
  }

  openAIClient = new OpenAI({
    apiKey,
  });

  return openAIClient;
}