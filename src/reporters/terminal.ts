import pc from "picocolors";
import type { Category, Finding, ScanResult } from "../core/types";

export interface TerminalReportOptions {
  maxFindings?: number;
  quiet?: boolean;
}

const CATEGORY_LABELS: Record<Category, string> = {
  "design-system": "Design system",
  "ai-slop": "AI slop",
  layout: "Layout",
  typography: "Typography",
  components: "Components",
};

export function formatTerminalReport(
  result: ScanResult,
  options: TerminalReportOptions = {},
): string {
  if (options.quiet) {
    return `Unslop UI: ${result.score}/100 - ${result.label}; ${result.findingCount} findings in ${result.filesScanned} files\n`;
  }

  const maxFindings = options.maxFindings ?? 20;
  const lines: string[] = [
    pc.bold("Unslop UI"),
    "",
    `Score: ${colorScore(result.score, `${result.score}/100`)} - ${result.label}`,
    `Files scanned: ${result.filesScanned}`,
    `Findings: ${result.findingCount}`,
  ];

  if (result.findings.length === 0) {
    lines.push("", pc.green("No findings. The UI surface looks controlled."));
    return `${lines.join("\n")}\n`;
  }

  const errors = result.findings.filter((finding) => finding.severity === "error");
  const warnings = result.findings.filter((finding) => finding.severity === "warn");

  appendFindingGroup(lines, "High impact", errors, maxFindings);
  appendFindingGroup(lines, "Warnings", warnings, Math.max(0, maxFindings - errors.length));

  const hiddenCount = Math.max(0, result.findings.length - maxFindings);
  if (hiddenCount > 0) {
    lines.push("", pc.dim(`Showing ${maxFindings} of ${result.findings.length} findings. Re-run with --verbose to show all.`));
  }

  lines.push("", pc.bold("Summary by category"));
  for (const [category, count] of getCategoryCounts(result.findings)) {
    lines.push(`  ${CATEGORY_LABELS[category]}: ${count}`);
  }

  return `${lines.join("\n")}\n`;
}

function appendFindingGroup(
  lines: string[],
  title: string,
  findings: Finding[],
  maxCount: number,
): void {
  if (findings.length === 0 || maxCount <= 0) return;

  lines.push("", pc.bold(title));
  for (const finding of findings.slice(0, maxCount)) {
    lines.push(`  ${formatSeverity(finding.severity)} ${finding.ruleId}`);
    lines.push(`  ${finding.filePath}${finding.line ? `:${finding.line}` : ""}`);
    lines.push(`  ${finding.message}`);
    if (finding.suggestion) {
      lines.push(`  ${pc.dim(finding.suggestion)}`);
    }
    lines.push("");
  }

  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
}

function formatSeverity(severity: Finding["severity"]): string {
  return severity === "error" ? pc.red("error") : pc.yellow("warn");
}

function colorScore(score: number, value: string): string {
  if (score >= 90) return pc.green(value);
  if (score >= 75) return pc.cyan(value);
  if (score >= 60) return pc.yellow(value);
  return pc.red(value);
}

function getCategoryCounts(findings: Finding[]): Array<[Category, number]> {
  const counts = new Map<Category, number>();
  for (const finding of findings) {
    counts.set(finding.category, (counts.get(finding.category) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
