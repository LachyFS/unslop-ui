import type { ResolvedUnslopConfig } from "../core/types";

export const defaultConfig: ResolvedUnslopConfig = {
  include: [
    "app/**/*.{ts,tsx,js,jsx}",
    "pages/**/*.{ts,tsx,js,jsx}",
    "components/**/*.{ts,tsx,js,jsx}",
    "src/**/*.{ts,tsx,js,jsx}",
    "apps/*/{app,pages,components,src}/**/*.{ts,tsx,js,jsx}",
    "packages/*/{app,pages,components,src}/**/*.{ts,tsx,js,jsx}",
  ],
  ignore: [
    "**/node_modules/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/*.test.*",
    "**/*.spec.*",
  ],
  stack: {
    react: true,
    tailwind: true,
    shadcn: true,
  },
  rules: {
    "ui-slop/token-bypass": "warn",
    "ui-slop/arbitrary-tailwind-values": "warn",
    "ui-slop/raw-hex-colors": "error",
    "ui-slop/gradient-soup": "warn",
    "ui-slop/card-lasagna": "warn",
    "ui-slop/muted-everything": "warn",
    "ui-slop/random-radius": "warn",
    "ui-slop/random-shadow": "warn",
    "ui-slop/shadcn-default-look": "warn",
    "ui-slop/generic-ai-hero": "warn",
    "ui-slop/inconsistent-icon-size": "warn",
  },
};
