import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { fetchNeuroContextFromSnowflake } from "../services/snowflake.js";

const router = Router();

router.post("/neuro-data", requireAuth, async (req, res) => {
  try {
    const brainRegion =
      typeof req.body?.brainRegion === "string" ? req.body.brainRegion.trim() : "";

    if (!brainRegion) {
      return res.status(400).json({
        error: "brainRegion is required.",
      });
    }

    const result = await fetchNeuroContextFromSnowflake(brainRegion);

    return res.json({
      brainRegion,
      context: result.context,
      rowCount: result.rowCount,
      rows: result.rows,
      requestId: result.requestId,
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 502;

    return res.status(statusCode).json({
      error: error.message ?? "Snowflake lookup failed.",
    });
  }
});

export default router;
