# ClaireX-core Requirements

## Problem Statement

TypeScript developers spend disproportionate time fighting type inference, configuring external validation libraries (Zod, Yup, etc.), and debugging complex generic chains. While mastery can mitigate these issues, the time cost remains high even for experienced developers. ClaireX solves this by providing a class-based, OOP-first framework where types are explicit, validation is built-in, and everything is instantiable and overridable.

## Vision

ClaireX is a Bun-native, class-based web framework that eliminates the need for external validation libraries and implicit type inference. Every type must be explicitly declared (Java-style). Validation is a first-class citizen embedded in the framework itself — not an afterthought configured via third-party schemas.

## Core Principles

1. **Type safety out of the box** — no need for Zod or external schema libraries
2. **No inference allowed** — types are something you explicitly specify, solving the TS inference debugging problem
3. **OOP-based design** — everything is a class, you instantiate it, you have access to override existing methods
4. **Bun-native** — built on Bun.serve with custom file extensions via Bun.plugin
5. **Never fail silently** — every misuse or missing-setup case throws immediately with a message naming the fix

---

## User Stories

### US-1: Core Server Setup ✅
**As a** developer
**I want to** create a ClaireX server with minimal boilerplate
**So that** I can start building routes immediately without complex configuration

**Acceptance Criteria:**
- Can instantiate a ClaireX class and call `listen()` to start the server
- Server uses Bun.serve under the hood
- Port is configured on the constructor — all server config in one place
- `use()` registers global middleware, `unlock()` mounts resources
- `use()` and `unlock()` return `this` for chaining

**Delivered:** ClaireX exposes exactly three methods — `unlock()`, `use()`, `listen()`. Routes are never defined on the app.

---

### US-2: Class-Based Routing ✅
**As a** developer
**I want to** define routes using a class-based structure with explicit HTTP method handlers
**So that** my route definitions are structured, typed, and overridable

**Acceptance Criteria:**
- Route registration provides `get()`, `post()`, `put()`, `patch()`, `delete()`
- Supports path parameters (e.g. `/users/:id`)
- Route definitions live on an instantiable, extendable class

**Delivered:** ClaireKey owns route registration via `this.routes(method, path, handler, middlewares?)`. ClaireRouter became internal — the app cannot define routes directly, forcing the ClaireKey pattern.

**Deviation from original plan:** wildcard routes were not implemented. Path parameters cover the intended use cases.

---

### US-3: Typed Request Context ✅
**As a** developer
**I want to** access request data (params, query, body) through a typed context object
**So that** I never have to manually parse or cast request data

**Acceptance Criteria:**
- ClaireContext wraps the native Request and Response
- Provides typed access to `params`, `query`, `queries`, `headers`, and validated body
- Types are explicitly declared by the developer, not inferred

**Delivered:** ClaireContext composes ClaireRequest + ClaireResponse. Body access is split by intent:
- `valid<T>()` → full validated body (POST/PUT)
- `patched<T>()` → partial validated body (PATCH), returns `Partial<T>`
- `auth<T>()` → decoded JWT payload

Each throws with a hint if the required middleware never ran, or if the wrong accessor was used for the request method.

---

### US-4: Built-in Validation ✅
**As a** developer
**I want to** validate request bodies without installing external libraries
**So that** my validation logic lives alongside my type definitions in the same class

**Acceptance Criteria:**
- ClaireValidator provides body validation with no external dependencies
- Validation rules are declared on the class level (not in a separate schema file)
- Validation errors produce structured, typed error responses
- No external dependencies (no Zod, Yup, Joi, etc.)
- **One validator per resource, not per action**
- Unknown fields are stripped before reaching the handler
- Fields can be marked immutable and rejected on update

**Delivered:** ClaireValidator extends ClaireMiddleware — validation *is* a middleware, running in `before()`. A single `rules()` schema serves every action; the framework adjusts enforcement based on the HTTP method (POST/PUT full, PATCH partial, bodyless methods skipped).

**Scope note:** validation covers the request **body** only. Params and query validation were in the original acceptance criteria but were not implemented — params arrive as strings from the URL and query validation was deferred. Not a blocker for the target use case.

**Not yet supported:** nested objects, arrays, enums, custom refinements, and error accumulation (fails on first error).

