# ClaireX-core Design

## Architecture Overview

ClaireX-core follows a class-based, OOP architecture where each component is a class that can be instantiated, extended, and overridden. The framework is built on top of Bun.serve and enforces explicit typing at every boundary. The core design philosophy: **types and validation live together, not scattered across files.**

### Two Usage Modes

ClaireX supports two approaches — users can choose based on project needs:

1. **Classic (Hono-like)** — inline routes on the app instance, quick prototyping and testing
2. **ClaireX-style** — class-based controllers, structured production apps

Both work because `ClaireX extends ClaireRouter` — method helpers AND `mount()` are available directly.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ClaireX extends ClaireRouter                      │
│              listen() · mount() · get/post/put/patch/delete         │
│                    Bun.serve Adapter · matchRoute                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼────────┐  ┌───▼────────┐  ┌───▼──────────────┐
     │   ClaireRouter   │  │ClaireContext│  │ ClaireController │
     │ _routes: []       │  │ .request   │  │ abstract class   │
     │ register() (priv) │  │ .response  │  │ prefix + register│
     │ get/post/put/etc  │  │(composition)│  │ routes() helper  │
     │ routes (getter)   │  └──┬──────┬──┘  │ mount() via router│
     │ mount(controller) │     │      │     └──────────────────┘
     └──────────────────┘     │      │
                              │      │
                    ┌─────────▼┐  ┌──▼───────────┐
                    │ClaireReq │  │ClaireResponse │
                    │wraps Req │  │json/text/html │
                    │params    │  │redirect       │
                    │query/ies │  │_status+getter │
                    │headers   │  └───────────────┘
                    │method    │
                    │pathname  │
                    └──────────┘
                         │
                    ┌────▼─────┐
                    │  utils   │
                    │matchRoute│
                    └──────────┘

─── Planned ────────────────────────────────────────────────────────────

     ┌──────────────────┐  ┌───────────────┐  ┌──────────────────────┐
     │ ClaireMiddleware │  │ClaireValidator │  │ ClaireException      │
     │ before() / after()│  │validate()+rules│  │ typed error classes  │
     │ onion model      │  │body/params/query│  │ 404/400/401/500      │
     └──────────────────┘  └───────────────┘  └──────────────────────┘

─── Experimental Branch ────────────────────────────────────────────────

     ┌──────────────────────────────────────────────────────────────┐
     │  .claire File Extension (Bun.plugin)                         │
     │  Compiler-level type enforcement · Custom loader/transpiler  │
     │  Forces explicit typing at the syntax level                  │
     └──────────────────────────────────────────────────────────────┘
```

---

## Core Classes & Responsibilities (As Implemented)

### 1. ClaireX (Core Entry Point) — `src/core/clairex.ts`

**Responsibility:** Application bootstrap, server lifecycle. Inherits route registration from ClaireRouter.

```typescript
class ClaireX extends ClaireRouter {
  private port: number;

  constructor(port?: number);   // Defaults to 3000
  listen(): void;               // Starts Bun.serve, no args
}
```

**Design Decisions:**
- **Extends ClaireRouter** (inheritance) — the app IS the router. `app.get()`, `app.post()`, `app.mount()` etc. are available directly.
- **Port on constructor, not on `listen()`** — all server config in one place.
- `listen()` is a no-argument method — launches with pre-configured settings.
- `fetch` handler: creates `ClaireContext` per request, loops `this.routes`, uses `matchRoute()` for dynamic path matching, calls handler with context.
- Supports both inline routes (classic) AND mounted controllers (ClaireX-style).

**Current lifecycle in `fetch`:**
```typescript
fetch: (req: Request) => {
  const context = new ClaireContext(req);
  for (const route of this.routes) {
    if (route.method !== context.request.method) continue;
    const params = matchRoute(route.pattern, context.request.pathname);
    if (params === null) continue;
    context.request.params = params;  // TODO: encapsulation issue
    return route.handler(context);
  }
}
```

---

### 2. ClaireRouter — `src/core/router.ts`

**Responsibility:** Route registration, HTTP method helpers, controller mounting.

```typescript
class ClaireRouter {
  protected _routes: RouterEntry[] = [];

