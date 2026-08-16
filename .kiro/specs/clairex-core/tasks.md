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

### Task 17: ClaireHandler Type — Replacing `Function` ✅
**Commits:** `1645c29`, `7819245`, `ed85e22`

**What was done:**
- Introduced `ClaireHandler` type in `src/core/types.ts`: `(c: ClaireContext) => Response | Promise<Response>`
- Replaced generic `Function` type across all files:
  - `RouterEntry.handler` → `ClaireHandler`
  - `ClaireRouter` — all HTTP method helpers and private `register()` now accept `ClaireHandler`
  - `ClaireController.routes()` — handler parameter typed as `ClaireHandler`
- Explicit return type: handlers must return `Response` or `Promise<Response>` — no more `undefined` possible

**Design decisions:**
- `ClaireHandler` is a simple type alias (not generic yet) — will become `ClaireHandler<TParams, TQuery, TBody>` later when ClaireValidator exists
- Supports both sync and async handlers explicitly via union type
- Zero ambiguity: TypeScript now enforces that every handler returns a Response

---

### Task 18: ClaireMiddleware — Before/After Model ✅
**Commits:** `0b70a48`, `1aa1212`, `b6f3f77`, `786aaba`, `c313618`, `d44ba96`, `0187f6a`, `9202449`, `af70dff`, `175f70e`, `45a544d`, `024e4e3`, `c2fa515`

**What was done:**
- Implemented abstract `ClaireMiddleware` class in `src/core/middleware.ts`
- `before(ctx): void | Response | Promise<void | Response>` — default empty implementation
- `after(ctx, response): Response | Promise<Response>` — default returns response unchanged
- Middleware chain (`_middlewareChain: ClaireMiddleware[]`) lives on ClaireX
- `use(middleware: ClaireMiddleware): void` — pushes to the chain
- Execution in `fetch` handler:
  1. Before loop (in order) — `await` each, short-circuit if `instanceof Response`
  2. Handler call — `await route.handler(context)`
  3. After loop (reverse order) — onion model
- `fetch` is now `async` to support await on middlewares and handlers
- Short-circuit: if `before()` returns a `Response`, handler and after loop are skipped

**Design decisions:**
- Option B chosen (explicit before/after) over Option A (single handle + next) — fits ClaireX's "explicit over implicit" identity
- No `next()` function — framework controls the flow, not the middleware
- Both methods are `public` — ClaireX needs to call them from outside
- Both have default implementations — class is `abstract` to prevent direct instantiation, but users override only what they need
- After does NOT run on short-circuit — simpler mental model: "if before stops it, it's stopped"
- Async-safe: both methods support returning Promises

**Usage example:**
```typescript
class AuthGuard extends ClaireMiddleware {
    override before(c: ClaireContext) {
        const token = c.request.headers.authorization;
        if (!token) {
            return c.response.json({ msg: 'Unauthorized' }, 401);
        }
    }
}

class Logger extends ClaireMiddleware {
    override before(c: ClaireContext) {
        console.log(`${c.request.method} ${c.request.pathname}`);
    }
}

// Register (order matters):
app.use(new Logger());
app.use(new AuthGuard());
```

---

### Task 19: ClaireX — Basic 404 Fallback ✅
**Commits:** `2c100c2`

**What was done:**
- Added `return new Response('Not Found!', {status: 404})` at the end of the route matching loop
- If no route matches, Bun.serve now returns a proper 404 instead of `undefined`

**Design decisions:**
- Basic string response for now — will be replaced with structured JSON via ClaireException later
- Prevents Bun's "Expected a Response object, but received 'undefined'" error

---

### Task 20: Integration Test — Middleware ✅
**Commits:** `21f5aa1`, `3931fcd`

**What was done:**
- Created `logger` middleware — logs method and pathname on every request
- Created `tester` middleware — demonstrates short-circuit: returns JSON response for non-POST requests, logs headers for POST
- Tested multiple middlewares stacking in order
- Verified short-circuit: handler is never reached when `before()` returns a Response
- Verified middleware execution order matches `app.use()` registration order

