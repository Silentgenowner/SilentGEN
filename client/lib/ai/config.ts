/*
|--------------------------------------------------------------------------
| SILENTGEN AI CONFIG
|--------------------------------------------------------------------------
*/

function readPositiveInteger(
  value: string | undefined,
  fallback: number
) {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return Math.floor(parsed);
}

export const AI_CONFIG = {
  model:
    process.env.OPENAI_AI_MODEL?.trim() ||
    "gpt-5.6-terra",

  maxToolRounds: readPositiveInteger(
    process.env.AI_MAX_TOOL_ROUNDS,
    4
  ),

  maxMessageLength: 4000,

  historyLimit: 16,

  productLimit: 12,
} as const;