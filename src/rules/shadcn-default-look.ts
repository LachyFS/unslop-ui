import type { Rule } from "../core/types";
import { stripVariantPrefixes } from "../utils/tailwind";
import { createFinding } from "./helpers";

export const shadcnDefaultLookRule: Rule = {
  id: "ui-slop/shadcn-default-look",
  name: "shadcn default look",
  category: "components",
  defaultSeverity: "warn",
  run(context) {
    const defaultishElements = context.jsx.filter((element) => {
      const classes = new Set(element.classes.map(stripVariantPrefixes));
      let score = 0;
      if (classes.has("rounded-lg")) score += 1;
      if (classes.has("border")) score += 1;
      if (classes.has("bg-card")) score += 1;
      if (classes.has("text-card-foreground")) score += 1;
      if (classes.has("shadow-sm")) score += 1;
      if (classes.has("text-muted-foreground")) score += 1;
      if (classes.has("space-y-1.5")) score += 1;
      return score >= 3;
    });

    const mutedDefaults = context.classNames.filter((usage) =>
      usage.classes.map(stripVariantPrefixes).includes("text-muted-foreground"),
    );

    if (defaultishElements.length < 2 || mutedDefaults.length < 2) return [];

    const first = defaultishElements[0];

    return [
      createFinding(this, context, {
        line: first?.line,
        column: first?.column,
        message:
          "UI appears close to default shadcn styling. Consider applying product-specific visual language.",
        confidence: defaultishElements.length >= 4 ? "high" : "medium",
        suggestion: "Keep the component behavior, but tune spacing, type, density, and surface treatments.",
      }),
    ];
  },
};
