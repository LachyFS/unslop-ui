import type { Finding } from "./types";

export function calculateScore(findings: Finding[]): number {
  const errorCount = findings.filter((finding) => finding.severity === "error").length;
  const warnCount = findings.filter((finding) => finding.severity === "warn").length;
  const lowConfidenceCount = findings.filter((finding) => finding.confidence === "low").length;

  return Math.max(0, 100 - errorCount * 8 - warnCount * 3 - lowConfidenceCount);
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Clean";
  if (score >= 75) return "Minor slop";
  if (score >= 60) return "Noticeable slop";
  if (score >= 40) return "Heavy slop";
  return "Slop emergency";
}