**Observations:**
- Middleware is currently global only — applies to all routes
- Cannot scope middleware per controller or per route (open problem #3)

---

## Open Problems

These are known architectural issues that need solving in upcoming tasks.

---

### Problem 1: ClaireValidator — Body Typing (`unknown`) ✅ SOLVED
~~`c.request.json()` returns `Promise<unknown>`.~~ ClaireValidator validates at runtime, stores proven data on context. `c.body<T>()` delivers typed data backed by runtime validation. No external deps — ClaireX IS the validation layer.

### Problem 2: Params Encapsulation
`context.request.params = params` is assigned publicly in ClaireX's fetch handler after context creation. Breaks backing field pattern. Needs to be sealed — either via constructor refactor or middleware-level internal access.

### Problem 3: Scoped Middleware ✅ SOLVED
~~All middlewares registered via `app.use()` are global.~~ ClaireX now supports three levels of middleware: global (`app.use()`), controller-level (passed to constructor), and route-level (4th param in `this.routes()`). Execution follows onion model at all three layers.

### Problem 4: Global Error Handling ✅ SOLVED
~~No try/catch in `fetch` handler.~~ ClaireException + try/catch now handles all thrown errors globally. Intentional throws return their typed response, unknown errors return generic 500.

---

## Remaining Tasks

These tasks represent the next features to implement.

---

### Task 21: ClaireException — Typed Error Classes ✅
**Commits:** `c4f6143`, `3e946e9`, `1ef406d`, `d109424`, `8a72bdb`, `bce9dad`, `48dd9c0`, `76a5db9`, `097cd0f`, `373db26`, `3fb929d`, `61debe9`, `7f8b8a2`, `3d25214`

**What was done:**
- Implemented `ClaireException` class extending `Error` in `src/core/exception.ts`
- Fields: `_statusCode: number`, `_content: string`, `_metadata?: Record<string, string>`
- Backing field pattern with getters for all fields
- `this.name = 'ClaireException'` overrides default Error name
- `super(content)` passes message to Error for stack trace
- `toResponse(): Response` — serializes to JSON `{ exception: content }` with correct status code and `Content-Type: application/json`
- Global try/catch in ClaireX's `fetch` handler:
  - `if (e instanceof ClaireException) return e.toResponse()` — handles intentional throws
  - Falls back to `new ClaireException(500, 'Internal Server Error').toResponse()` for unknown errors
- Replaced basic 404 fallback with `new ClaireException(404, 'Route Not Found!').toResponse()`

**Design decisions:**
- `toResponse()` as a method — the exception knows how to serialize itself (OOP: object owns its behavior)
- Two usage patterns available to the user:
  - **`throw new ClaireException(404, 'Not found')`** — bubbles to catch block, framework handles it. Cleaner for bail-out scenarios.
  - **`return new ClaireException(404, 'Not found').toResponse()`** — explicit inline return, never hits catch. Handler stays in control.
- `ClaireHandler` type enforces `Response` return — if you forget `.toResponse()`, TypeScript flags it immediately
- Metadata is optional — available for future use (validation error details, debug info)
- Base class only for now — pre-built subclasses (`NotFoundException`, `ValidationException`, `UnauthorizedException`, `InternalException`) will live in `/src/exceptions/` later

**Usage example:**
```typescript
// Option 1: throw (bubbles to ClaireX catch block)
private getUserById(c: ClaireContext) {
    const { id } = c.request.params;
    const foundUser = users.find(u => u.id === Number(id));
    if (!foundUser) throw new ClaireException(404, 'User not Found!');
    return c.response.json(foundUser);
}

// Option 2: return + toResponse (inline, explicit)
private getUserById(c: ClaireContext) {
    const { id } = c.request.params;
    const foundUser = users.find(u => u.id === Number(id));
    if (!foundUser) return new ClaireException(404, 'User not Found!').toResponse();
    return c.response.json(foundUser);
}
```

**Planned (future):**
- Pre-built exception subclasses in `/src/exceptions/`:
  - `NotFoundException` (404)
  - `ValidationException` (400)
  - `UnauthorizedException` (401)
  - `InternalException` (500)
- Pre-built middlewares in `/src/middleware/` (Logger, etc.)

---

### Task 22: Scoped Middleware — Three-Level Middleware Architecture ✅
**Commits:** `9c8a9ec`, `8a1220d`, `154b063`, `d380034`, `538e749`, `74f6e46`, `68f31e1`, `e74884d`, `428108b`, `7cecddb`, `60b19b9`, `edc2e97`, `2949091`, `02def40`

**What was done:**
- ClaireController now owns its own middleware chain: `private _middlewareChain?: ClaireMiddleware[]`
- Controller-level middlewares passed via constructor: `super('/users', [new AuthGuard()])`
- Route-level middlewares as 4th param: `this.routes('get', '/:id', this.getUserById, [new Auth()])`
- `mount()` updated: maps routes with controller's middlewares via spread + tag (`route.middlewares`)
- `routes()` method pushes directly to `_router.routes` including `routeMiddlewares` field
- `RouterEntry` extended with two optional fields: `middlewares?` (controller) and `routeMiddlewares?` (route)
- ClaireX `fetch` handler executes all three layers in onion model order
- Tested all three levels simultaneously — verified execution order and short-circuit at each level

**ClaireX Middleware Philosophy — The Three-Level Onion Model:**

```
┌─────────────────────────────────────────────────────┐
│  GLOBAL (app.use)                                    │
│  ┌─────────────────────────────────────────────┐    │
│  │  CONTROLLER (super('/prefix', [middlewares])) │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │  ROUTE (this.routes(..., [mw]))      │    │    │
│  │  │  ┌─────────────────────────────┐    │    │    │
│  │  │  │        HANDLER              │    │    │    │
│  │  │  └─────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Execution order:**
1. Global before (in order)
2. Controller before (in order)
3. Route before (in order)
4. **Handler**
5. Route after (reverse)
6. Controller after (reverse)
7. Global after (reverse)

Short-circuit at any level skips everything below it — handler never runs.

**Performance note:** The nested loops are not O(n²) in any practical sense. Middleware chains are tiny (2–5 items typically). You're never going to have 10,000 middlewares. The clarity of three explicit levels far outweighs any theoretical loop overhead.

**Design decisions:**
- Controller owns its middlewares (self-contained unit: prefix + routes + middleware)
- `mount()` tags routes at mount time — preserves controller identity without refactoring the match loop
- `routes()` pushes route-level middlewares directly onto `RouterEntry` — no intermediary
- `if` guards skip undefined middleware arrays — most routes won't have all three levels, so the common path is fast
- No refactor to the flat route array — routes still live in one array, just carry more metadata
- Three separate fields on `RouterEntry` keeps the layers distinct and execution order explicit

**Usage example:**
```typescript
// Global middleware — runs on ALL routes
app.use(new Logger());

// Controller with scoped middleware — runs on all /users routes
export class UserController extends ClaireController {
    constructor() {
        super('/users', [new AuthGuard()]);  // controller-level
    }

    register() {
        this.routes('get', '/', this.getUsers);  // no extra middleware
        this.routes('get', '/:id', this.getUserById, [new RateLimiter()]);  // route-level
        this.routes('post', '/', this.createUser);
    }
}

// Result:
// GET /users       → Logger → AuthGuard → handler
// GET /users/:id   → Logger → AuthGuard → RateLimiter → handler
// POST /users      → Logger → AuthGuard → handler
```

---

### Task 23: Developer Experience — Terminal Polish ✅
**Commits:** `2430150`, `7d4a84f`, `0c41d27`, `d3ed0ac`, `e390ca7`, `c4e68fa`, `c4e354b`, `98146f8`, `e5c1f99`, `337062c`

**What was done:**
- Created `/src/middleware/ClaireLogger.ts` — first pre-built middleware, ships with the framework
- ClaireLogger uses `before()` + `after()` to measure request duration (`performance.now()`)
- Implemented `clairexBanner(port)` utility — retro ASCII art startup banner in purple with framework info
- Implemented `logClaireException(name, statusCode, content, hint?)` — styled red error box in terminal with optional yellow hint line (room for subclass-specific hints later)
- Implemented `colorMethod(method)` — colors HTTP methods (GET=green, POST=blue, PUT=yellow, PATCH=purple, DELETE=red)
- ClaireX constructor auto-registers `ClaireLogger` as the first global middleware — every app gets logging by default
- `listen()` now calls `clairexBanner(this.port)` instead of plain `console.log`
- ClaireException `toResponse()` calls `logClaireException()` to log errors in styled format

**Design decisions:**
- Terminal is part of the DX — not an afterthought. ClaireX has a visual identity in the console
- `ClaireLogger` lives in `/src/middleware/` (outside core) — framework ships it, but it's not core infrastructure
- Auto-registered in constructor — zero config, every ClaireX app logs by default
- `colorMethod` is a util (pure function) — ClaireLogger imports it, but any middleware can reuse it
- `logClaireException` accepts `name` param — ready for subclasses (`NotFoundException [404]`, etc.)
- Hint is optional — subclasses will provide their own default hints in the future
- Duration measured via `performance.now()` in before/after — safe for single-threaded JS

**ClaireLogger usage (auto-included, no setup needed):**
```typescript
// Output on every request:
// → GET http://localhost:2300/users
// ← GET http://localhost:2300/users 2.34ms
```

**Utilities in `src/core/utils.ts`:**
- `clairexBanner(port)` — startup ASCII art
- `logClaireException(name, statusCode, content, hint?)` — styled error box
- `colorMethod(method)` — colored HTTP method string
- `matchRoute(route, path)` — route matching (existing)

---

### Task 24: ClaireValidator — Abstract Class & Rules Engine ✅
**Commits:** `de0c141`, `1efa66b`, `21d0bda`, `1424bf1`, `6414e4d`, `ba2bba9`, `2c4b664`, `97b6b1b`, `24221a9`, `30abc4b`

**What was done:**
- Created `ClaireValidator` abstract class in `src/core/validator.ts`
- **Extends ClaireMiddleware** — validation IS a middleware, runs in `before()`
- Defined `ValidationRule` type: `{ type: 'string' | 'number' | 'boolean', required?, min?, max? }`
- Defined `ValidationSchema` type: `Record<string, ValidationRule>`
- Abstract `rules(): ValidationSchema` — contract: subclasses define their validation shape
- Extracted types into `src/core/types.ts` for reusability

**Why ClaireValidator extends ClaireMiddleware:**
- The checking mechanism IS the middleware — no separate validation step
- Runs automatically via the three-level onion model (route-level middleware)
- Short-circuits on failure — handler never runs if validation fails
- OOP inheritance: validator inherits the entire before/after lifecycle
- No new concept to learn — if you know middleware, you know validation

**Validation engine (in `before()`):**
1. Reads body: `(await c.request.json()) as Record<string, unknown>` — the ONE place `as` is acceptable (we're about to prove the shape)
2. Loops through `this.rules()` schema
3. For each field, checks: required → type → min → max
4. On failure: returns `ClaireException(400, ...)` response (short-circuit)
5. On success: stores validated body on ClaireContext

**Checks implemented:**
- **Required** — `value === undefined || value === null`
- **Type** — `typeof value !== rule.type`
- **Min** — string: `value.length < min`, number: `value < min`
- **Max** — string: `value.length > max`, number: `value > max`

---

### Task 25: ClaireContext — Validated Body Storage ✅
**Commits:** `067c042`, `388dd5c`, `ff95a11`

**What was done:**
- Added `private _valid: unknown = {}` field on ClaireContext
- Added setter: `set setBody(data: unknown)` — validator stores validated body
- Added generic method: `body<T>(): T` — handler reads typed data
- Cannot use `get` keyword with generics (TypeScript limitation) — hence `body<T>()` is a method
- Setter and getter have different names (`setBody` vs `body`) — avoids name collision

**Design decisions:**
- Validator writes, handler reads — clear separation
- `body<T>()` uses `as T` internally — but this is NOT "trust me bro" because the validator already ran and proved the shape at runtime
- The generic `<T>` is the developer's declaration of what was validated — backed by runtime proof
- `_valid` is `unknown` internally — only typed when accessed via `body<T>()`

---

### Task 26: ClaireValidator — Integration & Testing ✅
**Commits:** `1c9dd7d`, `1bc4d95`, `f5e7a7f`, `dcbf37a`, `2e312e7`, `96c76af`, `538c3b9`

**What was done:**
- Created example `userValidator` class extending ClaireValidator
- Attached as route-level middleware: `this.routes('post', '/', this.createUser, [new inner(), new userValidator()])`
- Handler uses `c.body<User>()` instead of `await c.request.json()`
- Tested all validation checks: required (missing fields), type (wrong types), min/max (bounds)
- Tested JSON parse error — caught by global try/catch → 500
- Tested valid data — passes through, handler receives typed body
- Users must annotate `rules()` return type with `ValidationSchema` (TypeScript widens string literals otherwise)

**User workflow (3 steps):**
1. Define your type: `type User = { id: number, name: string, age: number }`
2. Extend ClaireValidator with rules:
```typescript
// Recommended: create a validators/ folder
import { ClaireValidator } from "../../src/core/validator";
import type { ValidationSchema } from '../../src/core/types';

export class userValidator extends ClaireValidator {
    override rules(): ValidationSchema {
        return {
            id: { type: 'number', required: true, max: 200 },
            name: { type: 'string', required: true, min: 3 },
            age: { type: 'number', required: true }
        }
    }
}
```
3. Use in controller + read typed body:
```typescript
export class userController extends ClaireController {
    constructor() {
        super('/users', [new logger(), new middle()]);
    }

    register() {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser, [new inner(), new userValidator()]);
        this.routes('get', '/:id', this.getUserById);
    }

    private createUser(c: ClaireContext) {
        const body = c.body<User>();  // ← typed! no `as`, no `unknown`
        users.push(body);
        return c.response.json(users);
    }
}
```

**Problem 1: SOLVED ✅**
- `c.request.json()` returns `unknown` — that's intentional, runtime data has no compile-time type
- ClaireValidator validates at runtime, stores proven data on context
- `c.body<T>()` delivers typed data — backed by runtime validation, not blind assertion
- No Zod, no Yup, no external deps — ClaireX IS the validation layer

**What ClaireValidator doesn't handle yet (future expansion):**
- Nested objects (`{ address: { street: string } }`)
- Arrays (`{ tags: string[] }`)
- Enums (`{ role: 'admin' | 'user' }`)
- Custom refinements (regex, custom functions)
- Error accumulation (currently fails on first error)

---

### Task 28: Pre-built Exceptions — Subclasses
**Relates to:** Task 21  
**Dependencies:** Task 21 (base ClaireException)

**What to do:**
- Create `/src/exceptions/` folder
- Implement convenience subclasses: `NotFoundException` (404), `ValidationException` (400), `UnauthorizedException` (401), `InternalException` (500)
- Each subclass sets its status code in the constructor — user only provides message
- Each subclass provides its own default hint for `logClaireException()`

**Done when:** Users can `throw new NotFoundException('User not found')` without remembering status codes. Terminal shows subclass name and helpful hint.

---

### Task 28: Pre-built Middlewares — Beyond Logger
**Relates to:** Task 18  
**Dependencies:** Task 18 (ClaireMiddleware base)

**What to do:**
- Expand `/src/middleware/` folder
- Possibly: `ClaireCorst`, `ClaireRateLimiter`, or other common middlewares
- ClaireLogger already done (Task 23)

**Done when:** Framework ships with useful default middlewares out of the box.

---

### Task 29: RouterGroup — Prefix + Scoped Middleware
**Relates to:** US-9 (Route Groups)  
**Dependencies:** Task 22, Task 13

**What to do:**
- Implement `RouterGroup` class with prefix and scoped middleware
- HTTP method handlers prepend the group prefix to paths
- Groups can be nested (prefixes concatenate)
- Scoped middleware only runs for routes in that group

**Done when:** Can group routes under `/api/v1/` with shared middleware that doesn't affect other routes.

---

### Task 30: Plugin System — IPlugin Interface
**Relates to:** US-10 (Plugin System)  
**Dependencies:** Task 3

**What to do:**
- Define `IPlugin` interface with `name` and `register(app)`
- Implement plugin registration on ClaireX via `app.register(plugin)`
- Plugins receive the app instance and can add routes, middleware, etc.

**Done when:** Can create and register a plugin that adds routes to the app.

---

### Task 31: Typed Handler Enforcement
**Relates to:** US-6 (Typed Handler Signatures)  
**Dependencies:** Task 24 (needs validator for type connection)

**What to do:**
- Evolve `ClaireHandler` to generic: `ClaireHandler<TParams, TQuery, TBody>`
- Enforce that all type parameters must be explicitly declared (no defaults)
- Connect handler types with validator types (validator output = handler input types)

**Done when:** TypeScript errors if a developer defines a handler without explicit type parameters.

---

### Task 32: Bun.plugin — .claire File Extension (Experimental)
**Relates to:** ClaireX differentiator  
**Dependencies:** Task 24, Task 31

**What to do:**
- Implement custom Bun.plugin that registers `.claire` file loader
- Loader transpiles `.claire` → `.ts` with enforcement rules
- Rejects code that doesn't meet ClaireX typing standards at compile level
- Forces explicit type annotations, validated body access, typed route params

**Done when:** A `.claire` file can define controllers/handlers with compiler-enforced type safety beyond what TypeScript alone provides.

---

### Task 33: Documentation & Hackathon Submission
**Relates to:** Hackathon requirements  
**Dependencies:** All previous tasks

**What to do:**
- Write comprehensive README.md (problem, install, quick start, API docs, "Built with Kiro" section)
- Ensure `.kiro/specs/` is committed and up-to-date
- Verify: `bun install` → `bun run example/index.ts` works cleanly
- Create demo video showing ClaireX in action + Kiro spec-driven process

**Done when:** A judge can clone, install, run, and understand the project from the README alone.

---

### Task 27: Naming Refactor — ClaireCell & Context Methods ✅
**Commits:** `87f6fa5`, `ab94073`, `97346d7`

**What was done:**
- Renamed `ClaireController` → `ClaireCell` — a "cell" is a self-contained unit of routes + handlers + middleware for one resource
- Renamed `c.setBody` → `c.body` (setter) — simpler, intuitive
- Renamed `c.body<T>()` → `c.valid<T>()` (getter method) — communicates "this data is validated"
- Updated all imports and references

**Why ClaireCell:**
- Inspired by Resident Evil: Code Veronica — Claire starts the game in a prison cell
- A cell is self-contained, isolated, complete — exactly what this class is
- "Build a cell" = define routes, handlers, and middleware for one resource
- Not a "controller" in the traditional MVC sense — it's more than that (owns middleware, owns prefix, self-registers)

**Updated API:**
```typescript
// Before:
export class UserController extends ClaireController { ... }
const body = c.body<User>();

