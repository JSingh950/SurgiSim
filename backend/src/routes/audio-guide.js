import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createAudioGuideStream } from "../services/elevenlabs.js";

const router = Router();

router.post("/audio-guide", requireAuth, async (req, res) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!text) {
      return res.status(400).json({
        error: "text is required.",
      });
    }

    const audioResponse = await createAudioGuideStream(text);

    res.setHeader(
      "Content-Type",
      audioResponse.headers["content-type"] ?? "audio/mpeg",
    );

    audioResponse.data.on("error", (streamError) => {
      res.destroy(streamError);
    });

    audioResponse.data.pipe(res);

    return undefined;
  } catch (error) {
    const statusCode = error.statusCode ?? 502;

    return res.status(statusCode).json({
      error: error.message ?? "Audio guide generation failed.",
    });
  }
});

export default router;
