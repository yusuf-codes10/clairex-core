<div align="center">
  <a href="https://clairex-docs.vercel.app/">
    <img src="https://clairex-docs.vercel.app/images/logo.png" width="500" alt="ClaireX"/>
  </a>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@clairex/core"><img src="https://img.shields.io/npm/v/@clairex/core" alt="npm"/></a>
  <img src="https://img.shields.io/badge/runtime-Bun-000000" alt="Bun"/>
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="Dependencies"/>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/></a>
  <a href="https://clairex-docs.vercel.app/"><img src="https://img.shields.io/badge/docs-clairex--docs-722f37" alt="Docs"/></a>
</p>

<hr />



ClaireX (claire, French for clear) is a class-based, explicitly-typed web framework for Bun. One class per resource, validation built in, three-level middleware and zero runtime dependencies.

```ts
import { ClaireX } from "@clairex/core";

new ClaireX().listen();
```
## Why ClaireX


## Features

- **OOP First** Everything is a class you instantiate, extend, and override. No decorators, no config objects, no magic strings. `override` is enforced, so you always know when you're replacing framework behaviour.

- **Built-in Validation** One `ClaireValidator` per resource, not one per action. No Zod, no Yup, no Joi, no dependencies. Enforcement adapts to the method: `POST` and `PUT` require every field, `PATCH` treats them as optional while still checking types and bounds, and `immutable` fields are rejected on update.

- **ClaireKey (5 in 1)** Controller, router group, module, middleware scope, and plugin in a single class. A key owns its prefix, routes, handlers, and scoped middleware; `unlock()` mounts all of it at once. Routes are never defined on the app.

- **`.claire` files** An optional file extension: TypeScript with two extra rules enforced when the file loads. It must export a class, and methods declared with `private`, `public`, `protected`, or `override` must declare an explicit return type. Break either and the process stops before the server starts, a violation is an error, not a warning.

## Quick Start

```bash
  bun create clairex my-app && cd my-app && bun install && bun dev
```

## Documentation

Full documentation: [clairex-docs.vercel.app](https://clairex-docs.vercel.app/)

## Configuration

`bunfig.toml` required if you use `.claire` files:

```toml
# root
preload = ["@clairex/core/plugin"]
```

Without this, Bun parses `.claire` files with no loader and their exports come back empty. You get `Export named 'userKey' not found`, which doesn't hint at the cause. Plain `.ts` files need no configuration.

`tsconfig.json` ClaireX expects strict, explicit typing:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "types": ["bun"]
  }
}
```

`noImplicitOverride` matters. ClaireX relies on `override` being explicit when you extend its classes.

Imports of `.claire` files must include the extension: `./keys/user.key.claire`.

## Editor Support (Optional)

ClaireX ships a **VS Code extension** that teaches the editor about `.claire`
files, it resolves `.claire` imports and gives them full TypeScript language
support (autocomplete, go-to-definition, inline errors).

This is optional. `.claire` files run correctly without it; only the editing
experience changes.

The extension is bundled in this repo as a `.vsix`. From a clone of
`clairex-core`:

```bash
code --install-extension packages/vscode-extension/clairex-vscode-0.1.0.vsix
```
If the code command isn't on your PATH, install it through the VS Code UI instead: Extensions → ⋯ → Install from VSIX… and select the file above.

Then reload VS Code.

## Attribution

ClaireX has **zero runtime dependencies**.

| | |
|---|---|
| [Bun](https://bun.sh) | runtime — `Bun.serve` and `Bun.plugin` |
| `typescript` | peer dependency |
| `@types/bun` | development only |

The documentation site is built with Nuxt, Nuxt Content, Nuxt UI, and Tailwind CSS.

## License

[MIT](LICENSE) © 2026 - present, Yusuf Codes10

## Author

[Yusuf Codes10](https://github.com/yusuf-codes10)