// After:
export class UserCell extends ClaireCell { ... }
const body = c.valid<User>();
```

---

### Task 28: ClaireKey Rebrand & Composition Refactor ✅
**Commits:** `c00a220`, `457c946`, `109c203`, `4c919a1`, `131001d`, `11a69b7`, `6779278`, `c20bf28`

**What was done:**
- Renamed `ClaireCell` → `ClaireKey` — inspired by Claire Redfield's lockpick/key items in Resident Evil
- ClaireX no longer extends ClaireRouter — switched to composition (`private _router = new ClaireRouter()`)
- Removed inline routing mode (`app.get()`, `app.post()` etc.) — ClaireKey is THE way to define routes
- Moved `mount()` from ClaireRouter to ClaireX, renamed to `unlock()` — "unlock a resource using a key"
- Implemented method chaining: `use()` and `unlock()` return `this`, `listen()` returns `void` (terminates chain)
- ClaireX now exposes only 3 methods: `unlock()`, `use()`, `listen()`
- Example folder restructured: `cells/` → `keys/`
- Old approach preserved in `draft/src/` for reference

**Why ClaireKey:**
- Claire Redfield's signature ability is lockpicking — unlocking access to new areas
- A ClaireKey "unlocks" access to one resource in your API
- ClaireKey replaces 4-5 concepts other frameworks need: controller + router group + plugin + middleware scope + module
- One class = one resource = routes + handlers + scoped middleware. Self-contained.

**Why composition over inheritance:**
- ClaireX is NOT a router — it's the application orchestrator
- Users cannot call `app.get()` or `app.post()` — forces the ClaireKey pattern
- Clean separation: ClaireRouter = route storage, ClaireX = lifecycle + middleware + mounting
- ClaireKey uses ClaireRouter internally (for route registration). ClaireX uses ClaireRouter internally (for route storage). Neither inherits.

**Method chaining:**
```typescript
const app = new ClaireX(3000)
    .unlock(new UserKey())
    .unlock(new PostKey())
    .use(new AuthGuard())
    .listen();
