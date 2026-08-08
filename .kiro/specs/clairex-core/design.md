# ClaireX-core Design

## Architecture Overview

ClaireX-core follows a class-based, OOP architecture where each component is a class that can be instantiated, extended, and overridden. The framework is built on top of Bun.serve and enforces explicit typing at every boundary. The core design philosophy: **types and validation live together, not scattered across files.**

```
┌─────────────────────────────────────────────────┐
│              ClaireX extends ClaireRouter        │
│         listen() · use() · server()             │
│    Bun.serve Adapter · Route Match Loop         │
└──────────────────────┬──────────────────────────┘
                       │
              ┌────────▼────────┐
              │   ClaireRouter  │
              │ get/post/put/   │
              │ delete/patch    │
              │ routes: []      │
              │ register()      │
              └───┬─────────┬───┘
                  │         │
     ┌────────────▼──┐  ┌──▼───────────────┐
     │ ClaireContext  │  │ ClaireMiddleware │
     │ .request       │  │ MiddlewareChain  │
     │ .response      │  │ before/after     │
     │ (composition)  │  │ onion model      │
     └───┬───────┬────┘  └──────────────────┘
         │       │
         ▼       ▼
┌──────────────┐ ┌──────────────┐
│ClaireRequest │ │ClaireResponse│
│wraps Request │ │houses response│
│params/query/ │ │methods: json │
│body/method/  │ │text/html/    │
│pathname      │ │redirect/stream│
└──────────────┘ └──────────────┘
             │
   ┌─────────┼──────────────┬──────────────────┐
   │         │              │                  │
   ▼         ▼              ▼                  ▼
┌────────┐ ┌───────────┐ ┌───────────────┐ ┌──────────┐
│Claire  │ │Claire     │ │Claire         │ │Router    │
│Handler │ │Validator  │ │Exception      │ │Group     │
│typed fn│ │body/params│ │typed error    │ │prefix +  │
│signature│ │query      │ │classes        │ │scoped mw │
└────────┘ └───────────┘ └───────────────┘ └──────────┘
                                              │
                                         ┌────▼─────┐
                                         │  Plugin  │
                                         │ IPlugin  │
                                         │register()│
                                         └──────────┘
```

---

## Core Classes & Responsibilities (As Implemented)

### 1. ClaireX (Core Entry Point) — `src/core/clairex.ts`

**Responsibility:** Application bootstrap, server lifecycle. Inherits route registration from ClaireRouter.

```typescript
class ClaireX extends ClaireRouter {
  private port: number;

  constructor(port?: number);   // Defaults to 3000
  listen(): void;               // Starts Bun.serve, no args — config is on constructor
}
```

**Design Decisions:**
- **Extends ClaireRouter** (inheritance) — the app IS the router. No separate router to wire up. `app.get()`, `app.post()` etc. are available directly.
- **Port on constructor, not on `listen()`** — all server config in one place. Future settings (cors, etc.) will also go on the constructor.
- `listen()` is a no-argument method — it just launches with the pre-configured settings.
- `fetch` handler: creates a `ClaireContext` per request, loops through `this.routes`, matches by method + pathname, calls the handler with context.

---

### 2. ClaireRouter — `src/core/router.ts`

**Responsibility:** Route registration and HTTP method helpers. Stores routes as an array.

```typescript
type RouterEntry = {
  method: string;
  pattern: string;    // "pattern" internally, "path" from user's perspective
  handler: Function;
};

class ClaireRouter {
  protected routes: RouterEntry[] = [];

  private register(method: string, path: string, handler: Function): void;
  get(path: string, handler: Function): void;
  post(path: string, handler: Function): void;
  put(path: string, handler: Function): void;
  patch(path: string, handler: Function): void;
  delete(path: string, handler: Function): void;
}
```

**Design Decisions:**
- Routes stored as a **flat array** — simple, iterable, predictable.
- `routes` is `protected` — ClaireX inherits and accesses it for the match loop.
- `register()` is **private** — only HTTP method helpers are the public API.
- Naming distinction: user calls it a "path", framework stores it as "pattern" (internal language vs user language).
- `handler` is `Function` for now — will be replaced with typed `ClaireHandler<T>` later.

---

### 3. ClaireContext — `src/core/context.ts`

**Responsibility:** Composes ClaireRequest + ClaireResponse. One instance per incoming request. Passed to the user's handler.

```typescript
class ClaireContext {
  public request: ClaireRequest;
  public response: ClaireResponse;

  constructor(req: Request);
}
```

