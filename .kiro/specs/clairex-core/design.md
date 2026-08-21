# ClaireX-core Design

## What is ClaireX?

ClaireX is a class-based, explicitly-typed web framework for Bun. Everything is a class. Every type is declared. No inference, no magic, no external validation libraries. The framework enforces structure by design — not by convention.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                            ClaireX                                    │
│         The application orchestrator. Three methods only.            │
│         unlock() · use() · listen()                                  │
│         Owns: ClaireRouter (internal), ClaireMiddleware[] (global)   │
└──────────┬───────────────────────┬───────────────────────────────────┘
           │                       │
    ┌──────▼──────┐         ┌──────▼──────────┐
    │ ClaireKey   │         │ ClaireMiddleware │
    │ (per resource)│         │ (global chain)   │
    │ prefix      │         │ before() / after()│
    │ routes      │         └─────────────────┘
    │ handlers    │
    │ middlewares │
    └──────┬──────┘
           │
    ┌──────▼──────────────────────────────────────┐
    │              ClaireRouter (internal)          │
    │   Stores RouterEntry[] — route matching       │
    │   get/post/put/patch/delete helpers           │
    └──────┬───────────────────────────────────────┘
           │
    ┌──────▼──────┐
    │ClaireContext │
    │ (per request)│
    │ .request     │─── ClaireRequest (wraps native Request)
    │ .response    │─── ClaireResponse (response builder)
    │ .valid<T>()  │─── validated full body (POST/PUT)
    │ .patched<T>()│─── validated partial body (PATCH)
    │ .auth<T>()   │─── decoded JWT payload
    └──────────────┘

─── Validation ─────────────────────────────────────

    ┌──────────────────┐
    │ ClaireValidator  │ extends ClaireMiddleware
    │ abstract rules() │ → ValidationSchema
    │ partial()        │ → runtime counterpart of Partial<T>
    │ before(): method-aware validation, stores proven data
    └──────────────────┘

─── Error Handling ─────────────────────────────────

    ┌──────────────────┐
    │ ClaireException  │ extends Error
    │ toResponse()     │ → structured JSON + styled console log
    │ Global try/catch in ClaireX catches all
    └──────────────────┘

─── Utilities ──────────────────────────────────────

    matchRoute()    — dynamic path matching (:param segments)
    clairexBanner() — styled startup console output
    logClaireException() — styled error box in terminal
    colorMethod()   — colored HTTP method strings
    ClaireUtil      — public static helpers (signToken, verifyToken)

─── Tooling (separate packages) ────────────────────

    @clairex/core/plugin        — Bun.plugin loader for .claire files
    @clairex/typescript-plugin  — resolves .claire imports in the editor
    clairex-vscode              — VS Code extension (zero-config setup)
    create-clairex              — project scaffolding CLI
```

---

## Core Philosophy

| Principle | How ClaireX enforces it |
|-----------|------------------------|
| Explicit types only | No type inference — declare everything like Java |
| Everything is a class | ClaireKey, ClaireMiddleware, ClaireValidator, ClaireException |
| Built-in validation | No Zod/Yup — ClaireValidator IS the validation layer |
| Bun-native | Built on Bun.serve, targets Bun runtime only |
| Composition over inheritance | ClaireX owns a router, ClaireContext owns request + response |
| Getters for state, methods for actions | Derived data = getter. Side effects = method. |
| Backing field pattern | `private _field` + public getter for encapsulation |
| Zero external dependencies | Framework is self-contained |
| Never fail silently | Every missing-setup or misuse case throws with a hint naming the fix |

---

## The ClaireKey — One Concept, Five Roles

ClaireKey is ClaireX's central building block. It replaces what other frameworks need 5 separate concepts for:

| Other frameworks need | ClaireX uses |
|----------------------|--------------|
| Controller | ClaireKey |
| Router Group | ClaireKey (prefix) |
| Plugin | ClaireKey (mountable, self-contained) |
| Middleware Scope | ClaireKey (owns middlewares) |
| Module | ClaireKey (self-registers) |

```typescript
export class UserKey extends ClaireKey {
    constructor() {
        super('/users', [new AuthGuard()]);  // prefix + scoped middleware
    }

    register(): void {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser, [new UserValidator()]);
        this.routes('get', '/:id', this.getUserById);
    }

    private getUsers(c: ClaireContext): Response { ... }
    private createUser(c: ClaireContext): Response { ... }
    private getUserById(c: ClaireContext): Response { ... }
}
```

---

## ClaireX — The Application (3 Methods)

ClaireX is the orchestrator. It does not define routes. It does not handle requests directly. It:

1. **Unlocks** keys (registers their routes)
2. **Uses** global middleware
3. **Listens** (starts the server)

```typescript
new ClaireX(3000)
    .unlock(new UserKey())
    .unlock(new PostKey())
    .use(new ClaireCors('*', ['Content-Type'], ['GET', 'POST'], []))
    .listen();
