import { Pool } from "pg";

declare global {
  var resumeAnalyzerPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  return new Pool({
    connectionString
  });
}

export const dbPool = globalThis.resumeAnalyzerPool ?? createPool();

if (process.env.NODE_ENV !== "production" && dbPool) {
  globalThis.resumeAnalyzerPool = dbPool;
}

export function requireDbPool() {
  if (!dbPool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return dbPool;
}
