import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PLUGIN_ID = "telegram-inbox";
const ARTIFACTS = ["main.js", "manifest.json", "styles.css"];
const ENV_FILE = ".env";
const VAULT_ENV_KEY = "TELEGRAM_INBOX_DEV_VAULT";

/**
 * Loads basic KEY=VALUE pairs from a local .env file.
 * This parser is intentionally minimal and sufficient for vault-path config.
 */
function loadEnvFile() {
  const envPath = resolve(process.cwd(), ENV_FILE);
  if (!existsSync(envPath)) {
    return {};
  }

  const raw = readFileSync(envPath, "utf-8");
  const parsed = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    parsed[key] = value;
  }

  return parsed;
}

/**
 * Resolves destination vault from `.env` first, then process env as fallback.
 */
function resolveVaultPath() {
  const envFileVars = loadEnvFile();
  const fromEnvFile = envFileVars[VAULT_ENV_KEY]?.trim();
  if (fromEnvFile) {
    return fromEnvFile;
  }
  return process.env[VAULT_ENV_KEY]?.trim();
}

function assertVaultPath(vaultPath) {
  if (!vaultPath) {
    throw new Error(
      `Vault path is missing. Set ${VAULT_ENV_KEY} in ${ENV_FILE}.`
    );
  }

  if (!existsSync(vaultPath)) {
    throw new Error(`Vault path does not exist: ${vaultPath}`);
  }
}

function copyArtifacts(destinationDir) {
  mkdirSync(destinationDir, { recursive: true });

  for (const artifact of ARTIFACTS) {
    const sourcePath = resolve(process.cwd(), artifact);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing artifact: ${artifact}. Run npm run build first.`);
    }
    cpSync(sourcePath, join(destinationDir, artifact));
  }
}

function main() {
  const vaultPath = resolveVaultPath();
  assertVaultPath(vaultPath);

  const destinationDir = join(vaultPath, ".obsidian", "plugins", PLUGIN_ID);
  copyArtifacts(destinationDir);

  // Keep this concise for command-line usage.
  console.log(`Deployed ${PLUGIN_ID} to: ${destinationDir}`);
}

main();
