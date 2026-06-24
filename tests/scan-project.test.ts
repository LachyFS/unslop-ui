import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli";
import { extractClassNameUsages } from "../src/scanner/extract-classnames";
import { parseFile } from "../src/scanner/parse-file";
import { scanProject } from "../src/scanner/scan-project";

function createWritableBuffer() {
  let value = "";
  return {
    stream: {
      write(chunk: string | Uint8Array) {
        value += chunk.toString();
        return true;
      },
    },
    read() {
      return value;
    },
  };
}

describe("scanProject", () => {
  it("gives the clean fixture a high score", async () => {
    const result = await scanProject("fixtures/clean", { cwd: process.cwd() });

    expect(result.filesScanned).toBe(1);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.findings).toEqual([]);
  });

  it("flags expected slop rules", async () => {
    const result = await scanProject("fixtures/slop", { cwd: process.cwd() });
    const ruleIds = new Set(result.findings.map((finding) => finding.ruleId));

    expect(result.score).toBeLessThan(90);
    expect(ruleIds).toContain("ui-slop/raw-hex-colors");
    expect(ruleIds).toContain("ui-slop/arbitrary-tailwind-values");
    expect(ruleIds).toContain("ui-slop/gradient-soup");
    expect(ruleIds).toContain("ui-slop/muted-everything");
    expect(ruleIds).toContain("ui-slop/random-radius");
  });

  it("emits valid JSON from the CLI", async () => {
    const stdout = createWritableBuffer();
    const stderr = createWritableBuffer();

    const exitCode = await runCli(["fixtures/slop", "--json"], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });
    const parsed = JSON.parse(stdout.read()) as {
      tool: string;
      findings: unknown[];
      summary: {
        bySeverity: { error: number; warn: number };
        byRule: Array<{ ruleId: string; count: number }>;
        topFiles: Array<{ filePath: string; count: number }>;
      };
    };

    expect(exitCode).toBe(1);
    expect(stderr.read()).toBe("");
    expect(parsed.tool).toBe("unslop-ui");
    expect(parsed.findings.length).toBeGreaterThan(0);
    expect(parsed.summary.bySeverity.error).toBeGreaterThan(0);
    expect(parsed.summary.byRule.some((item) => item.ruleId === "ui-slop/raw-hex-colors")).toBe(true);
    expect(parsed.summary.topFiles[0]?.filePath).toBe("app/page.tsx");
  });

  it("prints prioritized terminal summaries", async () => {
    const stdout = createWritableBuffer();
    const stderr = createWritableBuffer();

    const exitCode = await runCli(["fixtures/slop"], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });
    const output = stdout.read();

    expect(exitCode).toBe(1);
    expect(stderr.read()).toBe("");
    expect(output).toContain("Fix first");
    expect(output).toContain("Summary by rule");
    expect(output).toContain("app/page.tsx:");
    // Code frame: the offending source line is shown with a caret marker.
    expect(output).toContain("│");
    expect(output).toContain("^");
    expect(output).toContain("min-h-screen");
  });

  it("emits SARIF 2.1.0 for CI code scanning", async () => {
    const stdout = createWritableBuffer();
    const stderr = createWritableBuffer();

    const exitCode = await runCli(["fixtures/slop", "--format", "sarif"], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });
    const sarif = JSON.parse(stdout.read()) as {
      version: string;
      runs: Array<{
        tool: { driver: { name: string; rules: unknown[] } };
        results: Array<{ ruleId: string; level: string; partialFingerprints: Record<string, string> }>;
      }>;
    };

    expect(exitCode).toBe(1);
    expect(stderr.read()).toBe("");
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].tool.driver.name).toBe("unslop-ui");
    expect(sarif.runs[0].tool.driver.rules.length).toBeGreaterThan(0);
    expect(sarif.runs[0].results.length).toBeGreaterThan(0);
    expect(sarif.runs[0].results.some((result) => result.level === "error")).toBe(true);
    expect(sarif.runs[0].results[0].partialFingerprints.unslopFingerprint).toMatch(/^[0-9a-f]{12}$/);
  });

  it("rejects an unknown output format", async () => {
    const stdout = createWritableBuffer();
    const stderr = createWritableBuffer();

    const exitCode = await runCli(["fixtures/slop", "--format", "yaml"], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    expect(exitCode).toBe(1);
    expect(stderr.read()).toContain("Unknown format");
  });

  it("suppresses known findings through a baseline and fails only on new ones", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "unslop-baseline-"));
    const baselinePath = path.join(dir, "unslop.baseline.json");

    try {
      // 1. Record the current slop as the accepted baseline.
      const writeOut = createWritableBuffer();
      const writeExit = await runCli(
        ["fixtures/slop", "--update-baseline", "--baseline", baselinePath],
        { stdout: writeOut.stream, stderr: createWritableBuffer().stream },
      );
      expect(writeExit).toBe(0);
      expect(existsSync(baselinePath)).toBe(true);
      expect(writeOut.read()).toContain("Wrote baseline");

      // 2. Re-scan against the baseline: everything is known, so --strict passes.
      const stdout = createWritableBuffer();
      const stderr = createWritableBuffer();
      const exitCode = await runCli(
        ["fixtures/slop", "--baseline", baselinePath, "--strict"],
        { stdout: stdout.stream, stderr: stderr.stream },
      );

      expect(exitCode).toBe(0);
      expect(stderr.read()).toBe("");
      expect(stdout.read()).toContain("suppressed");
      expect(stdout.read()).toContain("No new findings");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("treats every finding as new when the baseline is empty", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "unslop-baseline-"));
    const baselinePath = path.join(dir, "empty.baseline.json");

    try {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(baselinePath, JSON.stringify({ version: 1, signatures: {} }));

      const stdout = createWritableBuffer();
      const exitCode = await runCli(["fixtures/slop", "--baseline", baselinePath], {
        stdout: stdout.stream,
        stderr: createWritableBuffer().stream,
      });

      expect(exitCode).toBe(1);
      expect(stdout.read()).toContain("High impact");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("lets config disable rules", async () => {
    const result = await scanProject("fixtures/slop", {
      cwd: process.cwd(),
      configPath: "tests/unslop.disable-hex.config.ts",
    });

    expect(result.findings.some((finding) => finding.ruleId === "ui-slop/raw-hex-colors")).toBe(false);
  });

  it("exits non-zero for strict warnings", async () => {
    const stdout = createWritableBuffer();
    const stderr = createWritableBuffer();

    const exitCode = await runCli(["fixtures/slop", "--config", "tests/unslop.disable-hex.config.ts", "--strict"], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    expect(exitCode).toBe(1);
    expect(stderr.read()).toBe("");
  });

  it("exits zero when only warnings are present without strict mode", async () => {
    const stdout = createWritableBuffer();
    const stderr = createWritableBuffer();

    const exitCode = await runCli(["fixtures/slop", "--config", "tests/unslop.disable-hex.config.ts"], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    expect(exitCode).toBe(0);
    expect(stderr.read()).toBe("");
  });
});

describe("extractClassNameUsages", () => {
  it("finds Tailwind classes inside helpers, variants, and static class constants", () => {
    const source = `
      import { cva } from "class-variance-authority";
      import { cn } from "@/lib/utils";

      const panel = "rounded-[18px] border border-slate-200 bg-white p-[19px] shadow-xl";
      const button = cva("inline-flex items-center justify-center rounded-lg text-sm", {
        variants: {
          tone: {
            primary: "bg-purple-500 text-white",
            secondary: "border-slate-200 bg-white text-gray-500",
          },
          size: {
            compact: "h-[34px] px-[13px]",
          },
        },
      });

      export function Example({ active }: { active: boolean }) {
        return <div className={cn(panel, active && "ring-2", button({ tone: "primary" }))} />;
      }
    `;
    const parsed = parseFile(source, "components/example.tsx");
    expect(parsed.ast).not.toBeNull();

    const usages = extractClassNameUsages(parsed.ast!, "components/example.tsx");
    const classes = new Set(usages.flatMap((usage) => usage.classes));

    expect(classes).toContain("rounded-[18px]");
    expect(classes).toContain("bg-purple-500");
    expect(classes).toContain("h-[34px]");
    expect(classes).toContain("ring-2");
    expect(classes).not.toContain("primary");
  });

  it("does not treat ordinary product copy as class names", () => {
    const parsed = parseFile(
      `export const copy = "Ship a calmer release review workflow";`,
      "copy.tsx",
    );
    expect(parsed.ast).not.toBeNull();

    expect(extractClassNameUsages(parsed.ast!, "copy.tsx")).toEqual([]);
  });
});
