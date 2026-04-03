#!/usr/bin/env node
/**
 * Build wrapper that works around the Next.js 15 + Turbopack
 * pages-manifest.json bug for App Router-only projects.
 *
 * Runs `next build`, then ensures the manifest file exists
 * so `next start` doesn't crash.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const serverDir = path.join(__dirname, ".next", "server");
const manifestPath = path.join(serverDir, "pages-manifest.json");

try {
  // Run the actual Next.js build
  execSync("npx next build", { stdio: "inherit", env: { ...process.env } });
} catch (e) {
  // The build may "fail" due to the missing manifest but still produce output.
  // Check if it actually compiled by looking for the BUILD_ID file.
  const buildIdPath = path.join(__dirname, ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    // Real build failure — re-throw
    console.error("Build failed (no BUILD_ID produced).");
    process.exit(1);
  }
  // Build succeeded despite the manifest error — continue
  console.log("Build completed with non-fatal manifest warning.");
}

// Ensure the manifest file exists for `next start`
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}
if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(manifestPath, "{}");
  console.log("Created pages-manifest.json");
}
