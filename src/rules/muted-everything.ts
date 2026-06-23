import type { Rule } from "../core/types";
import { isMutedTextClass } from "../utils/tailwind";
import { allClasses, createFinding, firstUsageLine } from "./helpers";

export const mutedEverythingRule: Rule = {
  id: "ui-slop/muted-everything",
  name: "Muted everything",
  category: "typography",
  defaultSeverity: "warn",
  run(context) {
    const mutedTextClasses = allClasses(context).filter(isMutedTextClass);
    const textBearingElements = context.jsx.filter((element) => element.text.length > 0);
    const mutedRatio = textBearingElements.length > 0 ? mutedTextClasses.length / textBearingElements.length : 0;

    if (mutedTextClasses.length < 4 && !(mutedTextClasses.length >= 3 && mutedRatio >= 0.5)) {
      return [];
    }

    return [
      createFinding(this, context, {
        ...firstUsageLine(context, isMutedTextClass),
        message: `Muted text is overused (${mutedTextClasses.length} muted text utilities). Primary explanatory copy usually needs stronger contrast.`,
        confidence: mutedRatio >= 0.5 ? "high" : "medium",
        suggestion: "Reserve muted text for secondary metadata, helper copy, and de-emphasized labels.",
      }),
    ];
  },
};