**Design Decisions:**
- **Composition, not inheritance** — context doesn't extend Request or Response. It holds them.
- Unlike **Express** (`req, res` as separate args — weird because you're "given" a response before knowing what to respond with).
- Unlike **Hono** (response methods sit directly on the context — mixes concerns).
- **ClaireX approach:** `ctx.request` for reading, `ctx.response` for building. Clear separation.
- Fresh ClaireResponse per request — "response is something you build, not something handed to you pre-filled."

---

### 4. ClaireRequest — `src/core/request.ts`

**Responsibility:** Wraps native Bun `Request`. Provides typed access to method, URL, pathname, params, and body parsing.

```typescript
class ClaireRequest {
  private raw: Request;
  public params: Record<string, string>;
  private _method: string;
  private _url: URL;

  constructor(req: Request, params?: Record<string, string>);

  async json(): Promise<unknown>;
  async text(): Promise<string>;

  get method(): string;
  get url(): URL;
  get pathname(): string;
}
```

**Design Decisions:**
- **Backing field pattern** — `private _method` + `get method()` for encapsulation. Follows the JS ecosystem convention (not Java-style `getMethod()`).
- Getters are **effectively readonly** — no setters defined, TypeScript prevents assignment.
- `json()` and `text()` delegate to native `Request` methods — async because body is a stream (one-shot read).
- `params` is public for now (will be typed generically later).
- `pathname` getter provides clean access without exposing the full URL object.

---

### 5. ClaireResponse — `src/core/response.ts`

**Responsibility:** Houses response-building methods. Returns native `Response` objects that Bun.serve expects.

```typescript
class ClaireResponse {
  private status: number;

  constructor(status?: number);   // Defaults to 200

  json(data: unknown, status?: number): Response;
}
```

**Design Decisions:**
- **Not a builder pattern** (yet) — methods directly return `Response` objects.
- Response methods live on their own class, NOT directly on ClaireContext — separation of concerns.
- Returns **native `Response`** — Bun.serve's `fetch` expects this, no custom wrapper.
- Status can be overridden per-method call (default 200).
- Future methods: `text()`, `html()`, `redirect()`, `stream()`.

---

### 6. ClaireHandler (Planned)

**Responsibility:** Typed function signature for route handlers. Replaces `Function` type.

```typescript
// Current (working, untyped):
type Handler = (ctx: ClaireContext) => Response | Promise<Response>;

// Future (enforced explicit types):
type ClaireHandler<TParams, TQuery, TBody = never> = (
  ctx: ClaireContext<TParams, TQuery, TBody>
) => Response | Promise<Response>;
```

**Design Decisions:**
- All type parameters will be **required** — no implicit `any`, no defaults that hide missing types.
- Return type is always `Response | Promise<Response>` — explicit and predictable.
- This is the enforcement mechanism for ClaireX's "no inference" philosophy.

---

### 7. ClaireValidator (Planned)

**Responsibility:** Built-in validation for body, params, and query — no external libraries.

```typescript
abstract class ClaireValidator<T> {
  abstract validate(data: unknown): T;
  abstract rules(): ValidationRules<T>;
}
```

**Design Decisions:**
- Class-based — extend `ClaireValidator` and define `rules()` for your shape.
- Validation and type definition **colocated in the same class** — the core philosophy.
- `validate()` returns typed output or throws `ClaireException`.
- No Zod, no Yup, no Joi. Zero external dependencies.

---

### 8. ClaireException (Planned)

**Responsibility:** Typed error classes for predictable, structured error handling.

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

**Design Decisions:**
- Extends native `Error` — works with try/catch and stack traces.
- Global exception handler in ClaireX catches unhandled exceptions → structured JSON response.
- Metadata for attaching validation errors, debug info, etc.

---

### 9. ClaireMiddleware (Planned)

**Responsibility:** Request/response transformation via onion-model middleware chain.

```typescript
abstract class ClaireMiddleware {
  abstract before(ctx: ClaireContext): Promise<void> | void;
  abstract after(ctx: ClaireContext): Promise<void> | void;
}
```

**Design Decisions:**
- Abstract class — developers extend and override `before()` / `after()`.
- Onion model: before hooks outside-in, after hooks inside-out.
- Can short-circuit in `before()` (return early response to skip handler).

---

### 10. RouterGroup (Planned)

**Responsibility:** Group routes under a shared prefix with scoped middleware.

```typescript
class RouterGroup {
  private prefix: string;
  private middlewares: ClaireMiddleware[];

  use(middleware: ClaireMiddleware): void;
  get(path: string, handler: Function): void;
  // ... other HTTP methods
}
```

**Design Decisions:**
- Prefix prepended to all routes in the group.
- Scoped middleware only affects routes within that group.
- Nestable — group within a group, prefixes concatenate.

---

### 11. Plugin — IPlugin Interface (Planned)

**Responsibility:** Extensibility — modular features hook into the framework.

```typescript
interface IPlugin {
  name: string;
  register(app: ClaireX): void;
}
```

**Design Decisions:**
- Minimal interface — just `name` and `register()`.
- Plugins receive the app instance → can add routes, middleware, etc.
- Core stays lightweight; optional features are plugins.

---

## Request Lifecycle (Current Implementation)

```
Incoming HTTP Request (Bun.serve fetch callback)
       │
       ▼
  new ClaireContext(req)
  ├── new ClaireRequest(req)    → wraps native Request
  └── new ClaireResponse()      → fresh, default status 200
       │
       ▼
  for (const route of this.routes)
  ├── route.method !== ctx.request.method? → continue (skip)
  ├── route.pattern !== ctx.request.pathname? → continue (skip)
  └── MATCH → return route.handler(context)
       │
       ▼
  Handler executes (user code)
  └── return ctx.response.json(data)  → native Response returned to Bun
```

**Future lifecycle (with middleware + validation):**
```
Request → Context → Middleware (before) → Validate → Handler → Middleware (after) → Response
```

---

## Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| Explicit over implicit | All types must be declared — no inference, no `any` defaults |
| Classes over functions | Every component is a class that can be extended/overridden |
| Composition for context | ClaireContext holds ClaireRequest + ClaireResponse (not inheritance) |
| Inheritance for core | ClaireX extends ClaireRouter (the app IS the router) |
| Colocation | Types + validation will live in the same class (ClaireValidator) |
| Zero external deps | ClaireValidator replaces Zod/Yup/Joi entirely |
| Bun-native | Built on Bun.serve, uses Bun APIs, targets Bun runtime only |
| Override-friendly | OOP inheritance lets you customize any framework behavior |
| Backing field pattern | Private `_field` + public getter for encapsulation |
| Response as construction | You build responses, not receive pre-filled ones |

---

## Technology Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode, no implicit any, noImplicitOverride)
- **Server:** Bun.serve
- **Build:** Not required for development (Bun runs TS natively). Build step only for publishing.
- **Testing:** Manual via `example/` directory (Bun test runner for future unit tests)
- **Dependencies:** Zero runtime dependencies (framework is self-contained)
