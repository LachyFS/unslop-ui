import path from "node:path";

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function relativePosixPath(root: string, filePath: string): string {
  return toPosixPath(path.relative(root, filePath));
}
