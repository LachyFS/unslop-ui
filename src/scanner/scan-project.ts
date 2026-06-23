import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config/load-config";
import { calculateScore, getScoreLabel } from "../core/score";
import { runRules } from "../core/rule-engine";
import type { ProjectContext, ScanResult } from "../core/types";
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
}

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
  const findings = [];

  for (const absolutePath of files) {
    const source = await readFile(absolutePath, "utf8");
    const filePath = relativePosixPath(root, absolutePath);
    const parsed = parseFile(source, filePath);
    const classNames = parsed.ast ? extractClassNameUsages(parsed.ast, filePath) : [];
    const jsx = parsed.ast ? extractJsxUsages(parsed.ast, filePath) : [];

    findings.push(
      ...runRules(
        {
          filePath,
          absolutePath,
          source,
          classNames,
          jsx,
          project,
        },
        allRules,
      ),
    );
  }

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
