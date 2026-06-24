import type { ScanResult } from "../core/types";
import { summarizeFindings } from "./summary";

export function formatJsonReport(result: ScanResult): string {
  const summary = summarizeFindings(result.findings);

  return `${JSON.stringify(
    {
      tool: result.tool,
      version: result.version,
      score: result.score,
      label: result.label,
      filesScanned: result.filesScanned,
      findingCount: result.findingCount,
      ...(result.suppressedCount !== undefined ? { suppressedCount: result.suppressedCount } : {}),
      summary,
      findings: result.findings.map((finding) => ({
        ruleId: finding.ruleId,
        severity: finding.severity,
        category: finding.category,
        confidence: finding.confidence,
        filePath: finding.filePath,
        line: finding.line,
        column: finding.column,
        message: finding.message,
        suggestion: finding.suggestion,
        fingerprint: finding.fingerprint,
      })),
    },
    null,
    2,
  )}\n`;
}
