import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: ["./db/auth-schema.ts"],
  out: "./db/migrations",
});