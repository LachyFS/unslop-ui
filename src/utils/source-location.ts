export function getLineAndColumn(source: string, index: number): { line: number; column: number } {
  let line = 1;
  let column = 1;

  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
}

export function firstRegexLocation(
  source: string,
  pattern: RegExp,
): { line: number; column: number } | undefined {
  const flags = pattern.flags.replaceAll("g", "").replaceAll("y", "");
  const regex = new RegExp(pattern.source, flags);
  const match = regex.exec(source);
  if (!match || match.index === undefined) return undefined;
  return getLineAndColumn(source, match.index);
}
