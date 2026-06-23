export { loadConfig } from "./config/load-config";
export { scanProject } from "./scanner/scan-project";
export { allRules } from "./rules";
export { formatJsonReport } from "./reporters/json";
export { formatTerminalReport } from "./reporters/terminal";
export type {
  ClassNameUsage,
  Finding,
  JsxUsage,
  ResolvedUnslopConfig,
  Rule,
  RuleContext,
  ScanResult,
  UnslopConfig,
} from "./core/types";

export function defineConfig<T extends import("./core/types").UnslopConfig>(config: T): T {
  return config;
}