  private register(method: string, path: string, handler: Function): void;
  get(path: string, handler: Function): void;
  post(path: string, handler: Function): void;
  put(path: string, handler: Function): void;
  patch(path: string, handler: Function): void;
  delete(path: string, handler: Function): void;
  get routes(): RouterEntry[];
  mount(controller: ClaireController): void;
}
```

**Design Decisions:**
- Routes stored as a **flat array** — simple, iterable, predictable.
- `_routes` is `protected` with a `routes` getter — ClaireX accesses via inheritance.
- `register()` is **private** — only HTTP method helpers are the public API.
- `mount()` spreads controller routes into `_routes` — controllers integrate seamlessly.
- Naming: user calls it "path", framework stores it as "pattern".

---

### 3. ClaireContext — `src/core/context.ts`

**Responsibility:** Composes ClaireRequest + ClaireResponse. One instance per incoming request.

```typescript
class ClaireContext {
  public request: ClaireRequest;
  public response: ClaireResponse;

  constructor(req: Request);
}
```

**Design Decisions:**
- **Composition, not inheritance** — context holds request + response, doesn't extend them.
- Unlike Express (`req, res` as separate args) or Hono (response methods on context).
- ClaireX approach: `ctx.request` for reading, `ctx.response` for building. Clear separation.
- Fresh ClaireResponse per request — "response is something you build."

---

### 4. ClaireRequest — `src/core/request.ts`

**Responsibility:** Wraps native Bun `Request`. Provides typed access to method, URL, pathname, params, query, headers, and body parsing.

```typescript
class ClaireRequest {
  private raw: Request;
  public params: Record<string, string>;   // TODO: encapsulate
  private _method: string;
  private _url: URL;

  constructor(req: Request, params?: Record<string, string>);

  async json(): Promise<unknown>;
  async text(): Promise<string>;

  get method(): string;
  get url(): URL;
  get pathname(): string;
  get query(): Record<string, string>;
  get queries(): Record<string, string[]>;
  get headers(): Record<string, string>;
}
```

**Design Decisions:**
- **Backing field pattern** — `private _field` + `get field()` for encapsulation.
- **Getters for derived state** — ClaireX style: getters = reading state (like Vue computed), methods = actions.
- `query` returns single-value (`Record<string, string>`), `queries` returns multi-value (`Record<string, string[]>`).
- `headers` returns all request headers as `Record<string, string>`.
- `json()` returns `Promise<unknown>` — intentionally. Runtime body shape is unknown without validation.
- `params` is **temporarily public** — pragmatic solution until ClaireMiddleware or constructor refactor seals it.

---

### 5. ClaireResponse — `src/core/response.ts`

**Responsibility:** Houses response-building methods. Returns native `Response` objects.

```typescript
class ClaireResponse {
  private _status: number;

  constructor(status?: number);   // Defaults to 200

  json(data: unknown, status?: number): Response;
  text(data: string, status?: number): Response;
  html(data: string, status?: number): Response;
  redirect(url: string, status?: 301 | 302): Response;

  get status(): number;
}
```

**Design Decisions:**
- `_status` private with getter — backing field pattern, encapsulated.
- All methods accept optional status override (defaults to 200, redirect defaults to 302).
- `redirect()` constrained to `301 | 302` union — explicit, no arbitrary codes.
- Returns native `Response` — Bun.serve expects this.

---

### 6. ClaireController — `src/core/controller.ts`

**Responsibility:** Abstract base class for class-based route controllers. Template method pattern.

```typescript
abstract class ClaireController {
  protected _router: ClaireRouter;
  protected prefix: string;

  constructor(prefix: string);

