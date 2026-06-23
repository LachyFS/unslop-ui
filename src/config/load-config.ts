import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
import { defaultConfig } from "./default-config";
import { configSchema } from "./schema";
import type { ResolvedUnslopConfig, UnslopConfig } from "../core/types";

const CONFIG_FILES = [
  "unslop.config.ts",
  "unslop.config.mts",
  "unslop.config.js",
  "unslop.config.mjs",
  "unslop.config.cjs",
  "unslop.config.json",
];

export interface LoadConfigOptions {
  cwd: string;
  configPath?: string;
}

export interface LoadedConfig {
  config: ResolvedUnslopConfig;
  configPath?: string;
}

export async function loadConfig(options: LoadConfigOptions): Promise<LoadedConfig> {
  const configPath = options.configPath
    ? path.resolve(options.cwd, options.configPath)
    : findConfigFile(options.cwd);

  if (!configPath) {
    return { config: defaultConfig };
  }

  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const rawConfig = await importConfig(configPath);
  const parsed = configSchema.parse(rawConfig ?? {});

  return {
    config: mergeConfig(parsed),
    configPath,
  };
}

function findConfigFile(cwd: string): string | undefined {
  for (const fileName of CONFIG_FILES) {
    const candidate = path.join(cwd, fileName);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

async function importConfig(configPath: string): Promise<UnslopConfig> {
  if (configPath.endsWith(".json")) {
    return JSON.parse(readFileSync(configPath, "utf8")) as UnslopConfig;
  }

  const jiti = createJiti(import.meta.url);
  const loaded = await jiti.import(configPath, { default: true });
  return (loaded ?? {}) as UnslopConfig;
}

function mergeConfig(config: UnslopConfig): ResolvedUnslopConfig {
  return {
    include: config.include ?? defaultConfig.include,
    ignore: config.ignore ?? defaultConfig.ignore,
    stack: {
      ...defaultConfig.stack,
      ...config.stack,
    },
    rules: {
      ...defaultConfig.rules,
      ...config.rules,
    },
  };
}