```

`unlock()` and `use()` return `this` for chaining. `listen()` returns `void` and terminates the chain.

Internally, ClaireX owns:
- `router: ClaireRouter` — stores all routes from unlocked keys
- `middlewareChain: ClaireMiddleware[]` — global middleware stack (ClaireLogger auto-registered first)
- The `fetch` handler with route matching, middleware execution, error handling

---

## Three-Level Middleware (Onion Model)

```
┌─────────────────────────────────────────────────────┐
│  GLOBAL (app.use)                                    │
│  ┌─────────────────────────────────────────────┐    │
│  │  KEY-LEVEL (ClaireKey constructor)            │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │  ROUTE-LEVEL (this.routes 4th param) │    │    │
│  │  │  ┌─────────────────────────────┐    │    │    │
│  │  │  │        HANDLER              │    │    │    │
│  │  │  └─────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Execution order:**
1. Global `before()` — in registration order
2. Key-level `before()` — in registration order
3. Route-level `before()` — in registration order
4. **Handler**
5. Route-level `after()` — reverse order
6. Key-level `after()` — reverse order
7. Global `after()` — reverse order

**Short-circuit:** Any `before()` that returns a `Response` stops everything below it.

---

## ClaireValidator — One Validator Per Resource

ClaireValidator extends ClaireMiddleware. It IS the validation mechanism.

**The design decision that shapes it:** a validator is defined **per resource, not per action**. A per-action model would mean three validator classes for POST/PUT/PATCH — roughly 30 files for a 10-resource API. That is Zod's schema-per-action model rewritten as classes, not a solution.

The insight: **PATCH is a partial of POST.** That is REST semantics, not a ClaireX convention. The *shape* does not change per action, only the *required* enforcement does. So one schema per resource is enough, and the framework adjusts enforcement based on the HTTP method.

```typescript
export class UserValidator extends ClaireValidator {
    override rules(): ValidationSchema {
        return {
            id:   { type: 'number', required: true, immutable: true },
            name: { type: 'string', required: true, min: 3, max: 50 },
            age:  { type: 'number', required: true, min: 18 }
        };
    }
}
```

**Enforcement per method:**

| Method | Schema used | `required` enforced? |
|--------|-------------|---------------------|
| POST | `rules()` | ✅ yes |
| PUT | `rules()` | ✅ yes (full replacement) |
| PATCH | `partial(rules())` | ❌ no — type/min/max still checked on present fields |
| GET / DELETE / HEAD / OPTIONS | none — early return | n/a |

**Validation pipeline (`before()`):**

```
Request
  │
  ▼ bodyless method? → return (nothing to validate)
  │
  ▼ pick schema: PATCH → partial(rules()), else rules()
  │
  ▼ parse body
  │
  ▼ immutable field present on PATCH? → 400 (checked first)
  │
  ▼ per field: required → type → min → max
  │             ↳ first failure returns 400 and short-circuits
  │
  ▼ collect passing fields into `validated` (schema keys only)
  │
  ▼ PATCH with zero recognised fields? → 400
  │
  ▼ store: c.partial = isPartial; c.body = validated
```

**Two guarantees worth calling out:**

- **Unknown keys are stripped.** `validated` is built from schema keys only, so `{ name: "x", isAdmin: true }` cannot smuggle `isAdmin` into the handler wearing a validated type.
- **`immutable` fields are rejected, not dropped.** Sending one on PATCH returns 400 rather than being silently ignored.

**User workflow:**
1. Declare the type: `type User = { id: number, name: string, age: number }`
2. Extend ClaireValidator with `rules()`
3. Attach as route-level middleware
4. Read with the accessor matching the method

No Zod. No external deps. ClaireX validates at runtime, TypeScript types at compile time. Two explicit declarations for two different purposes — `partial()` is the runtime counterpart of TypeScript's `Partial<T>`, named to mirror it.

---

## `valid<T>()` vs `patched<T>()` — Preventing Silent Data Loss

Because PATCH stores only the fields that were sent, reading a partial body with a full-body type is a **type lie**:

```typescript
const { name } = c.valid<User>();   // claims name is always a string
foundUser.name = name;              // PATCH { age: 30 } → name is undefined → field erased
```

That compiles cleanly and silently destroys data. The framework cannot prevent it by inspecting the generic — the user supplies it.

