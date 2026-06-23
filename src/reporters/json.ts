import type { ScanResult } from "../core/types";

export function formatJsonReport(result: ScanResult): string {
  return `${JSON.stringify(
    {
      tool: result.tool,
      version: result.version,
      score: result.score,
      label: result.label,
      filesScanned: result.filesScanned,
      findingCount: result.findingCount,
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
      })),
    },
    null,
    2,
  )}\n`;
}
