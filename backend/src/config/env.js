import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(moduleDirectory, "../../..");

const dotenvCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
  resolve(repoRoot, ".env"),
];

for (const candidate of dotenvCandidates) {
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

const firstDefined = (...values) => values.find((value) => Boolean(value)) ?? "";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  auth0Audience: process.env.AUTH0_AUDIENCE ?? "",
  auth0IssuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL ?? "",
  mongodbUri: process.env.MONGODB_URI ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "",
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
  elevenLabsModelId:
    process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
  elevenLabsOutputFormat:
    process.env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_128",
  snowflakeAccount: process.env.SNOWFLAKE_ACCOUNT ?? "",
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE ?? "",
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA ?? "",
  snowflakeWarehouse: process.env.SNOWFLAKE_WAREHOUSE ?? "",
  snowflakeRole: process.env.SNOWFLAKE_ROLE ?? "",
  snowflakeApiUrl:
    process.env.SNOWFLAKE_API_URL ??
    (process.env.SNOWFLAKE_ACCOUNT
      ? `https://${process.env.SNOWFLAKE_ACCOUNT}.snowflakecomputing.com/api/v2/statements`
      : ""),
  snowflakeToken: firstDefined(
    process.env.SNOWFLAKE_API_TOKEN,
    process.env.SNOWFLAKE_PAT,
    process.env.SNOWFLAKE_ACCESS_TOKEN,
    process.env.SNOWFLAKE_TOKEN,
    process.env.SNOWFLAKE_PASSWORD,
  ),
  snowflakeTokenType: process.env.SNOWFLAKE_TOKEN_TYPE ?? "",
  snowflakeRagTable: process.env.SNOWFLAKE_RAG_TABLE ?? "",
  snowflakeRagQuery: process.env.SNOWFLAKE_RAG_QUERY ?? "",
};

export function getMissingAuth0Env() {
  return [
    !env.auth0Audience && "AUTH0_AUDIENCE",
    !env.auth0IssuerBaseURL && "AUTH0_ISSUER_BASE_URL",
  ].filter(Boolean);
}

export function getMissingMongoEnv() {
  return [!env.mongodbUri && "MONGODB_URI"].filter(Boolean);
}

export function getMissingGeminiEnv() {
  return [
    !env.geminiApiKey && "GEMINI_API_KEY",
    !env.geminiModel && "GEMINI_MODEL",
  ].filter(Boolean);
}

export function getMissingElevenLabsEnv() {
  return [
    !env.elevenLabsApiKey && "ELEVENLABS_API_KEY",
    !env.elevenLabsVoiceId && "ELEVENLABS_VOICE_ID",
  ].filter(Boolean);
}

export function getMissingSnowflakeEnv() {
  return [
    !env.snowflakeApiUrl && "SNOWFLAKE_API_URL or SNOWFLAKE_ACCOUNT",
    !env.snowflakeToken &&
      "SNOWFLAKE_API_TOKEN or SNOWFLAKE_PAT or SNOWFLAKE_ACCESS_TOKEN",
    !env.snowflakeDatabase && "SNOWFLAKE_DATABASE",
    !env.snowflakeSchema && "SNOWFLAKE_SCHEMA",
    !env.snowflakeWarehouse && "SNOWFLAKE_WAREHOUSE",
    !env.snowflakeRole && "SNOWFLAKE_ROLE",
    !env.snowflakeRagTable && !env.snowflakeRagQuery && "SNOWFLAKE_RAG_TABLE or SNOWFLAKE_RAG_QUERY",
  ].filter(Boolean);
}
