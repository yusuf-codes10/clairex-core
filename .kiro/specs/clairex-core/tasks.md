# ClaireX-core Implementation Tasks

## Completed Tasks

These tasks were completed during the first development session.

---

### Task 1: Project Scaffolding ✅
**Commits:** `291410f`, `75dbdf9`, `9f3bdab`, `ce60e09`

**What was done:**
- Initialized Bun project with `bun init`
- Configured `tsconfig.json` with strict mode, `noImplicitOverride`, `noUncheckedIndexedAccess`
- Created `src/core/` directory for all framework internals
- Created `example/` directory for testing ClaireX during development
- Set up barrel export in `src/index.ts`
- Configured `package.json` with build and dev scripts

**Structure:**
```
src/
├── core/
│   ├── clairex.ts
│   ├── context.ts
│   ├── request.ts
│   ├── response.ts
│   ├── router.ts
│   └── utils.ts
├── index.ts
example/
└── index.ts
```

---

### Task 2: ClaireRouter — Route Registration ✅
**Commits:** `4cb853d`, `b0154db`, `df40449`, `d4b615b`, `d2be30a`, `a208192`

**What was done:**
- Defined `RouterEntry` type with `method`, `pattern`, and `handler` fields
- Implemented `ClaireRouter` class with `protected routes: RouterEntry[]`
- Implemented private `register()` method that pushes route entries to the array
- Implemented all HTTP method helpers: `get()`, `post()`, `put()`, `patch()`, `delete()`
- Each method delegates to `register()` with the correct HTTP verb
- Fixed copy-paste typos in method registration

**Design decisions:**
- Routes stored as a flat array (simple iteration for matching)
- `routes` is `protected` so `ClaireX` can access it via inheritance
- `register()` is `private` — only the HTTP method helpers are the public API
- User-facing `path` is stored as `pattern` internally (framework terminology vs user terminology)

---

### Task 3: ClaireX Core — Bun.serve Integration ✅
**Commits:** `75dbdf9`, `8e98706`, `235e08e`, `339e998`, `0e9032b`, `651f513`

**What was done:**
- `ClaireX` extends `ClaireRouter` (inherits route registration + routes array)
- Constructor accepts optional `port` (defaults to 3000)
- `listen()` starts `Bun.serve()` with the configured port
- `fetch` handler loops through `this.routes` to find a match
- Match checks: method equality AND pathname equality
- Passes `ClaireContext` to the matched handler
- Logs startup message to console

**Design decisions:**
- Port on constructor (not on `listen()`) — all server config goes in one place for future extensibility
- `ClaireX extends ClaireRouter` — the app IS the router (no separate router instance to wire up)
- Match is a simple for-loop with `continue` for non-matches (clear, readable)

---

### Task 4: ClaireRequest — Request Wrapper ✅
**Commits:** `ffc462f`, `3f647df`, `e2c2d30`, `b8af61e`, `f807b73`

**What was done:**
- Wraps native Bun `Request` in a class
- Stores `raw` (private), `params` (public, `Record<string, string>`)
- Implements `async json()` and `async text()` for body parsing (delegates to `raw`)
- Implements getters: `method`, `url`, `pathname` (backing field pattern with `_` prefix)
- Constructor accepts `Request` + optional `params` object

**Design decisions:**
- Backing field pattern (`private _method` + `get method()`) for encapsulation
- Body methods are async (stream-based, one-shot read)
- `params` is public for now (will be typed later)
- `pathname` getter provides clean access without exposing the full URL object

---

### Task 5: ClaireResponse — Response Builder ✅
**Commits:** `e75bf6a`, `c682519`

**What was done:**
- Class with default `status: number = 200`
- Implemented `json(data, status?)` method that returns a native `Response`
- Sets `Content-Type: application/json` header
- Uses `JSON.stringify()` for serialization

