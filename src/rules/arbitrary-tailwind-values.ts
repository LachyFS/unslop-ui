import type { Rule } from "../core/types";
import { stripVariantPrefixes } from "../utils/tailwind";
import { allClasses, createFinding, firstUsageLine } from "./helpers";

export const arbitraryTailwindValuesRule: Rule = {
  id: "ui-slop/arbitrary-tailwind-values",
  name: "Arbitrary Tailwind values",
  category: "design-system",
  defaultSeverity: "warn",
  run(context) {
    const arbitraryClasses = allClasses(context).filter((className) =>
      /\[[^\]]+\]/.test(stripVariantPrefixes(className)),
    );

    if (arbitraryClasses.length < 3) return [];

    const location = firstUsageLine(context, (className) => /\[[^\]]+\]/.test(className));
    const stronger = arbitraryClasses.length >= 8;

    return [
      createFinding(this, context, {
        ...location,
        message: stronger
          ? `Found ${arbitraryClasses.length} arbitrary Tailwind values. This strongly suggests non-systematic spacing, sizing, or color choices.`
          : `Found ${arbitraryClasses.length} arbitrary Tailwind values. This often indicates generated or non-systematic UI.`,
        confidence: stronger ? "high" : "medium",
        suggestion: "Prefer design tokens, Tailwind theme values, or a small documented exception.",
      }),
    ];
  },
};
