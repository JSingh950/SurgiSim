import { GoogleGenerativeAI } from "@google/generative-ai";
import { env, getMissingGeminiEnv } from "../config/env.js";

const CHIEF_NEUROSURGEON_SYSTEM_PROMPT = `
You are the Chief Neurosurgeon AI Agent for NeuroSim Web3.
Give concise, high-signal coaching for brain anatomy exploration and simulated neurosurgery.
Prioritize patient safety, anatomical accuracy, surgical sequencing, risk awareness, and corrective feedback.
When Snowflake RAG context is supplied, ground your answer in that context.
When user progress data is supplied, tailor the guidance to the learner's completed steps and quiz performance.
Do not fabricate clinical certainty when the supplied context is thin; state limits clearly and guide the next safe action.
`;

function assertGeminiConfig() {
  const missing = getMissingGeminiEnv();

  if (missing.length > 0) {
    const error = new Error(
      `Gemini configuration is incomplete: ${missing.join(", ")}`,
    );
    error.statusCode = 503;
    throw error;
  }
}

export async function generateMentorResponse({
  query,
  snowflakeContext,
  userId,
  neuroProgress,
}) {
  assertGeminiConfig();

  const client = new GoogleGenerativeAI(env.geminiApiKey);
  const model = client.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: CHIEF_NEUROSURGEON_SYSTEM_PROMPT,
  });

  const prompt = `
User ID: ${userId}

User progress:
${neuroProgress ? JSON.stringify(neuroProgress, null, 2) : "No NeuroProgress record found yet."}

Snowflake RAG context:
${snowflakeContext || "No Snowflake context provided."}

User query:
${query}

Respond as the Chief Neurosurgeon. Keep the answer educational, specific, and clinically calm.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim();

  if (!text) {
    const error = new Error("Gemini returned an empty mentor response.");
    error.statusCode = 502;
    throw error;
  }

  return text;
}
