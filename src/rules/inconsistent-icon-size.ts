import type { Rule } from "../core/types";
import { stripVariantPrefixes } from "../utils/tailwind";
import { allClasses, createFinding, firstUsageLine } from "./helpers";

export const inconsistentIconSizeRule: Rule = {
  id: "ui-slop/inconsistent-icon-size",
  name: "Inconsistent icon size",
  category: "components",
  defaultSeverity: "warn",
  run(context) {
    const classes = allClasses(context).map(stripVariantPrefixes);
    const directSizes = classes
      .map((className) => /^size-(\d+)$/.exec(className)?.[1])
      .filter((value): value is string => Boolean(value));
    const heightSizes = classes
      .map((className) => /^h-(\d+)$/.exec(className)?.[1])
      .filter((value): value is string => Boolean(value));
    const widthSizes = classes
      .map((className) => /^w-(\d+)$/.exec(className)?.[1])
      .filter((value): value is string => Boolean(value));
    const pairedSizes = heightSizes.filter((size) => widthSizes.includes(size));
    const uniqueSizes = [...new Set([...directSizes, ...pairedSizes])];

    if (uniqueSizes.length < 3) return [];

    return [
      createFinding(this, context, {
        ...firstUsageLine(context, (className) => /^(?:size|h|w)-\d+$/.test(stripVariantPrefixes(className))),
        message: `Inconsistent icon sizing detected (${uniqueSizes.map((size) => `${size}`).join(", ")}). Use a smaller set of icon sizes for better rhythm.`,
        confidence: uniqueSizes.length >= 4 ? "high" : "medium",
        suggestion: "Standardize icon sizes by role, such as 16px for dense controls and 20px for primary actions.",
      }),
    ];
  },
};
