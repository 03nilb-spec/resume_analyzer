import fs from "node:fs";
import { Pool } from "pg";

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

const schema = fs.readFileSync("database/schema.sql", "utf8");
await pool.query(schema);

const expectedTables = [
  "accounts",
  "resume_analyses",
  "sessions",
  "usage_events",
  "users",
  "verification_token"
];

const result = await pool.query(
  `
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any($1)
    order by table_name
  `,
  [expectedTables]
);

await pool.end();

const foundTables = new Set(result.rows.map((row) => row.table_name));
const missingTables = expectedTables.filter((table) => !foundTables.has(table));

if (missingTables.length > 0) {
  throw new Error(`Missing tables after schema apply: ${missingTables.join(", ")}`);
}

console.log("Created/verified Auth.js and app tables:");
for (const table of expectedTables) {
  console.log(`- ${table}`);
}

