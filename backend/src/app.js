import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import audioGuideRouter from "./routes/audio-guide.js";
import certificateRouter from "./routes/certificate.js";
import healthRouter from "./routes/health.js";
import mentorRouter from "./routes/mentor.js";
import neuroDataRouter from "./routes/neuro-data.js";
import protectedRouter from "./routes/protected.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", healthRouter);
  app.use("/api", protectedRouter);
  app.use("/api", neuroDataRouter);
  app.use("/api", mentorRouter);
  app.use("/api", audioGuideRouter);
  app.use("/api", certificateRouter);

  app.use((_req, res) => {
    res.status(404).json({
      error: "Route not found.",
    });
  });

  return app;
}
