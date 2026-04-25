import { disconnectFromDatabase, verifyDatabaseConnection } from "../src/config/db.js";

try {
  const result = await verifyDatabaseConnection();
  console.log(
    JSON.stringify(
      {
        ok: true,
        database: result.name,
        readyState: result.readyState,
      },
      null,
      2,
    ),
  );
  await disconnectFromDatabase();
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message ?? "MongoDB verification failed.",
      },
      null,
      2,
    ),
  );
  await disconnectFromDatabase().catch(() => undefined);
  process.exit(1);
}
