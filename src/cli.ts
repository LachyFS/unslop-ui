#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { Command } from "commander";
import {
  DEFAULT_BASELINE_FILE,
  buildBaseline,
  parseBaseline,
  partitionByBaseline,
  serializeBaseline,
} from "./core/baseline";
import { isFailingSeverity } from "./core/severities";
import type { ScanResult } from "./core/types";
import { scanProject } from "./scanner/scan-project";
import { formatJsonReport } from "./reporters/json";
import { formatSarifReport } from "./reporters/sarif";
import { formatTerminalReport } from "./reporters/terminal";

export interface CliIo {
  stdout?: Pick<NodeJS.WriteStream, "write">;
  stderr?: Pick<NodeJS.WriteStream, "write">;
}

const OUTPUT_FORMATS = ["pretty", "json", "sarif"] as const;
type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export async function runCli(args: string[], io: CliIo = {}): Promise<number> {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  const program = new Command();

  program
    .name("unslop-ui")
    .description("Catch UI slop before it ships.")
    .argument("[target]", "Project directory to scan", ".")
    .option("--json", "Shorthand for --format json")
    .option("--format <format>", `Output format: ${OUTPUT_FORMATS.join(", ")}`)
    .option("--config <path>", "Path to an unslop config file")
    .option("--strict", "Treat warnings as build-failing")
    .option("--quiet", "Print only a one-line summary")
    .option("--verbose", "Show all findings in terminal output")
    .option("--baseline [path]", "Suppress findings recorded in a baseline file")
    .option("--update-baseline", "Write current findings to the baseline file and exit")
    .option("--init", "Scaffold an unslop.config.ts file and exit")
    .exitOverride()
    .configureOutput({
      writeOut: (message) => stdout.write(message),
      writeErr: (message) => stderr.write(message),
    });

  try {
    await program.parseAsync(normalizedArgs, { from: "user" });
    const options = program.opts<{
      json?: boolean;
      format?: string;
      config?: string;
      strict?: boolean;
      quiet?: boolean;
      verbose?: boolean;
      baseline?: string | boolean;
      updateBaseline?: boolean;
      init?: boolean;
    }>();
    const cwd = process.cwd();

    if (options.init) {
      return runInit(cwd, stdout, stderr);
    }

    const format = resolveFormat(options.format, options.json);
    if (!format) {
      stderr.write(`Unknown format. Use one of: ${OUTPUT_FORMATS.join(", ")}.\n`);
      return 1;
    }

    const target = program.args[0] ?? ".";
    const result = await scanProject(target, { cwd, configPath: options.config });

    const baselineActive = Boolean(options.baseline || options.updateBaseline);
    const baselinePath = path.resolve(
      cwd,
      typeof options.baseline === "string" ? options.baseline : DEFAULT_BASELINE_FILE,
    );

    if (options.updateBaseline) {
      const baseline = buildBaseline(result.findings);
      writeFileSync(baselinePath, serializeBaseline(baseline));
      stdout.write(
        `Wrote baseline with ${result.findings.length} finding(s) to ${path.relative(cwd, baselinePath) || baselinePath}\n`,
      );
      return 0;
    }

    const reportResult = baselineActive
      ? applyBaseline(result, baselinePath, stderr)
      : result;

    stdout.write(renderReport(reportResult, format, options));

    return reportResult.findings.some((finding) =>
      isFailingSeverity(finding.severity, Boolean(options.strict)),
    )
      ? 1
      : 0;
  } catch (error) {
    if (error instanceof Error && "exitCode" in error) {
      return Number((error as Error & { exitCode: number }).exitCode);
    }

    stderr.write(`Unslop UI failed: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function resolveFormat(format: string | undefined, json: boolean | undefined): OutputFormat | undefined {
  if (format) {
    return (OUTPUT_FORMATS as readonly string[]).includes(format) ? (format as OutputFormat) : undefined;
  }
  return json ? "json" : "pretty";
}

function renderReport(
  result: ScanResult,
  format: OutputFormat,
  options: { quiet?: boolean; verbose?: boolean },
): string {
  if (format === "json") return formatJsonReport(result);
  if (format === "sarif") return formatSarifReport(result);
  return formatTerminalReport(result, {
    quiet: options.quiet,
    maxFindings: options.verbose ? Number.POSITIVE_INFINITY : 20,
  });
}

function applyBaseline(
  result: ScanResult,
  baselinePath: string,
  stderr: Pick<NodeJS.WriteStream, "write">,
): ScanResult {
  if (!existsSync(baselinePath)) {
    stderr.write(
      `Baseline not found at ${baselinePath}. Treating all findings as new (run --update-baseline to create one).\n`,
    );
    return { ...result, suppressedCount: 0 };
  }

  const baseline = parseBaseline(readFileSync(baselinePath, "utf8"));
  const { newFindings, suppressedCount } = partitionByBaseline(result.findings, baseline);

  return {
    ...result,
    findings: newFindings,
    findingCount: newFindings.length,
    suppressedCount,
  };
}

function runInit(
  cwd: string,
  stdout: Pick<NodeJS.WriteStream, "write">,
  stderr: Pick<NodeJS.WriteStream, "write">,
): number {
  const target = path.join(cwd, "unslop.config.ts");
  if (existsSync(target)) {
    stderr.write(`unslop.config.ts already exists at ${target}\n`);
    return 1;
  }

  writeFileSync(target, CONFIG_TEMPLATE);
  stdout.write(`Created ${path.relative(cwd, target) || target}\n`);
  return 0;
}

const CONFIG_TEMPLATE = `import { defineConfig } from "unslop-ui";

export default defineConfig({
  include: ["app/**/*.{tsx,jsx}", "components/**/*.{tsx,jsx}"],
  ignore: ["node_modules/**", ".next/**", "dist/**"],
  stack: {
    react: true,
    tailwind: true,
    shadcn: true,
  },
  rules: {
    "ui-slop/token-bypass": "warn",
    "ui-slop/arbitrary-tailwind-values": "warn",
    "ui-slop/raw-hex-colors": "error",
    "ui-slop/gradient-soup": "warn",
    "ui-slop/card-lasagna": "warn",
    "ui-slop/muted-everything": "warn",
    "ui-slop/random-radius": "warn",
    "ui-slop/random-shadow": "warn",
    "ui-slop/shadcn-default-look": "warn",
    "ui-slop/generic-ai-hero": "warn",
    "ui-slop/inconsistent-icon-size": "warn",
  },
});
`;

function isDirectRun(): boolean {
  if (!process.argv[1]) return false;

  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return pathToFileURL(process.argv[1]).href === import.meta.url;
  }
}

if (isDirectRun()) {
  runCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
