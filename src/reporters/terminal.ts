import pc from "picocolors";
import type { Category, Finding, ScanResult } from "../core/types";
import { renderCodeFrame } from "./code-frame";
import { summarizeFindings } from "./summary";

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
    const suppressed = result.suppressedCount
      ? `, ${result.suppressedCount} baselined`
      : "";
    return `Unslop UI: ${result.score}/100 - ${result.label}; ${result.findingCount} findings${suppressed} in ${result.filesScanned} files\n`;
  }

  const maxFindings = options.maxFindings ?? 20;
  const lines: string[] = [
    pc.bold("Unslop UI"),
    "",
    `Score: ${colorScore(result.score, `${result.score}/100`)} - ${result.label}`,
    `Files scanned: ${result.filesScanned}`,
    `Findings: ${result.findingCount}`,
  ];

  if (result.suppressedCount) {
    lines.push(pc.dim(`Baseline: ${result.suppressedCount} known finding(s) suppressed`));
  }

  if (result.findings.length === 0) {
    const message = result.suppressedCount
      ? "No new findings since the baseline. Nothing to fix."
      : "No findings. The UI surface looks controlled.";
    lines.push("", pc.green(message));
    return `${lines.join("\n")}\n`;
  }

  const errors = result.findings.filter((finding) => finding.severity === "error");
  const warnings = result.findings.filter((finding) => finding.severity === "warn");
  const summary = summarizeFindings(result.findings);

  appendFindingGroup(lines, "High impact", errors, maxFindings);
  appendFindingGroup(lines, "Warnings", warnings, Math.max(0, maxFindings - errors.length));

  const hiddenCount = Math.max(0, result.findings.length - maxFindings);
  if (hiddenCount > 0) {
    lines.push("", pc.dim(`Showing ${maxFindings} of ${result.findings.length} findings. Re-run with --verbose to show all.`));
  }

  lines.push("", pc.bold("Fix first"));
  for (const item of summary.topFiles.slice(0, 5)) {
    lines.push(`  ${item.filePath}: ${formatCount(item.count)}`);
  }

  lines.push("", pc.bold("Summary by rule"));
  for (const item of summary.byRule) {
    lines.push(`  ${item.ruleId}: ${item.count}`);
  }

  lines.push("", pc.bold("Summary by category"));
  for (const item of summary.byCategory) {
    lines.push(`  ${CATEGORY_LABELS[item.category]}: ${item.count}`);
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
    const location = finding.line
      ? `:${finding.line}${finding.column ? `:${finding.column}` : ""}`
      : "";
    lines.push(`  ${formatSeverity(finding.severity)} ${finding.ruleId}`);
    lines.push(`  ${pc.cyan(`${finding.filePath}${location}`)}`);
    lines.push(`  ${finding.message}`);
    for (const frameLine of renderCodeFrame(finding.snippet, finding.line, finding.column, {
      caret: finding.severity === "error" ? pc.red : pc.yellow,
    })) {
      lines.push(`    ${frameLine}`);
    }
    if (finding.suggestion) {
      lines.push(`  ${pc.dim(`→ ${finding.suggestion}`)}`);
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

function formatCount(count: number): string {
  return count === 1 ? "1 finding" : `${count} findings`;
}
