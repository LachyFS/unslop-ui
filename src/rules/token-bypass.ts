import type { Rule } from "../core/types";
import { isPaletteColorClass } from "../utils/tailwind";
import { allClasses, createFinding, firstUsageLine } from "./helpers";

export const tokenBypassRule: Rule = {
  id: "ui-slop/token-bypass",
  name: "Token bypass",
  category: "design-system",
  defaultSeverity: "warn",
  run(context) {
    const directPaletteColors = allClasses(context).filter(isPaletteColorClass);
    const uniquePaletteColors = [...new Set(directPaletteColors)];

    if (uniquePaletteColors.length < 5) return [];

    return [
      createFinding(this, context, {
        ...firstUsageLine(context, isPaletteColorClass),
        message: `Tailwind palette colors are used directly ${uniquePaletteColors.length} times. Prefer semantic design tokens like bg-card, text-muted-foreground, border-border, primary, or secondary.`,
        confidence: uniquePaletteColors.length >= 9 ? "high" : "medium",
        suggestion: "Map repeated palette choices to semantic tokens in your theme.",
      }),
    ];
  },
};
