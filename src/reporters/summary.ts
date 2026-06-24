import type { Category, Finding } from "../core/types";

export interface FindingSummary {
  bySeverity: {
    error: number;
    warn: number;
  };
  byCategory: Array<{ category: Category; count: number }>;
  byRule: Array<{ ruleId: string; count: number }>;
  topFiles: Array<{ filePath: string; count: number }>;
}

export function summarizeFindings(findings: Finding[]): FindingSummary {
  return {
    bySeverity: {
      error: findings.filter((finding) => finding.severity === "error").length,
      warn: findings.filter((finding) => finding.severity === "warn").length,
    },
    byCategory: toNamedCounts(countBy(findings, (finding) => finding.category), "category"),
    byRule: toNamedCounts(countBy(findings, (finding) => finding.ruleId), "ruleId"),
    topFiles: toNamedCounts(countBy(findings, (finding) => finding.filePath), "filePath").slice(
      0,
      10,
    ),
  };
}

function countBy<T extends string>(
  findings: Finding[],
  getKey: (finding: Finding) => T,
): Array<[T, number]> {
  const counts = new Map<T, number>();
  for (const finding of findings) {
    const key = getKey(finding);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function toNamedCounts<TName extends string, TKey extends string>(
  counts: Array<[TKey, number]>,
  name: TName,
): Array<Record<TName, TKey> & { count: number }> {
  return counts.map(([key, count]) => ({ [name]: key, count }) as Record<TName, TKey> & {
    count: number;
  });
}