---

### US-5: Middleware (Onion Model) ✅
**As a** developer
**I want to** define middleware with before/after hooks using an onion model
**So that** I can compose request/response transformations cleanly

**Acceptance Criteria:**
- ClaireMiddleware supports a middleware chain
- Follows the onion model (before → handler → after in reverse)
- Middleware can be scoped globally or to specific groups

**Delivered:** three levels — global (`app.use()`), key-level (ClaireKey constructor), route-level (4th argument to `this.routes()`). Any `before()` returning a Response short-circuits everything below it. Explicit `before`/`after` methods were chosen over a `next()` callback: the framework controls flow, not the middleware.

---

### US-6: Typed Handler Signatures ⚠️ PARTIAL
**As a** developer
**I want to** define route handlers with fully typed function signatures
**So that** the compiler catches mismatches between my route definition and handler logic

**Acceptance Criteria:**
- ClaireHandler enforces typed function signatures for route handlers
- All parameter types, return types, and context types must be explicit
- Type errors are caught at compile time, not runtime

**Delivered:** `ClaireHandler` is a type alias — `(c: ClaireContext) => Response | Promise<Response>`. TypeScript enforces that every handler returns a Response.

**Outstanding:** it is not generic over params/query/body, so a handler cannot declare the shape it expects and have that checked against its validator. Whether `ClaireHandler` becomes a class remains an open decision (Task 39). Rule 2 of the `.claire` loader partially covers the intent by rejecting methods without explicit return types at load time.

---

### US-7: Response Builder ⚠️ PARTIAL
**As a** developer
**I want to** build responses using a typed builder
**So that** I never accidentally send malformed responses

**Acceptance Criteria:**
- ClaireResponse supports `json()`, `text()`, `html()`, `redirect()`
- Supports explicit status codes

**Delivered:** all four methods, each accepting an optional status. `redirect()` constrains status to `301 | 302`.

**Deviations:** `stream()` was not implemented. The original criteria described a *chainable* builder; the final design has each method return a native Response directly, which is simpler and matches what Bun.serve expects.

---

### US-8: Typed Error Handling ✅
**As a** developer
**I want to** throw and catch typed exceptions
**So that** my error handling is predictable and type-safe

**Acceptance Criteria:**
- ClaireException provides typed error classes
- Errors include status code, message, and optional metadata
- Framework catches unhandled exceptions and returns structured error responses

**Delivered:** one `ClaireException` class with `statusCode`, `content`, optional `metadata`, and `toResponse()`. A global try/catch in ClaireX's `fetch` handler converts thrown exceptions into structured JSON.

**Design decision:** pre-built subclasses (`NotFoundException` etc.) were deliberately scratched. Status codes are universal and developers know them — `throw new ClaireException(404, 'Not found')` is more explicit than a class name, and avoids subclass proliferation.

---

### US-9: Route Groups ✅
**As a** developer
**I want to** group routes under a shared prefix with scoped middleware
**So that** I can organize my API logically without repetition

**Acceptance Criteria:**
- Prefix-based grouping
- Middleware can be scoped to a group

**Delivered:** ClaireKey serves this role — no separate RouterGroup concept was needed. Prefix is passed to `super()`, scoped middleware alongside it.

**Deviation:** nested groups were in the original criteria and are not supported. A key cannot mount another key.

---

### US-10: Plugin System ✅ (REFRAMED)
**As a** developer
**I want to** extend ClaireX functionality via a plugin interface
**So that** the framework is modular and extensible

**Original criteria** described an `IPlugin` interface with a `register()` method.

**Delivered differently:** no `IPlugin` interface exists. ClaireKey already fills the plugin role — it is mountable, self-contained, self-registering, and owns its own middleware. Adding a second extension mechanism would have duplicated it for no gain.

The extension points that do exist:
- **ClaireKey** — mountable resource units
- **ClaireMiddleware** — extend and override `before()` / `after()`
- **ClaireValidator** — extend and override `rules()`
- **Bun.plugin** — the `.claire` file loader

---

### US-11: Custom File Extension (`.claire`) ✅
**As a** developer
**I want** a file extension that enforces ClaireX's rules
**So that** invalid code is rejected before it ever runs

