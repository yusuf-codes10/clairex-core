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

### Task 8: ClaireRequest — Query String Parsing ✅
**Commits:** `e498ebb`, `f5ad2fe`

**What was done:**
- Added `query` getter to ClaireRequest — wraps `this._url.searchParams` via `Object.fromEntries()`
- Returns `Record<string, string>` (single-value, last wins for duplicate keys)
- Added `queries` getter for multi-value support — iterates keys, uses `getAll()` per key
- Returns `Record<string, string[]>` (preserves all occurrences of repeated keys)

**Design decisions:**
- Both are getters (not methods) — ClaireX style: getters for derived state, methods for actions
- `query` for simple use cases, `queries` for when the consumer needs all values
- Same mental model as Vue computed properties — derived from URL, no side effects

---

### Task 9: ClaireResponse — Additional Methods ✅
**Commits:** `f2b5f3c`, `a908388`, `09c55ba`, `512fec4`

**What was done:**
- Implemented `text(data: string, status?: number): Response` — returns `text/plain` content type
- Implemented `html(data: string, status?: number): Response` — returns `text/html` content type
- Implemented `redirect(url: string, status?: 301 | 302): Response` — returns null body with `Location` header, defaults to 302
- Made `_status` private with a public getter (`get status(): number`) — backing field pattern
- All methods accept optional status parameter (defaults to 200, redirect defaults to 302)

**Design decisions:**
- Redirect status is constrained to `301 | 302` union type — explicit, no arbitrary codes
- Encapsulation enforced: consumers read status via getter, cannot mutate it externally
- Each method sets `_status` internally before constructing the Response

---

### Task 10: ClaireRequest — Encapsulation & Headers ✅
**Commits:** `ab309c0`, `aa61595`, `977fcab`

**What was done:**
- Made `params` private (`_params`) with a public getter — backing field pattern applied consistently
- Added `headers` getter — returns `Object.fromEntries(this.raw.headers)` as `Record<string, string>`
- Added `method` getter — exposes `_method` (was missing from initial implementation)

**Design decisions:**
- All fields on ClaireRequest now follow backing field pattern (`_field` + getter) — no public mutable fields
- `headers` returns all request headers (full network tab view), consumer decides what they need
- Single-value headers only (same as `query`) — multi-value variant can be added later if needed

---

### Task 11: Explicit Return Types — All Classes ✅
**Commits:** `f870f45`, `aa97d6a`, `61b92e5`

**What was done:**
- ClaireRequest: typed all getters and methods (`get url(): URL`, `get pathname(): string`, `get params(): Record<string, string>`, `get query(): Record<string, string>`, `get queries(): Record<string, string[]>`, `get headers(): Record<string, string>`, `get method(): string`, `async json(): Promise<unknown>`, `async text(): Promise<string>`)
- ClaireResponse: typed all methods with `: Response` return type, getter with `: number`
- ClaireRouter: typed all methods with `: void` (register, get, post, patch, put, delete)

**Design decisions:**
- ClaireX philosophy: explicit types only, no type inference — "like Java"
- If the framework enforces explicit typing for users, the framework itself must lead by example
- Rule of thumb: trace the return value back to its source to determine the type (field type, constructor type, or resolved promise type)

---

### Task 12: Integration Test — POST Endpoint & Body Parsing ✅
**Commits:** `b071ebb`

**What was done:**
- Added POST `/` route to example app that parses JSON body
- Uses `await c.request.json()` to read request body
- Pushes new user to in-memory array, returns updated list
- Verified working — POST requests correctly parse and respond with JSON

**Observations:**
- `json()` returns `Promise<unknown>` — destructuring/assigning to typed objects causes TS errors
- This is expected: TypeScript cannot know runtime body shape at compile time
- Temporary workaround: type assertion (`as`) at the call site
- Proper solution: `ClaireValidator` will bridge runtime validation with compile-time types

---

### Task 13: ClaireRouter — Dynamic Path Parameters (`:id`) ✅
**Commits:** `d0c10ce`, `3b3a5aa`, `29512e9`, `2e08e3c`