**Design decisions:**
- Response methods live on their own class (not on context directly) — separation of concerns
- Returns native `Response` objects (Bun.serve expects this)
- Status can be overridden per-response method call

---

### Task 6: ClaireContext — Composition of Request + Response ✅
**Commits:** `c5e3c5c`, `e391118`

**What was done:**
- `ClaireContext` holds `ClaireRequest` + `ClaireResponse` as public properties
- Constructor takes native `Request`, creates `ClaireRequest` and `ClaireResponse` internally
- One context instance per incoming request

**Design decisions:**
- Composition over inheritance — context doesn't extend request or response
- Unlike Express (separate `req`, `res` args) or Hono (methods on context itself), ClaireX gives `ctx.request` and `ctx.response` as distinct objects
- Response is "something you build" — instantiated fresh, not handed to you pre-filled

---

### Task 7: Integration Test — Basic GET Endpoint ✅
**Commits:** `0891561`

**What was done:**
- Example app at `example/index.ts`
- Creates a ClaireX instance on port 3456
- Registers a GET `/` route that returns JSON array of users
- Handler receives `ClaireContext`, uses `c.response.json()` to respond
- Verified working — server starts, returns correct JSON

---

## Remaining Tasks

These tasks represent the next features to implement.

---

### Task 8: ClaireRequest — Query String Parsing
**Relates to:** US-3 (Typed Request Context)  
**Dependencies:** Task 4

**What to do:**
- Add a `query` getter to ClaireRequest that parses `URLSearchParams` into an object
- Expose parsed query as `Record<string, string>` (or typed later)

**Done when:** `ctx.request.query` returns parsed query params from the URL.

---

### Task 9: ClaireRouter — Dynamic Path Parameters (`:id`)
**Relates to:** US-2 (Class-Based Routing)  
**Dependencies:** Task 2

**What to do:**
- Implement pattern matching for `:param` segments in route patterns
- Split path and pattern by `/`, compare segment by segment
- Extract param values from matching segments
- Pass extracted params into ClaireContext/ClaireRequest

**Done when:** A route like `/users/:id` matches `/users/123` and `ctx.request.params.id === "123"`.

---

### Task 10: ClaireResponse — Additional Methods
**Relates to:** US-7 (Response Builder)  
**Dependencies:** Task 5

**What to do:**
- Implement `text(data, status?)` — returns plain text response
- Implement `html(data, status?)` — returns HTML response
- Implement `redirect(url, status?)` — returns redirect response
- Implement `status(code)` for chainable status setting
- Implement `stream(readable)` — returns streaming response

**Done when:** All response methods return correct `Response` objects with appropriate headers.

---

### Task 11: ClaireException — Typed Error Classes
**Relates to:** US-8 (Typed Error Handling)  
**Dependencies:** Task 1

**What to do:**
- Implement base `ClaireException` class extending `Error`
- Add `statusCode`, `message`, and optional `metadata`
- Create pre-built exceptions: `NotFoundException`, `ValidationException`, `UnauthorizedException`, `InternalException`
- Add global exception handling in ClaireX's `fetch` (catch unhandled errors, return structured JSON)

**Done when:** Throwing a `ClaireException` in a handler results in a structured JSON error response.

---

### Task 12: ClaireX — 404 Fallback
**Relates to:** US-8 (Typed Error Handling)  
**Dependencies:** Task 11

**What to do:**
- If no route matches after the for-loop, return a 404 response
- Use `ClaireException` or a default JSON error response

**Done when:** Hitting an unregistered path returns a proper 404 JSON response.

---

### Task 13: ClaireValidator — Built-in Validation
**Relates to:** US-4 (Built-in Validation)  
**Dependencies:** Task 11 (needs ClaireException for validation errors)

**What to do:**
- Define `ValidationRule` interface (type, required, min, max, pattern, custom)
- Implement abstract `ClaireValidator<T>` class with `validate()` and `rules()` methods
- Validation errors throw `ValidationException` with structured details
- Integrate with route handlers (validate body/params/query before handler runs)

