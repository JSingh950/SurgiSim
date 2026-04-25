import { Router } from "express";
import { getUserClaims, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/protected/session", requireAuth, (req, res) => {
  const claims = getUserClaims(req);

  res.json({
    sub: claims.sub,
    scope: claims.scope,
    audience: claims.aud,
    message:
      "Auth0 token verified. Protected AI mentor routes are locked behind this boundary.",
    routes: ["/api/mentor", "/api/neuro-data", "/api/audio-guide"],
  });
});

export default router;