**Acceptance Criteria:**
- `.claire` files are loaded through a Bun.plugin
- Every `.claire` file must export a class
- Every method with an access modifier must declare an explicit return type
- A violation stops the process — invalid code never runs
- Registered by the consumer via one line in `bunfig.toml`

**Delivered:** `@clairex/core/plugin` — a Bun.plugin with an `onLoad` hook filtering `.claire$`. Rules 1 and 2 enforced; Rules 3 (validator usage) and 4 (explicit parameter types) are stubbed for future work.

**Known limitation:** only files that are actually imported get validated. An orphan `.claire` file is never checked, because load-time validation only fires on load.

**Note:** this was originally listed as a non-goal for the hackathon. It was promoted to a core deliverable during development — it turned out to be the framework's most distinctive feature.

---

### US-12: Editor Support for `.claire` ✅
**As a** developer
**I want** `.claire` files to behave exactly like `.ts` files in my editor
**So that** using a custom extension costs me nothing in tooling

**Acceptance Criteria:**
- `.claire` imports resolve with full types — no `any`, no generated declaration files
- Full TypeScript language features inside `.claire` files (IntelliSense, hover, go-to-definition, rename, formatting)
- Visually distinguishable from `.ts` in the file explorer
- Zero manual configuration for the user

**Delivered:**
- `@clairex/typescript-plugin` — a TypeScript Language Service Plugin patching `resolveModuleNameLiterals` so `.claire` imports resolve as TypeScript
- `clairex-vscode` — ships the plugin plus `configurationDefaults` that hand `.claire` files to TypeScript and register a wine-coloured Material Icon Theme clone

**Rejected approaches:** a `declare module "*.claire"` wildcard (resolves to `any`, violates the explicit-typing principle) and auto-generated `.d.claire.ts` files (fragile, produces artifacts, goes stale).

**Outstanding:** editor diagnostics. ClaireX rule violations appear only at load time in the terminal, not as inline squiggles. The shared rules layer needed for this was prototyped and rolled back — deferred rather than shipped half-working.

---

### US-13: Project Scaffolding ✅
**As a** developer
**I want to** scaffold a working ClaireX project with one command
**So that** I do not have to assemble the configuration by hand

**Acceptance Criteria:**
- `bun create clairex my-app` produces a runnable project
- Generated project includes the `bunfig.toml` preload line, a strict `tsconfig.json`, and a working resource
- The example demonstrates the framework's distinctive features

**Delivered:** `create-clairex` — copies a template containing a `users` resource with a key, a validator, and a type. The template exercises `valid<T>()`, `patched<T>()`, and the `immutable` flag, and its `.claire` files pass the loader's own rules.

**Why this matters:** the missing `bunfig.toml` preload line produces the error *"Export named X not found"*, which gives no hint about the actual cause. Scaffolding removes the framework's sharpest onboarding edge.

---

## Non-Goals (for this hackathon scope)

- Template engine / view layer
- Database ORM integration (planned separately as ClaireORM)
- WebSocket support
- Production deployment tooling
- Params and query validation (body only)
- Nested route groups
- Response streaming
- Editor diagnostics for `.claire` rule violations (load-time enforcement only)

---

## Requirements Traceability

| Story | Status | Notes |
|-------|--------|-------|
| US-1 Core Server Setup | ✅ | Three methods, chainable |
| US-2 Class-Based Routing | ✅ | Via ClaireKey; no wildcards |
| US-3 Typed Request Context | ✅ | `valid<T>()`, `patched<T>()`, `auth<T>()` |
| US-4 Built-in Validation | ✅ | One validator per resource; body only |
| US-5 Middleware (Onion) | ✅ | Three levels |
| US-6 Typed Handler Signatures | ⚠️ | Type alias, not generic over body |
| US-7 Response Builder | ⚠️ | No `stream()`, not chainable |
| US-8 Typed Error Handling | ✅ | One class, no subclasses by design |
| US-9 Route Groups | ✅ | Via ClaireKey; no nesting |
| US-10 Plugin System | ✅ | Reframed — ClaireKey is the plugin |
| US-11 `.claire` Extension | ✅ | Rules 1–2 of 4 |
| US-12 Editor Support | ✅ | Resolution + full TS features; no diagnostics |
| US-13 Project Scaffolding | ✅ | `bun create clairex` |
