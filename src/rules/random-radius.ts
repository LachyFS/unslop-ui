import type { Rule } from "../core/types";
import { stripVariantPrefixes } from "../utils/tailwind";
import { allClasses, createFinding, firstUsageLine } from "./helpers";

export const randomRadiusRule: Rule = {
  id: "ui-slop/random-radius",
  name: "Random radius",
  category: "design-system",
  defaultSeverity: "warn",
  run(context) {
    const radiusClasses = [
      ...new Set(
        allClasses(context)
          .map(stripVariantPrefixes)
          .filter((className) =>
            /^rounded(?:$|-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\]|[trbl][trbl]?-.+))/.test(
              className,
            ),
          ),
      ),
    ];

    if (radiusClasses.length <= 4) return [];

    return [
      createFinding(this, context, {
        ...firstUsageLine(context, (className) => stripVariantPrefixes(className).startsWith("rounded")),
        message: `Too many border-radius variants found (${radiusClasses.length}). This creates inconsistent UI rhythm.`,
        confidence: radiusClasses.length >= 7 ? "high" : "medium",
        suggestion: "Standardize around a small radius scale for repeated surfaces and controls.",
      }),
    ];
  },
};
