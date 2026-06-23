import type { Severity } from "./severities";

export const TOOL_NAME = "unslop-ui";
export const TOOL_VERSION = "0.1.1";

export type Category =
  | "design-system"
  | "ai-slop"
  | "layout"
  | "typography"
  | "components";

export type Confidence = "low" | "medium" | "high";

export interface Finding {
  ruleId: string;
  severity: Exclude<Severity, "off">;
  message: string;
  filePath: string;
  line?: number;
  column?: number;
  category: Category;
  confidence: Confidence;
  suggestion?: string;
}

export interface ClassNameUsage {
  value: string;
  classes: string[];
  filePath: string;
  line?: number;
  column?: number;
  elementName?: string;
}

export interface JsxUsage {
  elementName: string;
  classes: string[];
  className?: string;
  filePath: string;
  line?: number;
  column?: number;
  depth: number;
  text: string;
}

export interface StackConfig {
  react: boolean;
  tailwind: boolean;
  shadcn: boolean;
}

export interface UnslopConfig {
  include?: string[];
  ignore?: string[];
  stack?: Partial<StackConfig>;
  rules?: Record<string, Severity>;
}

export interface ResolvedUnslopConfig {
  include: string[];
  ignore: string[];
  stack: StackConfig;
  rules: Record<string, Severity>;
}

export interface ProjectContext {
  root: string;
  config: ResolvedUnslopConfig;
  files: string[];
}

export interface RuleContext {
  filePath: string;
  absolutePath: string;
  source: string;
  classNames: ClassNameUsage[];
  jsx: JsxUsage[];
  project: ProjectContext;
}

export interface Rule {
  id: string;
  name: string;
  category: Category;
  defaultSeverity: Severity;
  run(context: RuleContext): Finding[];
}

export interface ScanResult {
  tool: typeof TOOL_NAME;
  version: typeof TOOL_VERSION;
  root: string;
  score: number;
  label: string;
  filesScanned: number;
  findingCount: number;
  findings: Finding[];
}
