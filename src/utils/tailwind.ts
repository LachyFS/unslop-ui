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

export function splitClasses(value: string): string[] {
  return value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isPaletteColorClass(className: string): boolean {
  return PALETTE_PATTERN.test(stripVariantPrefixes(className));
}

export function isMutedTextClass(className: string): boolean {
  return MUTED_TEXT_PATTERN.test(stripVariantPrefixes(className));
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
