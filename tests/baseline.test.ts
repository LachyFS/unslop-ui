import { describe, expect, it } from "vitest";
import {
  buildBaseline,
  fingerprintFinding,
  partitionByBaseline,
  serializeBaseline,
} from "../src/core/baseline";
import type { Finding } from "../src/core/types";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    ruleId: "ui-slop/raw-hex-colors",
    severity: "error",
    message: "Raw hex color found.",
    filePath: "app/page.tsx",
    category: "design-system",
    confidence: "high",
    snippet: '<div className="bg-[#fff]" />',
    ...overrides,
  };
}

describe("fingerprintFinding", () => {
  it("is stable across line moves", () => {
    const a = fingerprintFinding(finding({ line: 10 }));
    const b = fingerprintFinding(finding({ line: 42 }));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{12}$/);
  });

  it("ignores fluctuating counts inside the message when there is no snippet", () => {
    const one = fingerprintFinding(finding({ snippet: undefined, message: "Found 2 raw hex colors." }));
    const many = fingerprintFinding(finding({ snippet: undefined, message: "Found 9 raw hex colors." }));
    expect(one).toBe(many);
  });

  it("differs when the offending code differs", () => {
    const a = fingerprintFinding(finding({ snippet: '<div className="bg-[#fff]" />' }));
    const b = fingerprintFinding(finding({ snippet: '<div className="bg-[#000]" />' }));
    expect(a).not.toBe(b);
  });
});

describe("buildBaseline", () => {
  it("counts duplicate fingerprints and sorts keys", () => {
    const findings = [
      finding({ snippet: "a", line: 1 }),
      finding({ snippet: "a", line: 5 }),
      finding({ snippet: "b" }),
    ];
    const baseline = buildBaseline(findings);

    const counts = Object.values(baseline.signatures);
    expect(counts).toContain(2);
    expect(counts).toContain(1);

    const keys = Object.keys(baseline.signatures);
    expect(keys).toEqual([...keys].sort((x, y) => x.localeCompare(y)));
    expect(serializeBaseline(baseline)).toContain('"version": 1');
  });
});

describe("partitionByBaseline", () => {
  it("suppresses recorded findings and surfaces new ones", () => {
    const known = finding({ snippet: "known" });
    const fresh = finding({ snippet: "fresh" });
    const baseline = buildBaseline([known]);

    const { newFindings, suppressedCount } = partitionByBaseline([known, fresh], baseline);

    expect(suppressedCount).toBe(1);
    expect(newFindings).toHaveLength(1);
    expect(newFindings[0].snippet).toBe("fresh");
  });

  it("only suppresses up to the recorded count for duplicates", () => {
    const dup = (line: number) => finding({ snippet: "dup", line });
    const baseline = buildBaseline([dup(1)]); // recorded once

    const { newFindings, suppressedCount } = partitionByBaseline([dup(1), dup(2)], baseline);

    expect(suppressedCount).toBe(1);
    expect(newFindings).toHaveLength(1);
  });
});
