import fg from "fast-glob";
import type { ResolvedUnslopConfig } from "../core/types";
import { toPosixPath } from "../utils/paths";

export async function discoverFiles(root: string, config: ResolvedUnslopConfig): Promise<string[]> {
  const files = await fg(config.include, {
    cwd: root,
    absolute: true,
    onlyFiles: true,
    ignore: config.ignore,
    dot: false,
  });

  return files.sort((a, b) => toPosixPath(a).localeCompare(toPosixPath(b)));
}
