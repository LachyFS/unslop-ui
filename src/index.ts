export { loadConfig } from "./config/load-config";
export { scanProject } from "./scanner/scan-project";
export { allRules } from "./rules";
export { formatJsonReport } from "./reporters/json";
export { formatSarifReport } from "./reporters/sarif";
export { formatTerminalReport } from "./reporters/terminal";
export { summarizeFindings } from "./reporters/summary";
export {
  buildBaseline,
  fingerprintFinding,
  partitionByBaseline,
  serializeBaseline,
  parseBaseline,
} from "./core/baseline";
export type { Baseline } from "./core/baseline";
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
