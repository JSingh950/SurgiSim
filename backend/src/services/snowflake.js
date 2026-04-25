import { randomUUID } from "node:crypto";
import axios from "axios";
import { env, getMissingSnowflakeEnv } from "../config/env.js";

function assertSnowflakeConfig() {
  const missing = getMissingSnowflakeEnv();

  if (missing.length > 0) {
    const error = new Error(
      `Snowflake configuration is incomplete: ${missing.join(", ")}`,
    );
    error.statusCode = 503;
    throw error;
  }
}

function buildStatement() {
  if (env.snowflakeRagQuery) {
    return env.snowflakeRagQuery;
  }

  if (!/^[A-Za-z0-9_.$"]+$/.test(env.snowflakeRagTable)) {
    const error = new Error(
      "SNOWFLAKE_RAG_TABLE contains unsupported characters. Use SNOWFLAKE_RAG_QUERY for custom SQL.",
    );
    error.statusCode = 500;
    throw error;
  }

  return `
    SELECT *
    FROM ${env.snowflakeRagTable}
    WHERE LOWER(brain_region) = LOWER(?)
    LIMIT 1
  `;
}

function mapSnowflakeRows(payload) {
  const rowMetadata = payload?.resultSetMetaData?.rowType ?? [];
  const rows = payload?.data ?? [];

  return rows.map((row) =>
    rowMetadata.reduce((accumulator, column, index) => {
      accumulator[column.name] = row[index];
      return accumulator;
    }, {}),
  );
}

function extractContext(row) {
  if (!row) {
    return "";
  }

  const preferredKeys = [
    "RAG_CONTEXT",
    "CONTEXT",
    "CONTENT",
    "TEXT",
    "DESCRIPTION",
    "SUMMARY",
  ];

  for (const key of preferredKeys) {
    if (typeof row[key] === "string" && row[key].trim().length > 0) {
      return row[key].trim();
    }
  }

  const fallback = Object.values(row).find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return typeof fallback === "string" ? fallback.trim() : JSON.stringify(row);
}

export async function fetchNeuroContextFromSnowflake(brainRegion) {
  assertSnowflakeConfig();

  const requestId = randomUUID();
  const headers = {
    Authorization: `Bearer ${env.snowflakeToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "NeuroSimWeb3/0.1",
  };

  if (env.snowflakeTokenType) {
    headers["X-Snowflake-Authorization-Token-Type"] = env.snowflakeTokenType;
  }

  const response = await axios.post(
    `${env.snowflakeApiUrl}?requestId=${requestId}`,
    {
      statement: buildStatement(),
      timeout: 45,
      database: env.snowflakeDatabase,
      schema: env.snowflakeSchema,
      warehouse: env.snowflakeWarehouse,
      role: env.snowflakeRole,
      bindings: {
        1: {
          type: "TEXT",
          value: brainRegion,
        },
      },
    },
    {
      headers,
      timeout: 45_000,
    },
  );

  const payload = response.data;

  if (payload?.statementHandle && !Array.isArray(payload?.data)) {
    const error = new Error(
      "Snowflake accepted the statement asynchronously. This route expects a synchronous result for one-click region lookups.",
    );
    error.statusCode = 504;
    throw error;
  }

  const rows = mapSnowflakeRows(payload);
  const firstRow = rows[0] ?? null;

  return {
    requestId,
    rows,
    rowCount: rows.length,
    context: extractContext(firstRow),
  };
}
