# Unslop UI

Catch UI slop before it ships.

Unslop UI is a deterministic CLI for scanning React, Tailwind, and shadcn/ui codebases for repeatable frontend design debt.

## Usage

```bash
npx unslop-ui .
```

Findings are printed with a code frame pointing at the exact offending line:

```
High impact
  error ui-slop/raw-hex-colors
  app/page.tsx:5:39
  Found 2 raw hex colors. Prefer semantic tokens or Tailwind theme colors.
    5 │     <main className="min-h-screen bg-[#f7f8ff] text-[#111827]">
      ╵                                       ^
  → Move color choices into semantic tokens such as bg-card, text-foreground, or primary.
```

Scaffold a config:

```bash
npx unslop-ui --init
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
});
```

Rules can be disabled with `"off"`.

### Turborepo and monorepos

Unslop UI scans common Turborepo layouts out of the box:

- `apps/*/{app,pages,components,src}/**/*.{ts,tsx,js,jsx}`
- `packages/*/{app,pages,components,src}/**/*.{ts,tsx,js,jsx}`

Generated workspace output is ignored by default, including nested `.turbo`,
`.next`, `dist`, `build`, and `coverage` directories.

Add an `unslop-ui` script to each app or package you want Turbo to check:

```json
{
  "scripts": {
    "lint:ui": "unslop-ui . --strict"
  }
}
```

Then run it across the repo:

```bash
turbo run lint:ui
```

## CI

```bash
unslop-ui . --strict
```

By default the CLI exits non-zero only for `error` findings. `--strict` treats warnings as build-failing.

### Output formats

```bash
unslop-ui . --format pretty   # default, with code frames
unslop-ui . --format json     # structured report (--json is a shorthand)
unslop-ui . --format sarif     # SARIF 2.1.0 for GitHub code scanning
```

SARIF lets findings show up as inline annotations on a pull request:

```yaml
# .github/workflows/unslop.yml
- run: npx unslop-ui . --format sarif > unslop.sarif
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: unslop.sarif
```

### Baselines (adopt on an existing codebase)

A repository with hundreds of existing findings can still gate *new* slop. Record
the current state once, commit the baseline, then fail CI only on regressions:

```bash
# Snapshot today's findings (writes unslop.baseline.json)
unslop-ui . --update-baseline

# In CI: known findings are suppressed, new ones fail the build
unslop-ui . --baseline --strict
```

Baselines fingerprint each finding by rule, file, and offending code — not by line
number — so they keep matching as the surrounding file changes. Use
`--baseline <path>` to point at a custom location.

## Philosophy

Unslop UI does not try to judge beauty. It catches repeatable design debt and AI-generated UI anti-patterns.

The scanner is static and deterministic in V0. It does not use screenshots, Playwright, Figma, or model-based judging.

## Attribution

Unslop UI's one-command audit workflow is inspired by [React Doctor](https://github.com/millionco/react-doctor). React Doctor focuses on React correctness, performance, architecture, security, and accessibility; Unslop UI applies a similar product shape to frontend design-system drift and AI-generated UI anti-patterns.
