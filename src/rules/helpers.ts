import type { Finding, Rule, RuleContext } from "../core/types";

export function createFinding(
  rule: Rule,
  context: RuleContext,
  options: Omit<Finding, "ruleId" | "severity" | "filePath" | "category">,
): Finding {
  return {
    ruleId: rule.id,
    severity: rule.defaultSeverity === "error" ? "error" : "warn",
    filePath: context.filePath,
    category: rule.category,
    ...options,
  };
}

export function allClasses(context: RuleContext): string[] {
  return context.classNames.flatMap((usage) => usage.classes);
}

export function firstUsageLine(context: RuleContext, predicate: (className: string) => boolean) {
  const usage = context.classNames.find((item) => item.classes.some(predicate));
  return { line: usage?.line, column: usage?.column };
}