```

- `unlock()` returns `this` — chain multiple keys
- `use()` returns `this` — chain multiple middlewares
- `listen()` returns `void` — terminates the chain, starts the server

**ClaireX public API (final):**
```typescript
class ClaireX {
    constructor(port?: number);
    unlock(key: ClaireKey): this;
    use(middleware: ClaireMiddleware): this;
    listen(): void;
}
```

Three methods. That's it. Everything else is done through ClaireKey.

---

### Task 29: Edge Case — Validator Level Guard ✅
**Commits:** `6ccdbe8`, `fb8f621`, `6391c80`, `75a7144`

**What was done:**
- ClaireValidator can ONLY be used at the route level — framework enforces this at startup
- `ClaireX.use()` checks `instanceof ClaireValidator` → throws ClaireException if detected
- `ClaireKey` constructor loops through key-level middlewares → throws ClaireException if a validator is found
- Server refuses to start if validator is misplaced — loud, clear error at startup

**Why this guard exists:**
- Validators call `c.request.json()` — GET requests have no body → crash
- Different routes expect different body shapes — a key-level validator can't know which route is being hit
- Validators at key level break other routes: "Body already used" error when multiple validators try to read the stream
- The framework must prevent misuse, not let users figure it out at runtime

**Edge case discovered through testing:**
```typescript
// This SHOULD NOT work — and now it doesn't:
super('/users', [new logger(), new updateUserValidator()]); // ❌ throws at startup

