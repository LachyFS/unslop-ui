import { describe, expect, it } from "vitest";
import { renderCodeFrame } from "../src/reporters/code-frame";

describe("renderCodeFrame", () => {
  it("renders the source line and a caret aligned to the column", () => {
    const snippet = '  <div className="x" />';
    const [codeLine, caretLine] = renderCodeFrame(snippet, 5, 3);

    expect(codeLine).toContain(snippet);
    expect(codeLine.startsWith("5 ")).toBe(true);
    // The caret sits under the column: gutter "N │ " (4 chars) + (column - 1).
    expect(caretLine.indexOf("^")).toBe("5 │ ".length + (3 - 1));
  });

  it("omits the caret line when there is no column", () => {
    const frame = renderCodeFrame("text", 1, undefined);
    expect(frame).toHaveLength(1);
  });

  it("returns nothing for an empty snippet", () => {
    expect(renderCodeFrame(undefined, 1, 1)).toEqual([]);
    expect(renderCodeFrame("   ", 1, 1)).toEqual([]);
  });

  it("keeps caret alignment when the line contains tabs", () => {
    // One leading tab expands to two display spaces.
    const frame = renderCodeFrame("\tconst x = 1", 1, 2);
    const caretLine = frame[1];
    // gutter (4) + expanded tab (2) = caret at index 6.
    expect(caretLine.indexOf("^")).toBe("1 │ ".length + 2);
  });
});
