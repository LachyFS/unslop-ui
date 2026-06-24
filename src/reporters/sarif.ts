import type { Finding, ScanResult } from "../core/types";
import type { Severity } from "../core/severities";
import { fingerprintFinding } from "../core/baseline";
import { allRules } from "../rules";

const SARIF_SCHEMA = "https://json.schemastore.org/sarif-2.1.0.json";
const INFORMATION_URI = "https://github.com/LachyFS/unslop-ui";

/**
 * Renders findings as SARIF 2.1.0 so CI can surface them as inline GitHub
 * code-scanning annotations on a pull request.
 */
export function formatSarifReport(result: ScanResult): string {
  const sarif = {
    $schema: SARIF_SCHEMA,
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: result.tool,
            version: result.version,
            informationUri: INFORMATION_URI,
            rules: allRules.map((rule) => ({
              id: rule.id,
              name: rule.name,
              shortDescription: { text: rule.name },
              defaultConfiguration: { level: toSarifLevel(rule.defaultSeverity) },
              properties: { category: rule.category },
            })),
          },
        },
        results: result.findings.map(toSarifResult),
      },
    ],
  };

  return `${JSON.stringify(sarif, null, 2)}\n`;
}

function toSarifResult(finding: Finding) {
  const region =
    finding.line !== undefined
      ? {
          region: {
            startLine: finding.line,
            ...(finding.column !== undefined ? { startColumn: finding.column } : {}),
            ...(finding.snippet ? { snippet: { text: finding.snippet } } : {}),
          },
        }
      : {};

  return {
    ruleId: finding.ruleId,
    level: toSarifLevel(finding.severity),
    message: { text: finding.suggestion ? `${finding.message} ${finding.suggestion}` : finding.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: finding.filePath },
          ...region,
        },
      },
    ],
    partialFingerprints: {
      unslopFingerprint: finding.fingerprint ?? fingerprintFinding(finding),
    },
    properties: { confidence: finding.confidence, category: finding.category },
  };
}

function toSarifLevel(severity: Severity): "error" | "warning" | "none" {
  if (severity === "error") return "error";
  if (severity === "warn") return "warning";
  return "none";
}
