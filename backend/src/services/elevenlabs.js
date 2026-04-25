import axios from "axios";
import { env, getMissingElevenLabsEnv } from "../config/env.js";

function assertElevenLabsConfig() {
  const missing = getMissingElevenLabsEnv();

  if (missing.length > 0) {
    const error = new Error(
      `ElevenLabs configuration is incomplete: ${missing.join(", ")}`,
    );
    error.statusCode = 503;
    throw error;
  }
}

export async function createAudioGuideStream(text) {
  assertElevenLabsConfig();

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${env.elevenLabsVoiceId}/stream`,
    {
      text,
      model_id: env.elevenLabsModelId,
    },
    {
      params: {
        output_format: env.elevenLabsOutputFormat,
      },
      responseType: "stream",
      timeout: 60_000,
      headers: {
        "xi-api-key": env.elevenLabsApiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
    },
  );

  return response;
}
