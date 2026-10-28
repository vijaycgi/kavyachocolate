// Applies committed Prisma migrations during `npm run build`, which is what
// Vercel runs, so a deploy can never serve code against a stale schema.
//
// - With DATABASE_URL set: `prisma migrate deploy` must succeed or the build fails.
// - Without DATABASE_URL locally: skip, so `next build` still works offline.
// - Without DATABASE_URL on Vercel: fail loudly rather than deploy a broken app.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// `next build` loads .env, but this script runs before Next does. Read the two
// database keys ourselves so a local build behaves like Vercel, where the
// variables are already in the environment.
if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    if (process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.DATABASE_URL?.trim() ?? "";
const hasPostgres = /^postgres(ql)?:\/\//.test(url);

if (!hasPostgres) {
  if (process.env.VERCEL) {
    console.error(
      "[build] DATABASE_URL is missing or is not a PostgreSQL URL. " +
        "Connect a Neon database to this Vercel project before deploying.",
    );
    process.exit(1);
  }

  console.warn("[build] DATABASE_URL is not a PostgreSQL URL; skipping migrations.");
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