  protected abstract register(): void;
  protected routes(method: 'get'|'post'|'put'|'patch'|'delete', path: string, handler: Function): void;
  get router(): RouterEntry[];
}
```

**Design Decisions:**
- **Template method pattern** — base class calls `register()` in constructor, subclass implements it.
- `register()` called after prefix is set — guarantees routes exist at instantiation.
- `routes()` helper composes prefix + path, binds handler to `this` (preserves context for private methods).
- `router` getter exposes registered routes for `mount()` consumption.
- Method union type `'get'|'post'|'put'|'patch'|'delete'` — constrained, explicit.
- One controller per resource — natural organization, no fat route files.

**Usage pattern:**
```typescript
class UserController extends ClaireController {
    constructor() { super('/users'); }
    register() {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser);
    }
    private getUsers(c: ClaireContext) { return c.response.json(users); }
    private async createUser(c: ClaireContext) { /* ... */ }
}
app.mount(new UserController());
```

---

### 7. Types — `src/core/types.ts`

**Responsibility:** Shared type definitions to prevent circular imports.

```typescript
type RouterEntry = {
  method: string;
  pattern: string;
  handler: Function;
}
```

---

### 8. Utils — `src/core/utils.ts`

**Responsibility:** Pure utility functions used by the framework internals.

```typescript
const matchRoute = (route: string, path: string): Record<string, string> | null;
```

**Design Decisions:**
- `matchRoute` is a pure function, not a class — utilities don't need OOP overhead.
- Splits by `/`, filters empty segments (handles trailing/leading slashes).
- `:param` segments extract values, static segments must match exactly.
- Length mismatch = no match. Returns `null` or extracted params object.
- Defensive guard for `noUncheckedIndexedAccess`.

---

## Known Open Problems

### Problem 1: `params` Encapsulation

**Current state:** `params` is public on ClaireRequest because it's assigned *after* context creation in the `fetch` handler (match must happen before params are known).

**Root cause:** ClaireContext is created before routing, but params are only available after matching.

**Potential solutions:**
- ClaireMiddleware sets params internally (framework-level, not user-accessible)
- Refactor to create ClaireContext after matching (pass params at construction)
- Setter with restricted access

---

### Problem 2: Body Typing (`unknown` problem)

**Current state:** `c.request.json()` returns `Promise<unknown>`. TypeScript cannot know the shape of runtime data. Users must use type assertions (`as`) — which provide zero runtime safety.

**Root cause:** Compile-time types cannot guarantee runtime data shape. This is fundamentally a validation problem, not a typing problem.

**The real solution:** ClaireValidator — validates at runtime, provides typed output. The framework bridges the gap between `unknown` and `T`.

---

## Planned: ClaireMiddleware (Branch 1)

**Purpose:** Request/response transformation, onion-model middleware chain.

**Solves:**
- Params encapsulation (middleware can set params before handler receives context)
- Validation pipeline (validation middleware runs before handler)
- Cross-cutting concerns (auth, logging, CORS, etc.)

```typescript
abstract class ClaireMiddleware {
  abstract before(ctx: ClaireContext): Promise<void | Response> | void | Response;
  abstract after(ctx: ClaireContext, response: Response): Promise<Response> | Response;
}
```

**Expected behavior:**
- `before()` runs outside-in before the handler
- `after()` runs inside-out after the handler
- `before()` can short-circuit by returning a Response directly
- Global middleware via `app.use()`, scoped via controllers/groups

---

## Planned: .claire File Extension (Branch 2 — Experimental)

**Purpose:** Compiler-level enforcement of ClaireX's "explicit types" philosophy via a custom Bun plugin.

**Concept:**
- `.claire` files are a superset/subset of TypeScript
- Bun.plugin registers a custom loader that transpiles `.claire` → `.ts`
- The loader/compiler rejects code that doesn't meet ClaireX typing standards
- Forces explicit type annotations at the syntax level — not just linting, but compilation failure

**What it could enforce:**
- All handler params must have explicit types (no inference)
- Body access must go through a validator (no raw `.json()` in handlers)
- Controller methods must declare return types
- Route params must be typed explicitly

**Risk:** High complexity, uncertain timeline. Branched separately — if it doesn't work, roll back to main.

---

## Planned: ClaireException

**Purpose:** Typed error classes for structured error handling.

```typescript
class ClaireException extends Error {
  public readonly statusCode: number;
  public readonly message: string;
  public readonly metadata?: Record<string, unknown>;
}

