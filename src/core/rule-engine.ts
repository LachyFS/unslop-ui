import type { Finding, Rule, RuleContext } from "./types";

export function runRules(context: RuleContext, rules: Rule[]): Finding[] {
  const findings: Finding[] = [];

  for (const rule of rules) {
    const configuredSeverity = context.project.config.rules[rule.id] ?? rule.defaultSeverity;
    if (configuredSeverity === "off") {
      continue;
    }

    for (const finding of rule.run(context)) {
      findings.push({
        ...finding,
        severity: configuredSeverity,
      });
    }
  }

  return findings.sort((a, b) => {
    const severityDelta = severityRank(b.severity) - severityRank(a.severity);
    if (severityDelta !== 0) return severityDelta;
    return `${a.filePath}:${a.line ?? 0}:${a.ruleId}`.localeCompare(
      `${b.filePath}:${b.line ?? 0}:${b.ruleId}`,
    );
  });
}

function severityRank(severity: Finding["severity"]): number {
  return severity === "error" ? 2 : 1;
}