**Solution: make the wrong thing inexpressible.** Two accessors whose return types the framework controls:

| | `valid<T>()` | `patched<T>()` |
|---|---|---|
| Returns | `T` — every field guaranteed | `Partial<T>` — every field optional |
| Valid on | POST, PUT | PATCH |
| Runtime guard | throws if the body was partial | throws if the body was full |
| Handler must | use fields directly | check `!== undefined` before assigning |
| Prevents | missing validator | **silent field erasure** |

The asymmetry is the mechanism: the user passes `User`, `patched()` returns `Partial<User>`, and they cannot widen it. So the unsafe assignment fails to compile:

```typescript
const patch = c.patched<User>();
foundUser.name = patch.name;
// ❌ Type 'string | undefined' is not assignable to type 'string'
```

Correct usage:

```typescript
const patch = c.patched<User>();
if (patch.name !== undefined) foundUser.name = patch.name;
if (patch.age  !== undefined) foundUser.age  = patch.age;
```

A runtime mode flag (`c.partial`, set by the validator) backs this up so the pair cannot be mismatched — each accessor throws with a message naming the correct one.

---

## Error Handling — Global Catch

All thrown errors bubble to ClaireX's `fetch` try/catch:

```typescript
catch (e) {
    if (e instanceof ClaireException) return e.toResponse();
    return new ClaireException(500, 'Internal Server Error').toResponse();
}
```

- **ClaireException** → structured JSON response with correct status code
- **Unknown errors** → generic 500
- **`toResponse()`** → serializes to JSON + logs styled error in terminal

Two patterns for users:
- `throw new ClaireException(404, 'Not found')` — bubbles to catch
- `return new ClaireException(404, 'Not found').toResponse()` — inline, never hits catch

---

## Request Lifecycle

```
HTTP Request (Bun.serve)
    │
    ▼
Route Matching Loop (linear scan over native req.method / URL pathname)
├── method mismatch? → continue
├── matchRoute(pattern, pathname) → null? → continue
└── MATCH
    │
    ▼
new ClaireContext(req, params)   ← created after matching, params passed at birth
├── new ClaireRequest(req, params)
└── new ClaireResponse()
    │
    ▼
Global before() chain
    │
    ▼
Key-level before() chain
    │
    ▼
Route-level before() chain (includes ClaireValidator)
    │
    ▼
HANDLER → returns Response
    │
    ▼
Route-level after() (reverse)
    │
    ▼
Key-level after() (reverse)
    │
    ▼
Global after() (reverse)
    │
    ▼
Response → Bun → Client

    ╳ (any point throws)
    ▼
ClaireException caught → structured JSON error
```

---

## Developer Experience (Terminal)

ClaireX has a visual identity in the terminal:

- **Startup:** Wine-coloured ASCII art banner with framework info
- **Requests:** Color-coded HTTP methods (GET=green, POST=blue, PUT=yellow, PATCH=purple, DELETE=red)
- **Duration:** Request timing via ClaireLogger (`before` + `after`)
- **Errors:** Styled red error boxes with optional yellow hints

ClaireLogger is auto-registered as the first global middleware — zero config logging by default.

The same wine (`#722f37`) is used for the `.claire` file icon in the editor, giving ClaireX one colour identity across console and IDE.

---

## The `.claire` File Extension

`.claire` files are TypeScript with additional rules enforced at **load time** by a Bun plugin.

```
.claire file imported
    │
    ▼
Bun.plugin onLoad (filter: /\.claire$/)
    │
    ▼
read contents → validate against ClaireX rules
    │
    ├── violation → styled terminal error → process.exit(1)
    └── valid     → return { contents, loader: "ts" }
```

**Rules:**

| Rule | Enforces | Status |
|------|----------|--------|
| 1 | File must export a class | ✅ working |
| 2 | Methods with access modifiers must declare explicit return types | ✅ working |
| 3 | `c.valid<T>()` without a validator on the route | ⬜ stubbed |
| 4 | Explicit types on all parameters | ⬜ stubbed |

Registered via the consumer's `bunfig.toml`:

```toml
preload = ["@clairex/core/plugin"]
```

**Enforcement is load-time, not editor-time.** Only files that are actually imported get validated — an orphan `.claire` file is never checked. The trade-off is deliberate: the loader is a hard gate that refuses to run invalid code.

---

## Editor Tooling

TypeScript's module resolver does not recognise `.claire`, so `import { X } from './y.claire'` fails in the editor even though Bun resolves it fine at runtime.

