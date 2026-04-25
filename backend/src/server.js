import { createApp } from "./app.js";
import { connectToDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectToDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`NeuroSim Web3 API listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start NeuroSim Web3 API", error);
  process.exit(1);
});
