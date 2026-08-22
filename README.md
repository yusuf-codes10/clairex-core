<div align="center">
  <a href="https://clairex-docs.vercel.app/">
    <img src="https://clairex-docs.vercel.app/images/logo.png" width="500" height="auto" alt="ClaireX"/>
  </a>
</div>

<hr />

ClaireX -claire, French for clear- is a class-based, explicitly-typed web framework for Bun. One class per resource, validation built in, three-level middleware and zero runtime dependencies.

```ts
import { ClaireX } from "@clairex/core";

new ClaireX().listen();
```

## Quick Start

```bash
bun create clairex my-app
```

## Features

- **OOP First** Everything is a class you instantiate, extend, and override. No decorators, no config objects, no magic strings. `override` is enforced, so you always know when you're replacing framework behaviour.

- **Built-in Validation** One `ClaireValidator` per resource, not one per action. No Zod, no Yup, no Joi, no dependencies. Enforcement adapts to the method: `POST` and `PUT` require every field, `PATCH` treats them as optional while still checking types and bounds, and `immutable` fields are rejected on update.

- **ClaireKey (5 in 1)** Controller, router group, module, middleware scope, and plugin in a single class. A key owns its prefix, routes, handlers, and scoped middleware; `unlock()` mounts all of it at once. Routes are never defined on the app.

- **`.claire` files** An optional file extension: TypeScript with two extra rules enforced when the file loads. It must export a class, and methods declared with `private`, `public`, `protected`, or `override` must declare an explicit return type. Break either and the process stops before the server starts, a violation is an error, not a warning.

## Usage

Every resource is a `ClaireKey`, it owns its prefix, its routes, its handlers, and its middleware.

```ts
// src/keys/user.key.claire
export class userKey extends ClaireKey {
  constructor() {
    super("/users");
  }

  protected register(): void {
    this.routes("get", "/", this.getUsers);
    this.routes("post", "/", this.createUser, [new userValidator()]);
    this.routes("patch", "/:id", this.updateUser, [new userValidator()]);
  }
}
```

Mount and every route comes with it:

```ts
new ClaireX(3000).unlock(new userKey()).listen();
```

One validator serves the whole resource. `POST` requires every field; `PATCH` treats them as optional but still enfornces types and bounds:

```ts
export class userValidator extends ClaireValidator {
  override rules(): ValidationSchema {
    return {
      id: { type: "number", required: true, immutable: true },
      name: { type: "string", required: true, min: 3, max: 50 },
      age: { type: "number", required: true, min: 18 },
    };
  }
}
```

Read the full body with `valid<T>()`, a partial one with `patched<T>()` which returns `Partial<T>`, so a partial update cannot be assigned as though it were complete.

Full documantation: [!https://clairex-docs.vercel.app]

## Configuration

`bunfig.toml` required if you use `.claire` files:

```bash
# root
preload = ["@clairex/core/plugin"]

```

Without this, Bun parses `.claire` files with no loader and their exports come back empty. You get Export named `userKey` not found, which doesn't hint at the cause. Plain .ts files need no configuration.

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

`noImplicitOverride` matters. ClaireX relies on override being explicit when you extend its classes.

Imports of `.claire` files must include the extension: ./keys/user.key.claire.

## Testing

```bash
bun test
```

Covers route matching, validation rules, exception handling, and utilities.

## How Kiro was used

ClaireX was built spec-first. The specs live in .kiro/specs/clairex-core/:

- `requirements.md`: 13 user stories with acceptance criteria and a traceability table

- `design.md`: architecture and class responsibilities

- `tasks.md`: 48 numbered tasks, each recording the commits that implemented it

The specs were a living document, not documentation written afterwards. Task 44 is marked superseded by Task 48. Task 38 records a feature that was planned and dropped. The Open Problems section logged five problems before solutions existed. Two user stories are marked partial, because they are.

The clearest example is **Task 46**, which documents a data-loss bug found mid-build: a `PATCH` carrying only some fields was being read as a complete object, silently erasing stored values. The task records the diagnosis, the fix, and the commits — starting with `f940e3c`, "issue found: patch data lost". The fix made the mistake impossible to express: patched<T>() returns Partial<T>, so the erasing assignment no longer compiles.

## Costs and Limits

**Costs**: none. ClaireX calls no external services and requires no API keys or accounts.

**Rate limits**: none.

**Test credentials**: none required.

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

## Getting Started

Three ways in, depending on whether you want to *see* ClaireX working or *build* with it.

---

### 1. Run the example (fastest look)

Clone the repo and run the bundled example. Nothing to create, nothing to configure.

```bash
git clone https://github.com/yusuf-codes10/clairex-core.git
cd clairex-core
bun install
bun run app
```

The server starts on `http://localhost:2300` with a complete `users` resource — routes, validation, and error handling already wired.

```bash
curl http://localhost:2300/users
```

Try the validation:

```bash
# rejected — name is too short
curl -X POST http://localhost:2300/users \
  -H "Content-Type: application/json" \
  -d '{"id":4,"name":"Ad","age":36}'

# accepted
curl -X POST http://localhost:2300/users \
  -H "Content-Type: application/json" \
  -d '{"id":4,"name":"Ada","age":36}'
```

And a partial update — note the name survives:

```bash
curl -X PATCH http://localhost:2300/users/1 \
  -H "Content-Type: application/json" \
  -d '{"age":24}'
```

This is also the only path that gives you the bundled VS Code extension, since it lives in `packages/`.

---

### 2. Scaffold a project (recommended)

The way to actually start building.

```bash
bun create clairex my-app
cd my-app
bun install
bun dev
```

You get a running API on `http://localhost:3000` and four files:

```
src/
├── index.ts                          the app
├── types/user.ts                     compile-time shape
├── keys/user.key.claire              routes + handlers
└── validators/user.validator.claire  runtime shape
```

`bunfig.toml` and `tsconfig.json` are generated for you, already configured — including the `.claire` loader, so `.claire` files work immediately.

---

### 3. Install manually (least recommended)

Only if you want ClaireX inside an existing project, or you'd rather assemble it yourself.

```bash
mkdir my-app && cd my-app
bun init -y
bun add @clairex/core
```

Then create `bunfig.toml` in the project root:

```toml
preload = ["@clairex/core/plugin"]
```

**This step is required if you use `.claire` files.** Without it, Bun parses them with no loader and their exports come back empty — you'll get `Export named 'userKey' not found`, which doesn't point anywhere near the real cause. If you only use `.ts` files, you can skip it.

You'll also need strict TypeScript settings in `tsconfig.json`:

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

`noImplicitOverride` matters — ClaireX relies on `override` being explicit when you extend its classes.

This path is least recommended because these two files are easy to get wrong and the resulting errors don't explain themselves. Options 1 and 2 hand them to you correctly.

---

> Imports of `.claire` files must include the extension: `./keys/user.key.claire`. There is no extension resolution — the loader matches on the literal filename.


## Author

[Yusuf Codes10](!https://github.com/yusuf-codes10)
