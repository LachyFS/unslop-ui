import pc from "picocolors";

export interface CodeFrameOptions {
  /** Colorizes the caret marker (defaults to no color). */
  caret?: (value: string) => string;
}

const TAB_REPLACEMENT = "  ";

/**
 * Renders an ESLint/ruff-style code frame for a single source line:
 *
 *   12 │ <div className="bg-[#0f172a]" />
 *      ╵                 ^
 *
 * Returns the frame as an array of lines so callers control surrounding
 * indentation. Returns an empty array when there is nothing to show.
 */
export function renderCodeFrame(
  snippet: string | undefined,
  line: number | undefined,
  column: number | undefined,
  options: CodeFrameOptions = {},
): string[] {
  if (!snippet || snippet.trim() === "") return [];

  const display = snippet.replace(/\t/g, TAB_REPLACEMENT);
  const gutterLabel = line !== undefined ? String(line) : "";
  const gutterWidth = Math.max(gutterLabel.length, 1);
  const codeGutter = `${gutterLabel.padStart(gutterWidth)} ${pc.dim("│")} `;
  const lines = [`${codeGutter}${display}`];

  if (column !== undefined && column >= 1) {
    const prefix = snippet.slice(0, column - 1).replace(/\t/g, TAB_REPLACEMENT);
    const caretGutter = `${" ".repeat(gutterWidth)} ${pc.dim("╵")} `;
    const caret = options.caret ? options.caret("^") : "^";
    lines.push(`${caretGutter}${" ".repeat(prefix.length)}${caret}`);
  }

  return lines;
}
