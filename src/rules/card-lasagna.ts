import type { Rule } from "../core/types";
import { stripVariantPrefixes } from "../utils/tailwind";
import { createFinding } from "./helpers";

export const cardLasagnaRule: Rule = {
  id: "ui-slop/card-lasagna",
  name: "Card lasagna",
  category: "layout",
  defaultSeverity: "warn",
  run(context) {
    const cardLike = context.jsx.filter((element) => getCardSignals(element.classes).size >= 2);
    const deepCardLike = cardLike.filter((element) => element.depth >= 4);

    if (cardLike.length < 6 && deepCardLike.length < 3) return [];

    const first = cardLike[0];

    return [
      createFinding(this, context, {
        line: first?.line,
        column: first?.column,
        message: `Nested card-heavy layout detected: ${cardLike.length} card-like wrappers use stacked border, radius, shadow, background, or padding treatments.`,
        confidence: cardLike.length >= 9 || deepCardLike.length >= 3 ? "high" : "medium",
        suggestion: "Flatten the hierarchy or reduce repeated borders, shadows, and rounded containers.",
      }),
    ];
  },
};

function getCardSignals(classes: string[]): Set<string> {
  const signals = new Set<string>();

  for (const rawClass of classes) {
    const className = stripVariantPrefixes(rawClass);
    if (className === "card" || className === "bg-card" || className === "bg-white") {
      signals.add("background");
    }
    if (className === "border" || className.startsWith("border-")) {
      signals.add("border");
    }
    if (className === "rounded" || className.startsWith("rounded-")) {
      signals.add("radius");
    }
    if (className === "shadow" || className.startsWith("shadow-")) {
      signals.add("shadow");
    }
    if (/^p[trblxy]?-(?:\d+|\[[^\]]+\])$/.test(className)) {
      signals.add("padding");
    }
  }

  return signals;
}
