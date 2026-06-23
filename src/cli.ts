#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { Command } from "commander";
import { isFailingSeverity } from "./core/severities";
import { scanProject } from "./scanner/scan-project";
import { formatJsonReport } from "./reporters/json";
import { formatTerminalReport } from "./reporters/terminal";

export interface CliIo {
  stdout?: Pick<NodeJS.WriteStream, "write">;
  stderr?: Pick<NodeJS.WriteStream, "write">;
}

export async function runCli(args: string[], io: CliIo = {}): Promise<number> {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  const program = new Command();

  program
    .name("unslop-ui")
    .description("Catch UI slop before it ships.")
    .argument("[target]", "Project directory to scan", ".")
    .option("--json", "Output structured JSON only")
    .option("--config <path>", "Path to an unslop config file")
    .option("--strict", "Treat warnings as build-failing")
    .option("--quiet", "Print only a one-line summary")
    .option("--verbose", "Show all findings in terminal output")
    .exitOverride()
    .configureOutput({
      writeOut: (message) => stdout.write(message),
      writeErr: (message) => stderr.write(message),
    });

  try {
    await program.parseAsync(normalizedArgs, { from: "user" });
    const options = program.opts<{
      json?: boolean;
      config?: string;
      strict?: boolean;
      quiet?: boolean;
      verbose?: boolean;
    }>();
    const target = program.args[0] ?? ".";
    const result = await scanProject(target, {
      cwd: process.cwd(),
      configPath: options.config,
    });

    if (options.json) {
      stdout.write(formatJsonReport(result));
    } else {
      stdout.write(
        formatTerminalReport(result, {
          quiet: options.quiet,
          maxFindings: options.verbose ? Number.POSITIVE_INFINITY : 20,
        }),
      );
    }

    return result.findings.some((finding) => isFailingSeverity(finding.severity, Boolean(options.strict)))
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
