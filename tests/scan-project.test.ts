import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli";
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
    const parsed = JSON.parse(stdout.read()) as { tool: string; findings: unknown[] };

    expect(exitCode).toBe(1);
    expect(stderr.read()).toBe("");
    expect(parsed.tool).toBe("unslop-ui");
    expect(parsed.findings.length).toBeGreaterThan(0);
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
