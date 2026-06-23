import type { Rule } from "../core/types";
import { stripVariantPrefixes } from "../utils/tailwind";
import { allClasses, createFinding } from "./helpers";

const GENERIC_WORDS = [
  "ai-powered",
  "supercharge",
  "transform",
  "beautiful",
  "modern",
  "seamless",
  "workflow",
  "ship faster",
];

export const genericAiHeroRule: Rule = {
  id: "ui-slop/generic-ai-hero",
  name: "Generic AI hero",
  category: "ai-slop",
  defaultSeverity: "warn",
  run(context) {
    const classes = allClasses(context).map(stripVariantPrefixes);
    const sourceText = context.jsx.map((element) => element.text).join(" ").toLowerCase();
    const sourceLower = context.source.toLowerCase();
    let score = 0;

    if (classes.includes("text-center") && classes.some((className) => /^max-w-[34]xl$/.test(className))) {
      score += 2;
    }
    if (classes.some((className) => /^text-(?:5xl|6xl|7xl)$/.test(className)) || classes.includes("tracking-tight")) {
      score += 1;
    }
    if (classes.includes("bg-clip-text") && classes.includes("text-transparent")) {
      score += 2;
    }
    if (classes.some((className) => /^(?:rounded-full|border|px-[23]|py-1)$/.test(className)) && /badge|pill/i.test(context.source)) {
      score += 1;
    }
    if ((sourceLower.match(/<button|<Button|role=["']button|href=/g) ?? []).length >= 2) {
      score += 1;
    }
    if (GENERIC_WORDS.some((word) => sourceText.includes(word))) {
      score += 2;
    }

    if (score < 5) return [];

    const firstHero = context.jsx.find((element) => ["section", "main", "header"].includes(element.elementName));

    return [
      createFinding(this, context, {
        line: firstHero?.line,
        column: firstHero?.column,
        message:
          "Hero matches a common AI-generated SaaS pattern. Make the layout and copy more specific to the product.",
        confidence: score >= 7 ? "high" : "medium",
        suggestion: "Replace generic badge/headline/gradient/dual-CTA structure with product-specific proof and layout.",
      }),
    ];
  },
};
