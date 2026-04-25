import { randomUUID } from "node:crypto";
import { Router } from "express";
import { NeuroProgress } from "../models/NeuroProgress.js";
import { getUserClaims, requireAuth } from "../middleware/auth.js";
import { createAudioGuideStream } from "../services/elevenlabs.js";
import { generateMentorResponse } from "../services/gemini.js";

const router = Router();

router.post("/mentor", requireAuth, async (req, res) => {
  try {
    const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    const snowflakeContext =
      typeof req.body?.snowflakeContext === "string"
        ? req.body.snowflakeContext.trim()
        : "";

    if (!query) {
      return res.status(400).json({
        error: "query is required.",
      });
    }

    const claims = getUserClaims(req);
    const userId = claims.sub;

    if (!userId) {
      return res.status(401).json({
        error: "Authenticated user subject is missing from the Auth0 token.",
      });
    }

    const neuroProgress = await NeuroProgress.findOne({ userId })
      .select("userId completedSteps quizScore")
      .lean();

    const mentorText = await generateMentorResponse({
      query,
      snowflakeContext,
      userId,
      neuroProgress,
    });

    const audioResponse = await createAudioGuideStream(mentorText);
    const boundary = `neurosim-${randomUUID()}`;
    const audioContentType =
      audioResponse.headers["content-type"] ?? "audio/mpeg";
    const metadata = {
      userId,
      mentorText,
      neuroProgress,
      audioContentType,
    };

    res.status(200);
    res.setHeader("Content-Type", `multipart/mixed; boundary=${boundary}`);
    res.setHeader("X-Mentor-Content-Type", audioContentType);

    res.write(`--${boundary}\r\n`);
    res.write("Content-Type: application/json; charset=utf-8\r\n\r\n");
    res.write(`${JSON.stringify(metadata)}\r\n`);
    res.write(`--${boundary}\r\n`);
    res.write(`Content-Type: ${audioContentType}\r\n`);
    res.write("Content-Disposition: inline; filename=\"mentor-audio.mp3\"\r\n\r\n");

    audioResponse.data.on("end", () => {
      res.write(`\r\n--${boundary}--\r\n`);
      res.end();
    });

    audioResponse.data.on("error", (streamError) => {
      res.destroy(streamError);
    });

    audioResponse.data.pipe(res, { end: false });

    return undefined;
  } catch (error) {
    const statusCode = error.statusCode ?? 502;

    return res.status(statusCode).json({
      error: error.message ?? "Mentor pipeline failed.",
    });
  }
});

export default router;
