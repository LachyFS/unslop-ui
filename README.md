# Unslop UI

Catch UI slop before it ships.

Unslop UI is a deterministic CLI for scanning React, Tailwind, and shadcn/ui codebases for repeatable frontend design debt.

## Usage

```bash
npx unslop-ui .
```

Local development:

```bash
pnpm install
pnpm dev -- fixtures/slop
pnpm dev -- fixtures/clean
```

## What it catches

- Generic AI SaaS heroes
- Gradient soup
- Card lasagna
- Muted text overuse
- Arbitrary Tailwind values
- Raw hex colors
- Token bypassing
- Inconsistent radius/shadow scales
- Default-looking shadcn UI

## Config

Create `unslop.config.ts`:

```ts
import { defineConfig } from "unslop-ui";

export default defineConfig({
  include: ["app/**/*.{tsx,jsx}", "components/**/*.{tsx,jsx}"],
  ignore: ["node_modules/**", ".next/**", "dist/**"],
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
});
```

Rules can be disabled with `"off"`.

## CI

```bash
pnpm unslop-ui . --strict
```

By default the CLI exits non-zero only for `error` findings. `--strict` treats warnings as build-failing.

Use JSON for machines:

```bash
unslop-ui . --json
```

## Philosophy

Unslop UI does not try to judge beauty. It catches repeatable design debt and AI-generated UI anti-patterns.

The scanner is static and deterministic in V0. It does not use screenshots, Playwright, Figma, or model-based judging.

## Attribution

Unslop UI's one-command audit workflow is inspired by [React Doctor](https://github.com/millionco/react-doctor). React Doctor focuses on React correctness, performance, architecture, security, and accessibility; Unslop UI applies a similar product shape to frontend design-system drift and AI-generated UI anti-patterns.
