import { readFile } from "node:fs/promises";
import path from "node:path";
import { fingerprintFinding } from "../core/baseline";
import { loadConfig } from "../config/load-config";
import { calculateScore, getScoreLabel } from "../core/score";
import { runRules } from "../core/rule-engine";
import type { Finding, ProjectContext, ScanResult } from "../core/types";
import { TOOL_NAME, TOOL_VERSION } from "../core/types";
import { allRules } from "../rules";
import { relativePosixPath } from "../utils/paths";
import { extractClassNameUsages } from "./extract-classnames";
import { extractJsxUsages } from "./extract-jsx";
import { discoverFiles } from "./file-discovery";
import { parseFile } from "./parse-file";

export interface ScanProjectOptions {
  cwd?: string;
  configPath?: string;
  /** Maximum number of files parsed concurrently. */
  concurrency?: number;
}

const DEFAULT_CONCURRENCY = 16;

export async function scanProject(
  targetPath = ".",
  options: ScanProjectOptions = {},
): Promise<ScanResult> {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const root = path.resolve(cwd, targetPath);
  const loaded = await loadConfig({
    cwd: root,
    configPath: options.configPath
      ? path.isAbsolute(options.configPath)
        ? options.configPath
        : path.resolve(cwd, options.configPath)
      : undefined,
  });
  const files = await discoverFiles(root, loaded.config);
  const project: ProjectContext = {
    root,
    config: loaded.config,
    files: files.map((file) => relativePosixPath(root, file)),
  };

  // Scan files concurrently but keep findings in deterministic file order.
  const perFileFindings = await mapWithConcurrency(
    files,
    options.concurrency ?? DEFAULT_CONCURRENCY,
    (absolutePath) => scanFile(absolutePath, root, project),
  );
  const findings = perFileFindings.flat();

  const score = calculateScore(findings);

  return {
    tool: TOOL_NAME,
    version: TOOL_VERSION,
    root,
    score,
    label: getScoreLabel(score),
    filesScanned: files.length,
    findingCount: findings.length,
    findings,
  };
}

async function scanFile(
  absolutePath: string,
  root: string,
  project: ProjectContext,
): Promise<Finding[]> {
  const source = await readFile(absolutePath, "utf8");
  const filePath = relativePosixPath(root, absolutePath);
  const parsed = parseFile(source, filePath);
  const classNames = parsed.ast ? extractClassNameUsages(parsed.ast, filePath) : [];
  const jsx = parsed.ast ? extractJsxUsages(parsed.ast, filePath) : [];

  const findings = runRules({ filePath, absolutePath, source, classNames, jsx, project }, allRules);
  const lines = source.split("\n");

  return findings.map((finding) => enrichFinding(finding, lines));
}

/** Attaches a source snippet and stable fingerprint to a finding. */
function enrichFinding(finding: Finding, lines: string[]): Finding {
  const snippet =
    finding.line !== undefined ? lines[finding.line - 1]?.trimEnd() : undefined;
  const enriched: Finding = { ...finding, snippet };
  enriched.fingerprint = fingerprintFinding(enriched);
  return enriched;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}
