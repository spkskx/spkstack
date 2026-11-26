# TypeScript skeleton

For an empty repo, as defined in `../../../docs/ticket-contract.md` (Sizing rule), when the user chose the skeleton in setup step 2. It writes a minimal TypeScript library with pnpm and vitest, so that [`typescript.md`](typescript.md) then runs on it unchanged and the first PR has real checks. No framework: web, CLI, or server choices belong to later tickets.

Like a profile, every file below goes into the step 5 plan, and nothing is written before that approval. When building the plan, treat these files as already present and run `typescript.md` against them: it finds a pnpm lockfile, `tsconfig.json`, and vitest, so it asks no questions about them.

Tested with pnpm 10.34, TypeScript 7.0, and vitest 5.1, together with the tool versions `typescript.md` names.

## Files

`<name>` is the repo name from `owner/repo`, lowercased.

`package.json`, with `<pnpm version>` from `pnpm --version` run outside the repo (so pnpm does not read the half-written file). `pnpm/action-setup` in CI reads this field:

```json
{
  "name": "<name>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@<pnpm version>"
}
```

No scripts here: `typescript.md` adds them.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

`src/slugify.ts`:

```ts
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}
```

`src/slugify.test.ts`, a behavior test that fails if `slugify` breaks (the two-edit check in [`../../../docs/tautological-tests.md`](../../../docs/tautological-tests.md)):

```ts
import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("lowercases words and joins them with single dashes", () => {
    expect(slugify("  Fix Login, Timeout!  ")).toBe("fix-login-timeout");
  });
});
```

`.gitignore`: add `node_modules` if it is not already listed. Keep any existing lines.

Leave `README*`, `LICENSE*`, and `CLAUDE.md` as they are, apart from the `## spkstack` section that step 3 writes.

## Install

After approval, in setup step 5.2, before anything from `typescript.md`:

```bash
pnpm add -D typescript vitest
```

This writes `pnpm-lock.yaml`. Then follow `typescript.md`'s install, config, scripts, CI, and Run sections. The skeleton passes `lint`, `format:check`, `typecheck`, and `test` as written, so every check in the setup PR must be green: a red check here is a bug in this file or the profile, not an expected failure on an existing codebase. Open the setup PR as a draft and name the check if one is red.
