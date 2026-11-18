import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/schema.ts",
  out: "./server/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.URBANRISE_DB_PATH || "./server/data/visits.sqlite",
  },
});

