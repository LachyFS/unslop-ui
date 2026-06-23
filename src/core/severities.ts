export const severities = ["off", "warn", "error"] as const;

export type Severity = (typeof severities)[number];

export function isFailingSeverity(severity: Severity, strict: boolean): boolean {
  return severity === "error" || (strict && severity === "warn");
}
