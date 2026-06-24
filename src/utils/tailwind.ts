const PALETTE_COLORS = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const COLOR_SCALE = "(?:50|100|200|300|400|500|600|700|800|900|950)";
const PALETTE_PATTERN = new RegExp(
  `^(?:bg|text|border|from|via|to|ring|fill|stroke)-(?:${PALETTE_COLORS.join("|")})-${COLOR_SCALE}$`,
);

const MUTED_TEXT_PATTERN = /^(?:text-muted-foreground|text-(?:gray|slate|zinc|neutral)-[45]00)$/;
const EXACT_UTILITY_CLASSES = new Set([
  "container",
  "sr-only",
  "not-sr-only",
  "hidden",
  "block",
  "inline",
  "inline-block",
  "inline-flex",
  "flex",
  "inline-grid",
  "grid",
  "contents",
  "flow-root",
  "relative",
  "absolute",
  "fixed",
  "sticky",
  "static",
  "visible",
  "invisible",
  "isolate",
  "isolation-auto",
  "border",
  "border-x",
  "border-y",
  "border-t",
  "border-r",
  "border-b",
  "border-l",
  "shadow",
  "rounded",
  "truncate",
  "clearfix",
  "antialiased",
  "subpixel-antialiased",
  "italic",
  "not-italic",
  "uppercase",
  "lowercase",
  "capitalize",
  "normal-case",
  "underline",
  "overline",
  "line-through",
  "no-underline",
  "transform",
  "filter",
  "backdrop-filter",
]);
const UTILITY_PREFIX_PATTERN =
  /^(?:-?(?:m|mx|my|ms|me|mt|mr|mb|ml|p|px|py|ps|pe|pt|pr|pb|pl|space-x|space-y|gap|gap-x|gap-y|w|h|min-w|max-w|min-h|max-h|size|inset|inset-x|inset-y|top|right|bottom|left|z|basis|grow|shrink|order|col|col-span|col-start|col-end|row|row-span|row-start|row-end|translate-x|translate-y|scale|scale-x|scale-y|rotate|skew-x|skew-y)-|(?:items|content|self|justify|place-items|place-content|place-self|flex|grid|auto|overflow|overscroll|object|float|clear|box|decoration|underline-offset|align|whitespace|break|hyphens|list|appearance|columns|break-before|break-after|break-inside|snap|scroll|touch|select|pointer-events|resize|cursor|caret|accent|fill|stroke|stroke-dasharray|stroke-dashoffset|opacity|mix-blend|bg-blend|shadow|outline|ring|divide|border|rounded|bg|from|via|to|text|font|leading|tracking|line-clamp|indent|align|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|backdrop|transition|duration|delay|ease|animate|origin|transform)-)/;

export function splitClasses(value: string): string[] {
  return value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isLikelyClassList(
  value: string,
  options: { allowSingleUtility?: boolean } = {},
): boolean {
  const classes = splitClasses(value);
  if (classes.length === 0) return false;

  const utilityCount = classes.filter(isLikelyTailwindClass).length;
  if (classes.length === 1) {
    return Boolean(options.allowSingleUtility) && utilityCount === 1;
  }

  return utilityCount >= 2 || utilityCount / classes.length >= 0.75;
}

export function isLikelyTailwindClass(className: string): boolean {
  const normalized = normalizeUtilityClass(className);
  const positive = normalized.startsWith("-") ? normalized.slice(1) : normalized;

  if (EXACT_UTILITY_CLASSES.has(positive)) return true;
  if (/^\[[^\]]+:[^\]]+\]$/.test(positive)) return true;
  return UTILITY_PREFIX_PATTERN.test(positive);
}

export function isPaletteColorClass(className: string): boolean {
  return PALETTE_PATTERN.test(normalizeUtilityClass(className));
}

export function isMutedTextClass(className: string): boolean {
  return MUTED_TEXT_PATTERN.test(normalizeUtilityClass(className));
}

export function stripVariantPrefixes(className: string): string {
  const arbitraryVariantIndex = className.lastIndexOf("]:");
  if (arbitraryVariantIndex >= 0) {
    return className.slice(arbitraryVariantIndex + 2);
  }

  const parts = className.split(":");
  return parts[parts.length - 1] ?? className;
}

export function uniqueClasses(classes: string[]): string[] {
  return [...new Set(classes)];
}

function stripImportant(className: string): string {
  return className.startsWith("!") ? className.slice(1) : className;
}

function normalizeUtilityClass(className: string): string {
  return stripImportant(stripVariantPrefixes(className));
}
