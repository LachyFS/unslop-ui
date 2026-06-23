import type { Rule } from "../core/types";
import { stripVariantPrefixes } from "../utils/tailwind";
import { allClasses, createFinding, firstUsageLine } from "./helpers";

export const randomShadowRule: Rule = {
  id: "ui-slop/random-shadow",
  name: "Random shadow",
  category: "design-system",
  defaultSeverity: "warn",
  run(context) {
    const shadowClasses = allClasses(context)
      .map(stripVariantPrefixes)
      .filter((className) => /^shadow(?:$|-(?:sm|md|lg|xl|2xl|inner|none|\[[^\]]+\]))$/.test(className));
    const uniqueShadowClasses = [...new Set(shadowClasses)];
    const heavyShadowCount = shadowClasses.filter((className) => ["shadow-xl", "shadow-2xl"].includes(className)).length;

    if (uniqueShadowClasses.length <= 3 && heavyShadowCount < 2) return [];

    return [
      createFinding(this, context, {
        ...firstUsageLine(context, (className) => stripVariantPrefixes(className).startsWith("shadow")),
        message: "Inconsistent or heavy shadow usage detected.",
        confidence: uniqueShadowClasses.length >= 5 || heavyShadowCount >= 3 ? "high" : "medium",
        suggestion: "Use a smaller shadow scale and avoid heavy shadows on repeated surfaces.",
      }),
    ];
  },
};
