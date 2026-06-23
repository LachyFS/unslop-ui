import type { Rule } from "../core/types";
import { arbitraryTailwindValuesRule } from "./arbitrary-tailwind-values";
import { cardLasagnaRule } from "./card-lasagna";
import { genericAiHeroRule } from "./generic-ai-hero";
import { gradientSoupRule } from "./gradient-soup";
import { inconsistentIconSizeRule } from "./inconsistent-icon-size";
import { mutedEverythingRule } from "./muted-everything";
import { randomRadiusRule } from "./random-radius";
import { randomShadowRule } from "./random-shadow";
import { rawHexColorsRule } from "./raw-hex-colors";
import { shadcnDefaultLookRule } from "./shadcn-default-look";
import { tokenBypassRule } from "./token-bypass";

export const allRules: Rule[] = [
  rawHexColorsRule,
  arbitraryTailwindValuesRule,
  tokenBypassRule,
  gradientSoupRule,
  cardLasagnaRule,
  mutedEverythingRule,
  randomRadiusRule,
  randomShadowRule,
  shadcnDefaultLookRule,
  genericAiHeroRule,
  inconsistentIconSizeRule,
];
