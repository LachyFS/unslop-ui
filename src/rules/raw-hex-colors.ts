import type { Rule } from "../core/types";
import { firstRegexLocation } from "../utils/source-location";
import { createFinding } from "./helpers";

const HEX_COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

export const rawHexColorsRule: Rule = {
  id: "ui-slop/raw-hex-colors",
  name: "Raw hex colors",
  category: "design-system",
  defaultSeverity: "error",
  run(context) {
    HEX_COLOR_PATTERN.lastIndex = 0;
    const matches = [...context.source.matchAll(HEX_COLOR_PATTERN)];
    if (matches.length === 0) return [];

    return [
      createFinding(this, context, {
        ...firstRegexLocation(context.source, HEX_COLOR_PATTERN),
        message:
          matches.length === 1
            ? "Raw hex color found. Prefer semantic tokens or Tailwind theme colors."
            : `Found ${matches.length} raw hex colors. Prefer semantic tokens or Tailwind theme colors.`,
        confidence: "high",
        suggestion: "Move color choices into semantic tokens such as bg-card, text-foreground, or primary.",
      }),
    ];
  },
};