**What was done:**
- Implemented `matchRoute()` utility function in `src/core/utils.ts`
- Splits route pattern and request path by `/`, filters empty segments
- Length check: if segment counts differ, no match (returns `null`)
- Segment-by-segment comparison: `:param` segments extract values, static segments must match exactly
- Returns `Record<string, string>` of extracted params on match, `null` on no match
- Integrated into ClaireX's `fetch` handler — replaces simple pathname equality check
- Params assigned to `context.request.params` after match (currently via public setter — pragmatic solution)

**Design decisions:**
- `matchRoute` is a standalone utility (pure function, no class) — lives in `utils.ts`
- `filter(Boolean)` handles trailing/leading slashes gracefully
- Defensive guard for `noUncheckedIndexedAccess` — `if (!routePart || !pathPart) return null`
- Explicit return type: `Record<string, string> | null`
- Params setter is a temporary pragmatic solution — to be resolved with ClaireMiddleware or constructor refactor

**Known issue:**
- `params` is temporarily public on ClaireRequest to allow assignment after context creation
- Ideal solution: pass params at construction time or resolve via middleware layer

---

### Task 14: ClaireRouter — Routes Getter & Mount Method ✅
**Commits:** `2b7430c`, `d5d5e9f`

**What was done:**
- Added `get routes(): RouterEntry[]` getter on ClaireRouter — exposes `_routes` array (renamed from `routes` to `_routes`)
- Implemented `mount(controller: ClaireController): void` method on ClaireRouter
- Uses spread operator (`...controller.router`) to push individual entries, not the array itself
- `mount` lives on ClaireRouter (not ClaireX) so any router-level construct can mount controllers

**Design decisions:**
- `mount` on ClaireRouter rather than ClaireX — since ClaireX extends ClaireRouter, it inherits the method, and future RouterGroups could also mount controllers
- Spread operator required because `push()` expects individual items, not an array argument
- Getter for routes follows ClaireX style: derived state = getter

---

### Task 15: ClaireController — Class-Based Controllers ✅
**Commits:** `03917d4`, `7beb838`, `7278ccd`, `b5e2eb8`, `a7192f7`, `bd72924`, `5058b06`, `e0c4ac7`

**What was done:**
- Implemented abstract `ClaireController` class with `prefix` and internal `_router: ClaireRouter`
- `protected abstract register(): void` — contract: subclasses must define their routes
- `protected routes(method, path, handler): void` — helper that composes prefix + path and binds handler to `this`
- `get router(): RouterEntry[]` — exposes controller's registered routes for mounting
- `register()` called in base constructor after prefix is set — routes are ready at instantiation
- Extracted `RouterEntry` type into `src/core/types.ts` for reusability across modules
- Typed all methods and getters with explicit return types

**Design decisions:**
- Template method pattern: base class calls `register()`, subclass implements it
- `register()` called in constructor — guarantees routes exist the moment you `new` a controller
- `handler.bind(this)` in `routes()` — ensures handler methods have correct `this` context when called by the framework
- `routes()` method constrains HTTP method to union type `'get' | 'post' | 'put' | 'patch' | 'delete'`
- Prefix composition happens at registration time, not at match time — simpler, no runtime overhead
- Controller pattern: define routes + handlers in one class per resource — no fat route files, natural organization

**Usage example:**
```typescript
class UserController extends ClaireController {
    constructor() { super('/users'); }

    register() {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser);
    }

    private getUsers(c: ClaireContext) {
        return c.response.json(users);
    }

    private async createUser(c: ClaireContext) {
        const body = (await c.request.json()) as { name: string; age: number };
        users.push(body);
        return c.response.json(users);
    }
}

// Mount:
app.mount(new UserController());
```

---

### Task 16: Types Extraction ✅
**Commits:** `153c055`

**What was done:**
- Created `src/core/types.ts` for shared type definitions
- Moved `RouterEntry` type from `router.ts` to `types.ts`
- Updated imports in `ClaireRouter` and `ClaireController` to use shared types file

**Design decisions:**
- Separate types file prevents circular imports as classes reference each other's types
- Single source of truth for shared types across the framework

---

## Remaining Tasks

These tasks represent the next features to implement.

---

### Task 17: ClaireException — Typed Error Classes
**Relates to:** US-8 (Typed Error Handling)  
**Dependencies:** Task 1

**What to do:**
- Implement base `ClaireException` class extending `Error`
- Add `statusCode`, `message`, and optional `metadata`
- Create pre-built exceptions: `NotFoundException`, `ValidationException`, `UnauthorizedException`, `InternalException`
- Add global exception handling in ClaireX's `fetch` (catch unhandled errors, return structured JSON)

