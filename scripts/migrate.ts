// Applies pending Drizzle migrations. Runs automatically before `next build`.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    if (process.env.VERCEL) {
      console.error("[migrate] DATABASE_URL is missing on Vercel – connect the Neon integration first.");
      process.exit(1);
    }
    console.warn("[migrate] DATABASE_URL not set – skipping migrations (local build).");
    return;
  }
  await migrate(drizzle(neon(url)), { migrationsFolder: "drizzle" });
  console.log("[migrate] migrations applied");
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});