**Solution:** `@clairex/typescript-plugin`, a TypeScript Language Service Plugin that patches `resolveModuleNameLiterals` — resolving `.claire` paths manually and returning them with `extension: ts.Extension.Ts`. Same approach Volar (Vue) and `typescript-svelte-plugin` use, but simpler: `.claire` files are already valid TypeScript, so no transformation or virtual-file layer is needed.

The `clairex-vscode` extension ships that plugin plus `configurationDefaults`, so `.claire` files are handed to TypeScript (`files.associations`) and get the full editing experience — IntelliSense, hover, go-to-definition, rename, formatting — with zero user configuration.

**A custom language ID was tried first and rejected:** it gave syntax highlighting but excluded `.claire` from every TypeScript language feature, because VS Code's TypeScript extension only serves documents whose language is `typescript`. Since `.claire` *is* TypeScript, TypeScript should own it.

---

## File Structure

```
clairex-core/                     ← monorepo
├── package.json                  → @clairex/core
├── src/
│   ├── core/
│   │   ├── clairex.ts            — ClaireX (application orchestrator)
│   │   ├── key.ts                — ClaireKey (abstract, self-contained resource unit)
│   │   ├── context.ts            — ClaireContext (request + response + validated body + auth)
│   │   ├── request.ts            — ClaireRequest (wraps native Request)
│   │   ├── response.ts           — ClaireResponse (json, text, html, redirect)
│   │   ├── router.ts             — ClaireRouter (route storage, internal)
│   │   ├── middleware.ts         — ClaireMiddleware (abstract: before/after)
│   │   ├── validator.ts          — ClaireValidator (rules + method-aware engine)
│   │   ├── exception.ts          — ClaireException (typed errors + toResponse)
│   │   ├── types.ts              — ClaireHandler, RouterEntry, ValidationRule, ValidationSchema
│   │   └── utils.ts              — internal (matchRoute, banner, error box, colorMethod)
│   ├── middleware/
│   │   ├── logger.ts             — ClaireLogger (auto-registered)
│   │   ├── cors.ts               — ClaireCors
│   │   └── jwt.ts                — ClaireJWT
│   ├── utils/util.ts             — ClaireUtil (public static helpers)
│   ├── plugin/claire-loader.ts   — Bun.plugin for .claire files
│   └── index.ts                  — barrel export
└── packages/
    ├── typescript-plugin/        → @clairex/typescript-plugin
    ├── vscode-extension/         → clairex-vscode (.vsix)
    └── create-clairex/           → create-clairex (scaffolding CLI)
```

---

## Published Packages

| Package | Scope | Purpose |
|---------|-------|---------|
| `@clairex/core` | scoped | The framework |
| `@clairex/typescript-plugin` | scoped | Resolves `.claire` imports in the editor |
| `clairex-vscode` | `.vsix` | Zero-config `.claire` editing support |
| `create-clairex` | unscoped | `bun create clairex my-app` |

`@clairex/core` exposes two entry points:

```json
"exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./plugin": "./dist/plugin/claire-loader.js"
}
```

---

## Technology Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode, `noImplicitAny`, `noImplicitOverride`, `noUncheckedIndexedAccess`)
- **Server:** Bun.serve
- **Dependencies:** Zero runtime dependencies
- **Build:** `bun build` for the bundle, `tsc` for declarations

---

## Resolved Problems

All problems identified during design have been solved:

| # | Problem | Resolution |
|---|---------|-----------|
| 1 | `c.request.json()` returns `unknown` | ClaireValidator proves the shape at runtime; `valid<T>()` / `patched<T>()` deliver typed data |
| 2 | Params assigned publicly after context creation | Context created after route matching, params passed at construction; `_params` private with getter only |
| 3 | Middleware was global only | Three levels: global, key, route — onion model at each |
| 4 | No global error handling | try/catch in `fetch` + ClaireException |
| 5 | `.claire` imports unresolved in the editor | `@clairex/typescript-plugin` patches module resolution |
| 6 | Silent field erasure on PATCH | `patched<T>()` returns `Partial<T>`; unsafe assignment no longer compiles |

---

## Planned (Post-Hackathon)

- Rules 3 and 4 for the `.claire` loader (validator usage, explicit parameter types)
- Rule 5 candidate: `c.valid<T>()` on a PATCH route rejected at load time
- Editor diagnostics — surface `.claire` rule violations as inline squiggles rather than load-time only
- `.claire` support in Material Icon Theme upstream (custom icon rather than a recoloured clone)
- Nested objects, arrays, enums, and custom refinements in ClaireValidator
- Error accumulation in ClaireValidator (currently fails on the first error)
- Pre-built exception subclasses and additional middlewares
- ClaireORM — class-based, explicitly-typed database layer (separate project)