**Done when:** Throwing a `ClaireException` in a handler results in a structured JSON error response.

---

### Task 18: ClaireX — 404 Fallback
**Relates to:** US-8 (Typed Error Handling)  
**Dependencies:** Task 17

**What to do:**
- If no route matches after the for-loop, return a 404 response
- Use `ClaireException` or a default JSON error response

**Done when:** Hitting an unregistered path returns a proper 404 JSON response.

---

### Task 19: ClaireValidator — Built-in Validation
**Relates to:** US-4 (Built-in Validation)  
**Dependencies:** Task 17 (needs ClaireException for validation errors)

**What to do:**
- Define `ValidationRule` interface (type, required, min, max, pattern, custom)
- Implement abstract `ClaireValidator<T>` class with `validate()` and `rules()` methods
- Validation errors throw `ValidationException` with structured details
- Integrate with route handlers (validate body/params/query before handler runs)

**Done when:** Can define a validator class, attach it to a route, and invalid data is rejected with structured errors.

---

### Task 20: ClaireMiddleware — Onion Model
**Relates to:** US-5 (Middleware)  
**Dependencies:** Task 6 (needs ClaireContext)

**What to do:**
- Implement abstract `ClaireMiddleware` class with `before()` and `after()` methods
- Implement `MiddlewareChain` that runs before hooks outside-in, after hooks inside-out
- Support global middleware via `app.use(middleware)`
- Support short-circuit in `before()` (return early response)

**Done when:** Middleware executes in correct onion order around route handlers.

---

### Task 21: RouterGroup — Prefix + Scoped Middleware
**Relates to:** US-9 (Route Groups)  
**Dependencies:** Task 20, Task 13

**What to do:**
- Implement `RouterGroup` class with prefix and scoped middleware
- HTTP method handlers prepend the group prefix to paths
- Groups can be nested (prefixes concatenate)
- Scoped middleware only runs for routes in that group

**Done when:** Can group routes under `/api/v1/` with shared middleware that doesn't affect other routes.

---

### Task 22: Plugin System — IPlugin Interface
**Relates to:** US-10 (Plugin System)  
**Dependencies:** Task 3

**What to do:**
- Define `IPlugin` interface with `name` and `register(app)`
- Implement plugin registration on ClaireX via `app.use(plugin)`
- Plugins receive the app instance and can register routes, middleware, etc.

**Done when:** Can create and register a plugin that adds routes to the app.

---

### Task 23: Typed Handler Enforcement
**Relates to:** US-6 (Typed Handler Signatures)  
**Dependencies:** Task 19 (needs validator for type connection)

**What to do:**
- Replace `Function` type on RouterEntry with a generic `ClaireHandler<TParams, TQuery, TBody>` type
- Enforce that all type parameters must be explicitly declared (no defaults)
- Connect handler types with validator types (validator output = handler input types)

**Done when:** TypeScript errors if a developer defines a handler without explicit type parameters.

---

### Task 24: Documentation & Hackathon Submission
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
| 8 | ClaireRequest — Query Parsing | ✅ Done |
| 9 | ClaireResponse — Additional Methods | ✅ Done |
| 10 | ClaireRequest — Encapsulation & Headers | ✅ Done |
| 11 | Explicit Return Types — All Classes | ✅ Done |
| 12 | Integration Test — POST & Body Parsing | ✅ Done |
| 13 | ClaireRouter — Dynamic Params | ✅ Done |
| 14 | ClaireRouter — Routes Getter & Mount | ✅ Done |
| 15 | ClaireController — Class-Based Controllers | ✅ Done |
| 16 | Types Extraction | ✅ Done |
| 17 | ClaireException — Error Classes | ⬜ Next |
| 18 | ClaireX — 404 Fallback | ⬜ Pending |
| 19 | ClaireValidator — Validation | ⬜ Pending |
| 20 | ClaireMiddleware — Onion Model | ⬜ Pending |
| 21 | RouterGroup — Prefixes | ⬜ Pending |
| 22 | Plugin System | ⬜ Pending |
| 23 | Typed Handler Enforcement | ⬜ Pending |
| 24 | Documentation & Submission | ⬜ Final |