// Pre-built:
class NotFoundException extends ClaireException { /* 404 */ }
class ValidationException extends ClaireException { /* 400 */ }
class UnauthorizedException extends ClaireException { /* 401 */ }
class InternalException extends ClaireException { /* 500 */ }
```

**Integrates with:**
- ClaireX `fetch` handler catches unhandled exceptions → structured JSON response
- ClaireValidator throws `ValidationException` on invalid data
- 404 fallback when no route matches

---

## Planned: ClaireValidator

**Purpose:** Built-in validation that bridges runtime data and compile-time types.

```typescript
abstract class ClaireValidator<T> {
  abstract rules(): ValidationRules<T>;
  validate(data: unknown): T;  // Returns typed T or throws ValidationException
}
```

**The core value proposition:** Validation and type definition colocated in the same class. No Zod, no Yup — ClaireX IS the validation layer.

---

## Request Lifecycle

### Current (Implemented):
```
Request (Bun.serve)
    │
    ▼
new ClaireContext(req)
├── new ClaireRequest(req)
└── new ClaireResponse()
    │
    ▼
for each route:
├── method mismatch? → continue
├── matchRoute(pattern, pathname) → null? → continue
├── MATCH → set params → handler(context) → Response
└── no match → undefined (TODO: 404)
```

### Future (With Middleware + Validation + Error Handling):
```
Request (Bun.serve)
    │
    ▼
Context Creation + Route Matching
    │
    ▼
Middleware Chain (before — outside-in)
    │
    ▼
Validation (body/params/query)
    │
    ▼
Handler (user code) → Response
    │
    ▼
Middleware Chain (after — inside-out)
    │
    ▼
Response → Bun
    │
    ╳ (any point)
    ▼
ClaireException caught → structured JSON error response
```

---

## Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| Explicit over implicit | All types must be declared — no inference, no `any` defaults |
| Classes over functions | Every component is a class (except pure utils) |
| Composition for context | ClaireContext holds ClaireRequest + ClaireResponse |
| Inheritance for core | ClaireX extends ClaireRouter |
| Template method for controllers | Abstract `register()` called in base constructor |
| Getters for derived state | Getters = reading (like Vue computed), methods = actions |
| Backing field pattern | Private `_field` + public getter for encapsulation |
| Colocation | Types + validation will live in the same class (ClaireValidator) |
| Zero external deps | No Zod/Yup/Joi — ClaireX IS the validation layer |
| Bun-native | Built on Bun.serve, targets Bun runtime only |
| Two usage modes | Classic inline routes OR class-based controllers |
| Response as construction | You build responses, not receive pre-filled ones |

---

## Technology Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode, `noImplicitAny`, `noImplicitOverride`, `noUncheckedIndexedAccess`)
- **Server:** Bun.serve
- **Build:** Not required for development (Bun runs TS natively). Build step only for publishing.
- **Testing:** Manual via `example/` directory (Bun test runner for future unit tests)
- **Dependencies:** Zero runtime dependencies (framework is self-contained)

---

## File Structure (Current)

```
src/
├── core/
│   ├── clairex.ts       — ClaireX class (app entry, extends ClaireRouter)
│   ├── context.ts       — ClaireContext (composition of request + response)
│   ├── controller.ts    — ClaireController (abstract base for class-based controllers)
│   ├── request.ts       — ClaireRequest (wraps native Request)
│   ├── response.ts      — ClaireResponse (response builder methods)
│   ├── router.ts        — ClaireRouter (route registration + mount)
│   ├── types.ts         — Shared types (RouterEntry)
│   └── utils.ts         — Utility functions (matchRoute)
├── index.ts             — Barrel export
example/
├── index.ts             — Classic inline route testing
└── users.controller.ts  — ClaireController usage example
```
