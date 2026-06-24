import { createHash } from "node:crypto";
import type { Finding } from "./types";

export const BASELINE_VERSION = 1;
export const DEFAULT_BASELINE_FILE = "unslop.baseline.json";

export interface Baseline {
  version: number;
  /** Map of finding fingerprint to the number of times it was recorded. */
  signatures: Record<string, number>;
}

export interface BaselinePartition {
  /** Findings that are not covered by the baseline (i.e. newly introduced). */
  newFindings: Finding[];
  /** Count of findings hidden because they matched the baseline. */
  suppressedCount: number;
}

/**
 * Produces a stable identifier for a finding that survives line moves and
 * fluctuating counts in messages, so a baseline keeps matching as a file is
 * edited elsewhere. Two findings collapse to the same fingerprint when they are
 * the "same problem" — same rule, same file, same offending code.
 */
export function fingerprintFinding(finding: Finding): string {
  const locator = finding.snippet?.trim() || maskVolatile(finding.message);
  const payload = `${finding.ruleId}\x00${finding.filePath}\x00${locator}`;
  return createHash("sha1").update(payload).digest("hex").slice(0, 12);
}

/** Replaces digits with `#` so counts inside messages don't churn fingerprints. */
function maskVolatile(message: string): string {
  return message.replace(/\d+/g, "#");
}

export function buildBaseline(findings: Finding[]): Baseline {
  const signatures: Record<string, number> = {};
  for (const finding of findings) {
    const fingerprint = finding.fingerprint ?? fingerprintFinding(finding);
    signatures[fingerprint] = (signatures[fingerprint] ?? 0) + 1;
  }

  return { version: BASELINE_VERSION, signatures: sortByKey(signatures) };
}

export function partitionByBaseline(findings: Finding[], baseline: Baseline): BaselinePartition {
  const remaining = new Map<string, number>(Object.entries(baseline.signatures ?? {}));
  const newFindings: Finding[] = [];
  let suppressedCount = 0;

  for (const finding of findings) {
    const fingerprint = finding.fingerprint ?? fingerprintFinding(finding);
    const budget = remaining.get(fingerprint) ?? 0;
    if (budget > 0) {
      remaining.set(fingerprint, budget - 1);
      suppressedCount += 1;
    } else {
      newFindings.push(finding);
    }
  }

  return { newFindings, suppressedCount };
}

/** Serializes a baseline with sorted keys for clean, deterministic git diffs. */
export function serializeBaseline(baseline: Baseline): string {
  return `${JSON.stringify(
    { version: baseline.version, signatures: sortByKey(baseline.signatures) },
    null,
    2,
  )}\n`;
}

export function parseBaseline(raw: string): Baseline {
  const parsed = JSON.parse(raw) as Partial<Baseline>;
  if (!parsed || typeof parsed !== "object" || typeof parsed.signatures !== "object") {
    throw new Error("Baseline file is malformed: expected a { version, signatures } object.");
  }

  return {
    version: typeof parsed.version === "number" ? parsed.version : BASELINE_VERSION,
    signatures: parsed.signatures as Record<string, number>,
  };
}

function sortByKey(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}
