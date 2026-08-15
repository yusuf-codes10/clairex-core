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
    │ .valid<T>()  │─── validated body access
    └──────────────┘

─── Validation ─────────────────────────────────────

    ┌──────────────────┐
    │ ClaireValidator  │ extends ClaireMiddleware
    │ abstract rules() │ → ValidationSchema
    │ before(): validates body, stores on context
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

    register() {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser, [new UserValidator()]);
        this.routes('get', '/:id', this.getUserById);
    }

    private getUsers(c: ClaireContext) { ... }
    private createUser(c: ClaireContext) { ... }
    private getUserById(c: ClaireContext) { ... }
}
```

---

## ClaireX — The Application (3 Methods)

ClaireX is the orchestrator. It does not define routes. It does not handle requests directly. It:

1. **Unlocks** keys (registers their routes)
2. **Uses** global middleware
3. **Listens** (starts the server)

```typescript
const app = new ClaireX(3000)
    .unlock(new UserKey())
    .unlock(new PostKey())
    .use(new CorsMiddleware())
    .listen();
```

Internally, ClaireX owns:
- `_router: ClaireRouter` — stores all routes from unlocked keys
- `_middlewareChain: ClaireMiddleware[]` — global middleware stack
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

## ClaireValidator — Validation as Middleware

ClaireValidator extends ClaireMiddleware. It IS the validation mechanism:

```
Request → Validator.before() → checks body against rules() → 
    if invalid: returns ClaireException(400).toResponse() (short-circuit)
    if valid: stores body on context → handler runs → c.valid<T>()
```

**User workflow:**
1. Define your type: `type User = { id: number, name: string, age: number }`
2. Extend ClaireValidator with `rules()`
3. Attach as route-level middleware
4. Read typed data: `c.valid<User>()`

No Zod. No external deps. ClaireX validates at runtime, TypeScript types at compile time. Two explicit declarations for two different purposes.

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
new ClaireContext(req)
├── new ClaireRequest(req)
└── new ClaireResponse()
    │
    ▼
Route Matching Loop (linear scan)
├── method mismatch? → continue
├── matchRoute(pattern, pathname) → null? → continue
└── MATCH → set params
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

- **Startup:** Purple ASCII art banner with framework info
- **Requests:** Color-coded HTTP methods (GET=green, POST=blue, PUT=yellow, PATCH=purple, DELETE=red)
- **Duration:** Request timing via ClaireLogger (`before` + `after`)
- **Errors:** Styled red error boxes with optional yellow hints

ClaireLogger is auto-registered as the first global middleware — zero config logging by default.

---

## File Structure

```
src/
├── core/
│   ├── clairex.ts       — ClaireX (application orchestrator)
│   ├── key.ts           — ClaireKey (abstract, self-contained resource unit)
│   ├── context.ts       — ClaireContext (composition: request + response + validated body)
│   ├── request.ts       — ClaireRequest (wraps native Request)
│   ├── response.ts      — ClaireResponse (response builder: json, text, html, redirect)
│   ├── router.ts        — ClaireRouter (route storage + HTTP method helpers)
│   ├── middleware.ts    — ClaireMiddleware (abstract: before/after)
│   ├── validator.ts     — ClaireValidator (extends middleware: rules + validation engine)
│   ├── exception.ts     — ClaireException (typed errors + toResponse)
│   ├── types.ts         — Shared types (ClaireHandler, RouterEntry, ValidationRule, ValidationSchema)
│   └── utils.ts         — Utilities (matchRoute, clairexBanner, logClaireException, colorMethod)
├── middleware/
│   └── ClaireLogger.ts  — Built-in logger (auto-registered)
└── index.ts             — Barrel export
```

---

## Technology Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode, `noImplicitAny`, `noImplicitOverride`, `noUncheckedIndexedAccess`)
- **Server:** Bun.serve
- **Dependencies:** Zero runtime dependencies
- **Build:** Not required for development (Bun runs TS natively)

---

## Open Problem

### Params Encapsulation
`context.request.params = params` is assigned publicly in ClaireX's fetch handler after context creation. Breaks the backing field pattern. To be resolved in a future refactor.

---

## Planned (Post-Core)

- Pre-built exception subclasses (`/src/exceptions/`)
- Pre-built middlewares (CORS, JWT) (`/src/middleware/`)
- Bun.plugin `.claire` file extension — compiler-level type enforcement (experimental)
- ClaireORM — class-based, explicitly-typed database layer (separate project)