// This is the ONLY correct usage:
this.routes('post', '/', this.createUser, [new userValidator()]); // ✅ route level
```

---

### Task 30: Edge Case — Missing Validator Guard ✅
**Commits:** `6519dc5`, `34059e2`, `eda05a2`, `353b7e7`

**What was done:**
- If `c.valid<T>()` is called without a ClaireValidator middleware on the route, it now throws instead of silently returning `{}`
- ClaireContext checks if `_valid` is empty/default before returning — throws ClaireException(500) with a clear message
- Prevents silent failures where handler receives empty object instead of validated data

**The problem it solves:**
```typescript
// User forgets to attach validator:
this.routes('post', '/', this.createUser);  // no validator!

// Handler calls c.valid<User>() — previously returned {} silently
// Now throws: "No validated body found. Did you forget to attach a ClaireValidator?"
```

**Framework philosophy:** ClaireX does not fail silently. If you call `c.valid<T>()`, you MUST have validated. Otherwise the framework tells you immediately.

---

## Remaining Tasks

---

### Task 31: Pre-built Exceptions — Subclasses
**Relates to:** Task 21  
**Dependencies:** Task 21 (base ClaireException)

**What to do:**
- Create `/src/exceptions/` folder
- Implement convenience subclasses: `NotFoundException` (404), `ValidationException` (400), `UnauthorizedException` (401), `InternalException` (500)
- Each subclass provides its own default hint for `logClaireException()`

**Done when:** Users can `throw new NotFoundException('User not found')` without remembering status codes.

---

### Task 32: Pre-built Middlewares — CORS & JWT
**Relates to:** Task 18  
**Dependencies:** Task 18 (ClaireMiddleware base)

**What to do:**
- `ClaireCors` — handles CORS headers + OPTIONS preflight
- `ClaireJWT` — verifies Bearer token, stores decoded payload on context

**Done when:** Framework ships with production-ready middlewares out of the box.

---

### Task 33: Typed Handler Enforcement / ClaireHandler as Class
**Relates to:** US-6 (Typed Handler Signatures)  
**Dependencies:** Task 24 (validator)

**What to do:**
- Consider evolving `ClaireHandler` from a type alias to a class
- Could enable typed handler signatures that connect to validator output
- May integrate with the .claire extension for compile-time enforcement

**Done when:** Decision made and implemented — either class-based handlers or remains as type alias with .claire enforcement.

---

### Task 34: Bun.plugin — .claire File Extension (Experimental)
**Relates to:** ClaireX differentiator  
**Dependencies:** Task 24, Task 33

**What to do:**
- Implement custom Bun.plugin that registers `.claire` file loader
- Compile-time enforcement of ClaireX rules:
  - `c.valid<T>()` without validator on route → compile error
  - Validator at wrong level → compile error
  - Handler missing explicit return type → compile error
  - Untyped params access → compile error
- Moves runtime guardrails (Task 29, 30) to compile time

**Done when:** A `.claire` file rejects invalid code before it even runs. Editor shows errors inline.

---

### Task 35: Documentation & Hackathon Submission
**Relates to:** Hackathon requirements  
**Dependencies:** All previous tasks

**What to do:**
- Write comprehensive README.md
- Nuxt Content docs site (clairex-docs repo)
- Ensure `.kiro/specs/` is committed and up-to-date
- Demo video showing ClaireX in action + Kiro spec-driven process

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
| 15 | ClaireKey — Class-Based Keys | ✅ Done |
| 16 | Types Extraction | ✅ Done |
| 17 | ClaireHandler Type | ✅ Done |
| 18 | ClaireMiddleware — Before/After Model | ✅ Done |
| 19 | ClaireX — Basic 404 Fallback | ✅ Done |
| 20 | Integration Test — Middleware | ✅ Done |
| 21 | ClaireException — Error Classes | ✅ Done |
| 22 | Scoped Middleware — Three Levels | ✅ Done |
| 23 | Developer Experience — Terminal Polish | ✅ Done |
| 24 | ClaireValidator — Abstract Class & Rules | ✅ Done |
| 25 | ClaireContext — Validated Body Storage | ✅ Done |
| 26 | ClaireValidator — Integration & Testing | ✅ Done |
| 27 | Naming Refactor — ClaireCell & Methods | ✅ Done |
| 28 | ClaireKey Rebrand & Composition Refactor | ✅ Done |
| 29 | Edge Case — Validator Level Guard | ✅ Done |
| 30 | Edge Case — Missing Validator Guard | ✅ Done |
| 31 | Pre-built Exceptions | ⬜ Next |
| 32 | Pre-built Middlewares | ⬜ Pending |
| 33 | Typed Handler Enforcement | ⬜ Pending |
| 34 | Bun.plugin — .claire Extension | ⬜ Experimental |
| 35 | Documentation & Submission | ⬜ Final |
