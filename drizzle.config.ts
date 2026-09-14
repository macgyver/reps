import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is required to run drizzle-kit");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  dbCredentials: {
    url: process.env.DIRECT_URL,
  },
  // Only manage the public schema — auth.users is Supabase-owned and only
  // referenced here for FK typing (see db/schema.ts).
  schemaFilter: ["public"],
});