**Done when:** Can define a validator class, attach it to a route, and invalid data is rejected with structured errors.

---

### Task 14: ClaireMiddleware — Onion Model
**Relates to:** US-5 (Middleware)  
**Dependencies:** Task 6 (needs ClaireContext)

**What to do:**
- Implement abstract `ClaireMiddleware` class with `before()` and `after()` methods
- Implement `MiddlewareChain` that runs before hooks outside-in, after hooks inside-out
- Support global middleware via `app.use(middleware)`
- Support short-circuit in `before()` (return early response)

**Done when:** Middleware executes in correct onion order around route handlers.

---

### Task 15: RouterGroup — Prefix + Scoped Middleware
**Relates to:** US-9 (Route Groups)  
**Dependencies:** Task 14, Task 9

**What to do:**
- Implement `RouterGroup` class with prefix and scoped middleware
- HTTP method handlers prepend the group prefix to paths
- Groups can be nested (prefixes concatenate)
- Scoped middleware only runs for routes in that group

**Done when:** Can group routes under `/api/v1/` with shared middleware that doesn't affect other routes.

---

### Task 16: Plugin System — IPlugin Interface
**Relates to:** US-10 (Plugin System)  
**Dependencies:** Task 3

**What to do:**
- Define `IPlugin` interface with `name` and `register(app)`
- Implement plugin registration on ClaireX via `app.use(plugin)`
- Plugins receive the app instance and can register routes, middleware, etc.

**Done when:** Can create and register a plugin that adds routes to the app.

---

### Task 17: Typed Handler Enforcement
**Relates to:** US-6 (Typed Handler Signatures)  
**Dependencies:** Task 13 (needs validator for type connection)

**What to do:**
- Replace `Function` type on RouterEntry with a generic `ClaireHandler<TParams, TQuery, TBody>` type
- Enforce that all type parameters must be explicitly declared (no defaults)
- Connect handler types with validator types (validator output = handler input types)

**Done when:** TypeScript errors if a developer defines a handler without explicit type parameters.

---

### Task 18: Documentation & Hackathon Submission
**Relates to:** Hackathon requirements  
**Dependencies:** All previous tasks

**What to do:**
- Write comprehensive README.md (problem, install, quick start, API docs, "Built with Kiro" section)
- Ensure `.kiro/specs/` is committed and up-to-date
- Verify: `bun install` → `bun run example/index.ts` works cleanly
- Create demo video showing ClaireX in action + Kiro spec-driven process

**Done when:** A judge can clone, install, run, and understand the project from the README alone.

---

## Summary

| # | Task | Status |
|---|------|--------|
| 1 | Project Scaffolding | ✅ Done |
| 2 | ClaireRouter — Route Registration | ✅ Done |
| 3 | ClaireX Core — Bun.serve | ✅ Done |
| 4 | ClaireRequest — Request Wrapper | ✅ Done |
| 5 | ClaireResponse — json() | ✅ Done |
| 6 | ClaireContext — Composition | ✅ Done |
| 7 | Integration Test — Basic GET | ✅ Done |
| 8 | ClaireRequest — Query Parsing | ⬜ Next |
| 9 | ClaireRouter — Dynamic Params | ⬜ Next |
| 10 | ClaireResponse — More Methods | ⬜ Pending |
| 11 | ClaireException — Error Classes | ⬜ Pending |
| 12 | ClaireX — 404 Fallback | ⬜ Pending |
| 13 | ClaireValidator — Validation | ⬜ Pending |
| 14 | ClaireMiddleware — Onion Model | ⬜ Pending |
| 15 | RouterGroup — Prefixes | ⬜ Pending |
| 16 | Plugin System | ⬜ Pending |
| 17 | Typed Handler Enforcement | ⬜ Pending |
| 18 | Documentation & Submission | ⬜ Final |
