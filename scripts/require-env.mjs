#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const REQUIRED_ENV_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, ".env");

const parseDotEnv = (filePath) => {
  if (!fs.existsSync(filePath)) return {};

  const fileContents = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of fileContents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    entries[key] = value;
  }

  return entries;
};

const dotEnvValues = parseDotEnv(envPath);

const missingKeys = REQUIRED_ENV_KEYS.filter((key) => {
  const runtimeValue = process.env[key];
  if (typeof runtimeValue === "string" && runtimeValue.trim().length > 0) return false;

  const fileValue = dotEnvValues[key];
  return !(typeof fileValue === "string" && fileValue.trim().length > 0);
});

if (missingKeys.length > 0) {
  console.error(
    `[Verity] Missing required environment values for build: ${missingKeys.join(", ")}`,
  );
  process.exit(1);
}

console.log("[Verity] Environment gate passed.");
