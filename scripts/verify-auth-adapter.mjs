import fs from "node:fs";
import { Pool } from "pg";
import PostgresAdapter from "@auth/pg-adapter";

function loadLocalEnv() {
  if (!fs.existsSync(".env.local")) return;

  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s][^=]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    const value = match[2].trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is empty in .env.local.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const adapter = PostgresAdapter(pool);
const email = `auth-schema-check-${Date.now()}@example.test`;

try {
  const created = await adapter.createUser?.({
    name: "Auth Schema Check",
    email,
    emailVerified: null,
    image: null
  });

  if (!created?.id) {
    throw new Error("Adapter did not return a created user id.");
  }

  const retrieved = await adapter.getUser?.(created.id);
  if (!retrieved || retrieved.email !== email) {
    throw new Error("Adapter could not retrieve the created user.");
  }

  await adapter.deleteUser?.(created.id);
  console.log("Auth.js PG adapter create/get/delete user check passed.");
} finally {
  await pool.end();
}

