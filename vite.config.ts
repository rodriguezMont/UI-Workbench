import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { APPROVALS_FILE, workbenchApprovals } from "./src/workbench/approvals-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), workbenchApprovals()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    // The seal writes this file; reloading the page on every approval would
    // throw away scroll position and open pieces. The page gets the new ledger
    // from the endpoint's response instead.
    watch: { ignored: [`**/${APPROVALS_FILE}`] },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
