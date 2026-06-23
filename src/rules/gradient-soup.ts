import type { Rule } from "../core/types";
import { stripVariantPrefixes } from "../utils/tailwind";
import { allClasses, createFinding, firstUsageLine } from "./helpers";

const AI_GRADIENT_COLORS = /^(?:from|via|to)-(?:purple|pink|blue|indigo|violet|fuchsia|cyan)-/;

export const gradientSoupRule: Rule = {
  id: "ui-slop/gradient-soup",
  name: "Gradient soup",
  category: "ai-slop",
  defaultSeverity: "warn",
  run(context) {
    const classes = allClasses(context).map(stripVariantPrefixes);
    const gradientUtilities = classes.filter(
      (className) => className.startsWith("bg-gradient-to-") || /^(?:from|via|to)-/.test(className),
    );
    const glowUtilities = classes.filter(
      (className) => /^(?:blur-[23]xl|blur-\[[^\]]+\]|opacity-[3-9]0)$/.test(className),
    );
    const hasAiGradientColors = classes.some((className) => AI_GRADIENT_COLORS.test(className));

    if (gradientUtilities.length < 3 && !(gradientUtilities.length >= 2 && glowUtilities.length > 0)) {
      return [];
    }

    return [
      createFinding(this, context, {
        ...firstUsageLine(context, (className) =>
          stripVariantPrefixes(className).startsWith("bg-gradient-to-"),
        ),
        message: hasAiGradientColors && glowUtilities.length > 0
          ? "Gradient-heavy styling with glow utilities detected. This is a common AI-generated SaaS UI pattern."
          : "Gradient-heavy styling detected. This is a common AI-generated SaaS UI pattern.",
        confidence: hasAiGradientColors ? "high" : "medium",
        suggestion: "Use gradients sparingly and tie color choices back to the product visual system.",
      }),
    ];
  },
};
