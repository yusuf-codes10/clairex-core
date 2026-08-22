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
        const token = c.request.headers.get('authorization');
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

### Problem 2: Params Encapsulation ✅ SOLVED
~~`context.request.params = params` is assigned publicly.~~ Context is now created after route matching with params passed at construction. `_params` is private with getter only — fully sealed.

### Problem 3: Scoped Middleware ✅ SOLVED
~~All middlewares registered via `app.use()` are global.~~ ClaireX now supports three levels of middleware: global (`app.use()`), controller-level (passed to constructor), and route-level (4th param in `this.routes()`). Execution follows onion model at all three layers.

### Problem 4: Global Error Handling ✅ SOLVED
~~No try/catch in `fetch` handler.~~ ClaireException + try/catch now handles all thrown errors globally. Intentional throws return their typed response, unknown errors return generic 500.

### Problem 5: `.claire` Import Resolution in VS Code ✅ SOLVED
**Branch:** `5-claire-extension`

~~TypeScript's module resolver does not recognize `.claire` as a valid file extension.~~ Solved via `@clairex/typescript-plugin` — a TypeScript Language Service Plugin that patches `resolveModuleNameLiterals` on the language service host. When TypeScript encounters a `.claire` import, the plugin resolves the path manually (using `path.resolve` + `sys.fileExists`) and returns it with `extension: ts.Extension.Ts`. TypeScript reads the file as TypeScript — full types, no `any`, no generated files.

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

### Task 31: ClaireCors — CORS Middleware ✅
**Commits:** `52f96ea`, `e9a7496`, `02afd14`, `2026ab2`, `db583bd`

**What was done:**
- Implemented `ClaireCors` middleware in `/src/middleware/cors.ts`
- Constructor accepts: `origin`, `allowedHeaders[]`, `allowedMethods[]`, `exposeHeaders[]`
- `before()`: if method is `OPTIONS` (preflight) → returns `204` Response with all CORS headers (short-circuit)
- `after()`: adds CORS headers to every actual response so the browser allows it through
- Handles the browser's automatic preflight check without the user writing OPTIONS routes

**Design decisions:**
- CORS is a global middleware concern — `app.use(new ClaireCors(...))`
- `OPTIONS` is not a user-facing HTTP method — it's browser plumbing, handled by middleware
- No `options()` method on ClaireRouter — middleware handles it
- Configurable per-instance: different origins, headers, methods per deployment

---

### Task 32: ClaireJWT — JWT Authentication Middleware ✅
**Commits:** `b33eb38`, `51b5d87`, `58404cf`, `43147db`, `e63a02f`, `7cb57ac`, `bb0555a`, `d46cf5d`, `6e23c8d`, `c57e737`

**What was done:**
- Implemented `ClaireJWT` middleware in `/src/middleware/jwt.ts`
- Constructor accepts `secret: string` — the HMAC-SHA256 signing key
- `before()` flow: check header exists → extract Bearer token → verify with `ClaireUtil.verifyToken()` → store payload on context
- On failure: returns `ClaireException(401)` response (short-circuit)
- On success: stores decoded payload via `c.setAuth = payload`
- Handler accesses payload: `c.auth<TokenPayload>()`

**JWT utilities (zero external dependencies):**
- `signToken(payload, secret, expiresInSeconds?)` — creates JWT with HMAC-SHA256 via `crypto.subtle`
- `verifyToken(token, secret)` — verifies signature + checks expiration
- Internal helpers: `base64urlEncode`, `base64urlDecode`, `createSigningKey`
- All built on Bun's native `crypto.subtle` — no jose, no jsonwebtoken

**Usage:**
```typescript
// Protect routes:
super('/users', [new ClaireJWT(process.env.JWT_SECRET)]);

// Access decoded payload in handler:
const user = c.auth<{ userId: number, role: string }>();

// Create tokens in login handler:
const token = await ClaireUtil.signToken({ userId: 1, role: 'admin' }, SECRET);
return c.response.json({ token });
```

---

### Task 33: ClaireContext — Auth Payload Storage ✅
**Commits:** `cd60a70`, `1978ee5`, `e051d1f`, `1082304`

**What was done:**
- Added `private _auth: Record<string, unknown> | null = null` field on ClaireContext
- Added setter: `set setAuth(data: Record<string, unknown>)` — ClaireJWT middleware stores decoded payload
- Added generic method: `auth<T>(): T` — handler reads typed auth payload
- Guard: if `_auth` is null → throws ClaireException(500, "No auth payload found. Did you forget to attach a ClaireJWT middleware?")
- Same pattern as `c.valid<T>()` — middleware writes, handler reads, guard if missing

---

### Task 34: ClaireUtil — Static Utility Class ✅
**Commits:** `f6c0fef`, `cbeafce`, `34fbf5a`

**What was done:**
- Created `/src/utils/util.ts` — user-facing static utility class
- `ClaireUtil` is `abstract` — cannot be instantiated, only static method access
- Moved `signToken` and `verifyToken` from internal utils to `ClaireUtil`
- Internal helpers (`base64urlEncode`, `base64urlDecode`, `createSigningKey`, `matchRoute`, `clairexBanner`, `logClaireException`, `colorMethod`) remain in `src/core/utils.ts`

**Separation of utilities:**
- `/src/core/utils.ts` — **internal** (framework uses these, user doesn't touch them)
- `/src/utils/util.ts` — **public** (`ClaireUtil` static class, exported to user)

**User access:**
```typescript
import { ClaireUtil } from '@clairex/core';

const token = await ClaireUtil.signToken({ userId: 1 }, 'secret');
const payload = await ClaireUtil.verifyToken(token, 'secret');
```

---

### Task 35: ClaireRequest — Headers Helper API ✅
**Commits:** `5ef8e47`, `518a4f5`

**What was done:**
- Replaced plain `Record<string, string>` headers with helper object
- `c.request.headers.get(key)` — case-insensitive, lazy access via native Headers API
- `c.request.headers.has(key)` — boolean check
- `c.request.headers.all()` — returns full `Record<string, string>` when needed
- Updated all usages across codebase (tester.ts, middleware.ts JSDoc, tasks.md examples)

**Why the change:**
- Native Headers API is case-insensitive (`Authorization` vs `authorization` both work)
- Lazy access — only reads what you ask for, not all headers every time
- More methods available (`has()` for boolean checks)

---

### Task 36: npm Publish — @clairex/core ✅
**Commits:** `fe5080c`, `fd5d00c`, `aaf1002`, `4d5d833`, `32f67b3`

**What was done:**
- Created `tsconfig.build.json` — separate config for generating `.d.ts` declarations (overrides `noEmit`)
- Build script: `bun build ./src/index.ts --outdir ./dist --target bun && bunx tsc -p tsconfig.build.json`
- Updated barrel export (`src/index.ts`) — exports all core classes, middlewares, utils, and types
- Published to npm as `@clairex/core@0.1.0`
- Package includes: bundled JS (19.1 KB) + full TypeScript declarations
- Scoped under `@clairex` org — leaves room for `@clairex/orm`, `@clairex/cli` in the future

**Installation:**
```bash
bun add @clairex/core
```

**Package structure:**
```
dist/
├── index.js        — bundled code (19.1 KB)
├── index.d.ts      — barrel type declarations
├── core/           — .d.ts for all core classes
├── middleware/     — .d.ts for built-in middlewares
└── utils/          — .d.ts for ClaireUtil
```

---

## Remaining Tasks

---

### Task 37: Params Encapsulation — SOLVED ✅
**Commits:** `abe8c26`, `d934959`, `d8910cb`

**What was done:**
- ClaireContext now created AFTER route matching — params passed at construction time
- `ClaireContext` constructor accepts `params: Record<string, string> = {}` — forwards to ClaireRequest
- `ClaireRequest._params` is fully private with getter only — no public setter, no external mutation
- Removed `context.request.params = params` assignment from fetch handler
- Route matching now uses native `req.method` and `new URL(req.url).pathname` directly — no ClaireContext needed for matching
- Bonus: no wasted object creation for non-matching routes (context only created on match)

**The last original problem — SOLVED:**
- Before: context created before matching → params assigned publicly after → encapsulation broken
- After: context created after matching → params passed at birth → sealed, immutable, private

**All 4 original problems now resolved:**
1. ~~ClaireValidator (unknown body)~~ ✅ Task 24-26
2. ~~Params encapsulation (public setter)~~ ✅ Task 37
3. ~~Scoped middleware (global only)~~ ✅ Task 22
4. ~~Global error handling (no catch)~~ ✅ Task 21

---

### Task 38: Sub-Exceptions — Scratched ✅
**Commits:** `c98adaa`, `446ce1a`

**What was done:**
- Experimented with `NotFoundException extends ClaireException` — decided against it
- Scratched the idea: `throw new ClaireException(404, 'Not found')` is more explicit and ClaireX-style
- Status codes are universal — developers know them. Adding class names adds cognitive load for no benefit
- Hints will be added to `toResponse()` based on status code automatically (future enhancement)

**Design decision:**
- One exception class, explicit status codes. No subclass proliferation.
- `ClaireException` is enough. The user declares the code and message. ClaireX can auto-hint based on code.
- Sub-exceptions may still be used internally by the framework — but not as a user API.

---

### Task 39: Typed Handler Enforcement / ClaireHandler as Class
**Relates to:** US-6 (Typed Handler Signatures)  
**Dependencies:** Task 24 (validator)

**What to do:**
- Consider evolving `ClaireHandler` from a type alias to a class
- Could enable typed handler signatures that connect to validator output
- May integrate with the .claire extension for compile-time enforcement

**Done when:** Decision made and implemented — either class-based handlers or remains as type alias with .claire enforcement.

---

### Task 40: Bun.plugin — .claire File Extension (Experimental) ✅
**Commits:** `28d01a9`, `626ab60`, `5129a51`, `51f5de6`, `a43b2a8`, `6d9bfc9`, `20b0090`, `22c090a`, `1bc93e3`, `75d00d0`, `cec778d`, `181a7bf`, `ad88640`, `c5786fe`, `80e1f03`, `0409798`
**Branch:** `5-claire-extension`
**Status:** Experimental — 2 rules working, 2 rules stubbed

**What was done:**
- Implemented `claire-loader` Bun.plugin in `src/plugin/claire-loader.ts`
- Registered via `bunfig.toml` with `preload = ["@clairex/core/plugin"]` — intercepted before runtime
- Plugin hooks into `build.onLoad` with `filter: /\.claire$/` — any `.claire` file is caught
- On load: reads file text → validates against ClaireX rules → passes through with `loader: "ts"` if valid
- Added `.vscode/settings.json`: `"files.associations": { "*.claire": "typescript" }` — VS Code treats `.claire` as TypeScript (syntax highlighting, IntelliSense)
- Exported `validate()` function for potential reuse in testing/tooling

**Rules implemented:**

| Rule | What it checks | Status |
|------|----------------|--------|
| Rule 1: Export a class | `.claire` files must export a class (named or default). Regex: `/^\s*export\s+(default\s+)?class\s+\w+/m` | ✅ Working |
| Rule 2: Explicit return types | Every method with an access modifier (`private`, `public`, `protected`, `override`) must declare a return type after `)`. Skips constructors. | ✅ Working |
| Rule 3: Validator usage guard | `c.valid<T>()` used without a ClaireValidator on the route → reject | ⬜ Stubbed |
| Rule 4: Explicit parameter types | All method parameters must have explicit type annotations | ⬜ Stubbed |

**How it works:**
```
.claire file imported/required
    │
    ▼
Bun.plugin intercepts (onLoad, filter: /\.claire$/)
    │
    ▼
Read file contents as text
    │
    ▼
validate(contents, filePath)
├── Rule 1 fails? → throw Error (file must export a class)
├── Rule 2 fails? → logClaireException() + process.exit(1)
└── All pass? → return { contents, loader: "ts" }
    │
    ▼
Bun treats it as TypeScript from here on
```

**Design decisions:**
- `process.exit(1)` on Rule 2 failure — hard crash, not a catchable error. The file is invalid, the program should not start.
- Rule 1 uses `throw new Error()` — different from Rule 2 (will be unified later)
- Method detection uses access modifier regex (`/^\s*(private|public|protected|override)\s/`) — only checks methods you explicitly declare, ignores shorthand or undecorated functions
- Constructor is explicitly skipped (constructors don't have return types)
- `.claire` files are TypeScript under the hood — the extension is a ClaireX convention that triggers stricter compile-time rules
- `bunfig.toml` preload means users never need to import the plugin manually — it's always active

**What `.claire` files give you (vs plain `.ts`):**
- Enforced structure: must be a class export
- Enforced explicitness: all methods must declare return types
- Future: validator usage guards, parameter type enforcement
- Signals intent: "this file follows ClaireX rules" — a convention made enforceable

**Known cleanup needed:**
- `console.log("FAILING LINE:", line)` debug line still in code — remove before merge
- Rule 1 throws, Rule 2 exits — unify error handling approach
- Rule 2 checks lines containing `(`, `)`, and `{` with access modifiers — works for standard method declarations but may miss edge cases (multi-line signatures, decorators)

**Future (Rules 3 & 4):**
- Rule 3 needs AST-level analysis or smarter regex — must understand route registration context to know if a validator is attached
- Rule 4 is simpler — regex check for untyped params in method signatures (e.g., `(c)` instead of `(c: ClaireContext)`)
- Both may benefit from a proper TypeScript AST parser (Bun's `transpiler` or `ts-morph`) instead of regex

---

### Task 41: CLI Scaffolding — create-clairex ✅
**Commits:** `c46719c`
**Relates to:** DX, hackathon impact

**What to do:**
- Create `create-clairex` npm package
- Template project with: keys/, validators/, middlewares/, app.ts, tsconfig, package.json
- `bun create clairex my-app` scaffolds a working ClaireX project
- Auto-installs `@clairex/core`

**Done when:** Judges can `bun create clairex my-app` and have a working project immediately.

**Delivered:** `create-clairex` published to npm and working — `bun create clairex my-app`
scaffolds a running project.

The template shipped differs from the plan above, deliberately:

| Planned | Shipped | Why |
|---|---|---|
| `app.ts` | `src/index.ts` | matches the docs and the `dev` script |
| `middlewares/` | omitted | the template demonstrates one resource; an empty folder teaches nothing |
| — | `src/types/user.ts` | the type is half the story — `valid<T>()` needs something to be generic over |
| — | `bunfig.toml` | the `.claire` loader is required, so it cannot be left to the user |

Final template: `bunfig.toml`, `tsconfig.json`, `package.json`, `README.md`, `_gitignore`,
and `src/` containing `index.ts`, `types/user.ts`, `keys/user.key.claire`,
`validators/user.validator.claire`. Every `.claire` file in the template passes the
loader's own rules.

---

### Task 42: Documentation & Hackathon Submission ⚠️ ONE ITEM OUTSTANDING
**Relates to:** Hackathon requirements  
**Dependencies:** All previous tasks

**What to do:**
- Write comprehensive README.md
- Nuxt Content docs site (clairex-docs repo)
- Ensure `.kiro/specs/` is committed and up-to-date
- Demo video showing ClaireX in action + Kiro spec-driven process

**Done when:** A judge can clone, install, run, and understand the project from the README alone.

**Delivered:**

| Item | Status |
|---|---|
| README covering all nine required submission sections | ✅ |
| Docs site — 32 pages, deployed at `clairex-docs.vercel.app` | ✅ |
| `.kiro/specs/` committed and current | ✅ |
| Demo video | ⬜ outstanding |

The docs were written as a task-oriented user guide with the API reference separated:
getting-started, guides, `.claire` files, concepts, api. See Task 49 for the submission
preparation that followed.

---

### Task 43: @clairex/typescript-plugin — .claire Import Resolution ✅
**Commits:** `0ebb771`, `be7c6c8`, `112ef50`, `590063e`, `92e06b1`, `e1e88f7`, `ae9b017`, `cd3704b`, `7cf8fd7`, `ea087d5`, `c91e428`, `2783ceb`, `3313619`
**Branch:** `5-claire-extension`

**What was done:**
- Built `@clairex/typescript-plugin` — a TypeScript Language Service Plugin that resolves `.claire` imports in VS Code
- Lives in `packages/typescript-plugin/` within the monorepo (own `package.json`, own build, publishable independently)
- Hooks into `resolveModuleNameLiterals` on the TS language service host
- For `.claire` imports that TypeScript can't resolve: manually resolves the path using `path.resolve()` + `typescript.sys.fileExists()`
- Returns resolved files with `extension: typescript.Extension.Ts` — TypeScript reads them as TypeScript
- Zero transformation needed — `.claire` files ARE valid TypeScript, just with a different extension
- Inspired by `typescript-svelte-plugin` architecture (researched Svelte/Vue/Volar source code)

**File structure:**
```
packages/
└── typescript-plugin/
    ├── package.json          ← @clairex/typescript-plugin
    ├── tsconfig.json         ← commonjs output (TS Server uses require())
    ├── .gitignore            ← ignores dist/ and node_modules/
    └── src/
        ├── index.ts          ← init() → create() → patchModuleLoader()
        ├── module-loader.ts  ← patches resolveModuleNameLiterals, manual path resolution
        ├── claire-sys.ts     ← custom sys (unused, kept for future)
        └── utils.ts          ← isClaireFilePath() helper
```

**How it works:**
```
.claire import encountered by TypeScript
    │
    ▼
Plugin intercepts via patched resolveModuleNameLiterals()
    │
    ▼
Is it a .claire import? AND did TypeScript fail to resolve it?
    │ YES
    ▼
path.resolve(containingDir, moduleName) → absolute path
    │
    ▼
typescript.sys.fileExists(resolvedPath) → true?
    │ YES
    ▼
Return { resolvedFileName, extension: ts.Extension.Ts, isExternalLibraryImport: false }
    │
    ▼
TypeScript reads the .claire file as TypeScript — full types flow
```

**Key code (`module-loader.ts`):**
```typescript
import type ts from 'typescript/lib/tsserverlibrary';
import { isClaireFilePath } from './utils';
import * as path from 'path';

export function patchModuleLoader(
    typescript: typeof ts,
    languageServiceHost: ts.LanguageServiceHost
): void {
    const origResolveModuleNameLiterals = languageServiceHost.resolveModuleNameLiterals?.bind(languageServiceHost);

    if (languageServiceHost.resolveModuleNameLiterals) {
        languageServiceHost.resolveModuleNameLiterals = (moduleLiterals, containingFile, ...) => {
            const resolved = origResolveModuleNameLiterals!(...);
            return resolved.map((result, idx) => {
                const moduleName = moduleLiterals[idx].text;
                if (!isClaireFilePath(moduleName) || result.resolvedModule) return result;
                const resolvedModule = resolveClaireModule(typescript, moduleName, containingFile);
                return resolvedModule ? { resolvedModule } : result;
            });
        };
    }
}

function resolveClaireModule(typescript: typeof ts, moduleName: string, containingFile: string): ts.ResolvedModuleFull | undefined {
    const containingDir = path.dirname(containingFile);
    const resolvedPath = path.resolve(containingDir, moduleName);
    if (typescript.sys.fileExists(resolvedPath)) {
        return { resolvedFileName: resolvedPath, extension: typescript.Extension.Ts, isExternalLibraryImport: false };
    }
    return undefined;
}
```

**Configuration required:**

1. Root `package.json` — workspaces + devDependency:
```json
{
    "workspaces": ["packages/*"],
    "devDependencies": { "@clairex/typescript-plugin": "workspace:*" }
}
```

2. `tsconfig.json` (any project using `.claire` files):
```json
{
    "compilerOptions": {
        "plugins": [{ "name": "@clairex/typescript-plugin" }]
    }
}
```

3. VS Code must use **workspace TypeScript** (not bundled):
   - `Ctrl+Shift+P` → "TypeScript: Select TypeScript Version" → "Use Workspace Version"

4. `example/tsconfig.json` — separate tsconfig for the example folder (excluded from root):
```json
{
    "compilerOptions": {
        "plugins": [{ "name": "@clairex/typescript-plugin" }],
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        ...
    },
    "include": ["./**/*"]
}
```

**Lessons learned (debugging):**
- TypeScript plugins CANNOT use relative paths — must be a package name found in `node_modules`
- VS Code's bundled TS does NOT search the project's `node_modules` for plugins — must select workspace TS
- `ts.resolveModuleName()` doesn't find `.claire` files even with custom sys — TypeScript has hardcoded extension lists
- Manual `path.resolve()` + `fileExists()` is the correct approach (skip TS resolution entirely)
- Files excluded from `tsconfig.json` don't get plugin treatment — `example/` needed its own tsconfig
- Bun workspaces require `"workspace:*"` in devDependencies to create the symlink

**What this gives users:**
- ✅ `.claire` imports resolve with full types in VS Code
- ✅ No red "Cannot find module" errors
- ✅ No `any` type anywhere — full type safety maintained
- ✅ No generated declaration files, no artifacts
- ✅ Same approach as Vue (Volar) and Svelte — proven pattern

**Problem 5: SOLVED ✅**

**Future (Phase 2 & 3):**
- Wrap in a VS Code extension (`contributes.typescriptServerPlugins`) for auto-loading without manual tsconfig entry
- Custom `.claire` file icon
- Custom diagnostics from `validate()` rules
- Snippets for ClaireKey, ClaireValidator, ClaireMiddleware
- VS Code Marketplace listing

---

### Task 44: VS Code Extension — clairex-vscode ✅ SUPERSEDED BY TASK 48
**Relates to:** Task 43 (TypeScript plugin), Task 40 (.claire extension)
**Dependencies:** Task 43
**Status:** Built as planned, then revised — see Task 48

> **Note:** this task was implemented as written, but the plan below turned out to be wrong in one important way: registering `.claire` as its own language ID *prevented* TypeScript from providing language features. Task 48 documents the correction. Kept here for the design trail.

**What this is:**
A VS Code extension that wraps the existing `@clairex/typescript-plugin` and provides zero-config `.claire` file support. Currently, users need to manually configure `.vscode/settings.json`, `tsconfig.json`, and select workspace TypeScript. The extension eliminates all manual setup.

**What the extension replaces:**

| Feature | Currently handled by | Extension would handle it |
|---|---|---|
| Syntax highlighting for `.claire` | `files.associations` in `.vscode/settings.json` | ✅ Auto — no user config needed |
| Use workspace TypeScript | `typescript.tsdk` in `.vscode/settings.json` | ✅ Auto — contributes the TS plugin directly |
| Load the TS plugin | Manual `tsconfig.json` entry | ✅ Auto via `contributes.typescriptServerPlugins` |
| Custom `.claire` file icon | ❌ Not possible without extension | ✅ Yes — file icon themes |
| Snippets | ❌ Not available | ✅ `clairekey`, `clairevalidator`, etc. |
| ClaireX diagnostics | ❌ Only at runtime | ✅ Inline editor warnings |

**What to do:**
- Create a VS Code extension package (separate folder in `packages/` or own repo)
- `package.json` with `contributes.typescriptServerPlugins` referencing `@clairex/typescript-plugin`
- `contributes.languages` — register `.claire` as a language ID
- `contributes.grammars` — inherit TypeScript grammar (TextMate scope)
- `contributes.iconThemes` or `contributes.icons` — custom `.claire` file icon
- `contributes.snippets` — ClaireKey, ClaireValidator, ClaireMiddleware boilerplate
- Publish to VS Code Marketplace or distribute as `.vsix`

**User experience after installing the extension:**
1. Install `clairex-vscode` from marketplace
2. Open a project with `.claire` files
3. Everything works — syntax highlighting, import resolution, file icon, snippets
4. No `.vscode/settings.json` edits, no `tsconfig.json` plugin entry needed

**Done when:** Extension installable via `.vsix`, `.claire` files have their own icon, imports resolve without manual config.

---

### Task 45: ClaireValidator — One Validator Per Resource ✅
**Commits:** `7254a61`, `929af7c`, `d66e897`, `4f8f8c4`, `829c399`, `8ce11ad`
**Relates to:** US-4 (Built-in Validation)

**The problem this solves:**
The original design required **one validator class per action**. A resource with POST, PUT, and PATCH needed three validator files. Scale that to a 10-resource API and you have ~30 validator classes:

```
validators/
└── users/
    ├── postValidator.claire      ← create shape
    ├── patchValidator.claire     ← update shape
    └── putValidator.claire       ← replace shape
```

That is not solving the problem ClaireX set out to solve — it is Zod's schema-per-action model rewritten as classes. More ceremony, same file explosion.

**The insight:**
**PATCH is a partial of POST.** That is not a ClaireX convention — it is REST semantics. The *shape* does not change per action, only the *required* enforcement does. So one schema per resource is enough; the framework adjusts enforcement based on the HTTP method.

**What was done:**
- `ClaireValidator.before()` now reads `c.request.method` and picks the schema accordingly
- Added `protected partial(schema: ValidationSchema): ValidationSchema` — clones the schema with `required: false` on every rule
- Bodyless methods (`GET`, `DELETE`, `HEAD`, `OPTIONS`) return early — `c.request.json()` is never called on a request with no body
- `validated` object built from schema keys only — unknown fields are stripped, not passed through
- Empty PATCH guard — a PATCH with no recognised fields returns 400 instead of silently doing nothing

**Enforcement per method:**

| Method | Schema used | `required` enforced? |
|--------|-------------|---------------------|
| POST | `rules()` | ✅ yes |
| PUT | `rules()` | ✅ yes (full replacement) |
| PATCH | `partial(rules())` | ❌ no — but type/min/max still checked on present fields |
| GET / DELETE / HEAD / OPTIONS | none — early return | n/a |

**Result — one file per resource:**

```
validators/
└── user.validator.ts     ← one file, all actions
```

```typescript
export class userValidator extends ClaireValidator {
  override rules(): ValidationSchema {
    return {
      id:   { type: "number", required: true },
      name: { type: "string", required: true, min: 3 },
      age:  { type: "number", required: true, min: 18, immutable: true },
    };
  }
}
```

The same instance attaches to every route on the resource:

```typescript
register(): void {
    this.routes('get',   '/',    this.getUsers);
    this.routes('post',  '/',    this.createUser,     [new userValidator()]);
    this.routes('get',   '/:id', this.getUserById);
    this.routes('patch', '/:id', this.updateUserName, [new userValidator()]);
}
```

**Behaviour:**

| Request | Body | Result |
|---------|------|--------|
| `POST /users` | `{ id: 4, name: "Ada", age: 30 }` | ✅ passes |
| `POST /users` | `{ name: "Ada" }` | ❌ 400 — `id is required!` |
| `PATCH /users/1` | `{ name: "Ada" }` | ✅ passes — partial mode |
| `PATCH /users/1` | `{ name: "ab" }` | ❌ 400 — `min` still enforced |
| `PATCH /users/1` | `{}` | ❌ 400 — at least one field required |
| `PATCH /users/1` | `{ name: "Ada", isAdmin: true }` | ✅ passes — `isAdmin` stripped |

**Design decisions:**
- **Convention over configuration, deliberately.** ClaireX is opinionated: PATCH means partial. The alternative — `onPost()` / `onPatch()` / `onPut()` override hooks — was considered and rejected as speculative. It shifts a decision onto the user that the framework can make correctly 95% of the time. `partial()` stays `protected` so a subclass can still opt into explicit control if the need appears.
- **`partial()` mirrors TypeScript's `Partial<T>` by name** — runtime transform and compile-time transform sharing one word makes the mental model obvious.
- **Pruning to schema keys is a security fix, not just tidiness.** Previously `c.body = body` stored the *raw* parsed body, so `{ name: "x", isAdmin: true }` delivered `isAdmin` to the handler wearing a validated type. Unvalidated data must never reach `c.valid<T>()`.
- **Bodyless early return makes the validator safe by construction** rather than relying on the Task 29 placement guard.

**Trade-off accepted:** "PATCH is a partial of your schema" is invisible at the call site. A user who does not know the convention will be surprised the first time a `required` field is not enforced on PATCH. This is documented prominently rather than solved with configuration — and Task 46 removes the dangerous half of that surprise.

---

### Task 46: ClaireContext — `patched<T>()` and the Silent PATCH Bug ✅
**Commits:** `f940e3c`, `b931988`, `bf90358`, `6141aa7`, `7eec122`, `3dd97d7`
**Relates to:** Task 45, US-3 (Typed Request Context)

**The bug that motivated this:**
Task 45 made PATCH store only the fields that were sent. But the handler was still reading with `c.valid<User>()`:

```typescript
private updateUserName(c: ClaireContext): Response {
    const { name } = c.valid<User>();   // ← claims name is always a string
    ...
    foundUser.name = name;              // ← assigns unconditionally
}
```

`PATCH { age: 30 }` → `name` is `undefined` → `foundUser.name = undefined` **erased the stored name.** No exception, no warning, no log. Data loss that compiles cleanly.

The root cause is a **type lie**: `c.valid<User>()` promised a full `User`, the runtime delivered a partial one, and TypeScript had no way to know. And it could not know — the generic is supplied by the user, so the framework could not stop them declaring the wrong thing.

**The fix — make the wrong thing inexpressible:**

Two accessors, each with a return type the framework controls:

```typescript
valid<T>(): T              // full body — POST / PUT
patched<T>(): Partial<T>   // partial body — PATCH
```

The asymmetry is the whole mechanism. The user passes `User`; `patched()` hands back `Partial<User>`. They **cannot** widen it. So this now fails to compile:

```typescript
const patch = c.patched<User>();
foundUser.name = patch.name;
// ❌ Type 'string | undefined' is not assignable to type 'string'
```

**Plus a runtime guard so the pair cannot be mismatched:**

`ClaireContext` tracks the mode, set by the validator alongside the body:

```typescript
private _partial: boolean = false;
set partial(flag: boolean) { this._partial = flag; }
```

```typescript
valid<T>(): T {
    if (this._partial) {
        throw new ClaireException(500,
            'This route received a partial body (PATCH). Use c.patched<T>() instead.');
    }
    // ...existing "no validated body" check
}

patched<T>(): Partial<T> {
    if (!this._partial) {
        throw new ClaireException(500,
            'This route received a full body. Use c.valid<T>() instead.');
    }
    return this._valid as Partial<T>;
}
```

**Why `patched<T>()` is different from `valid<T>()`:**

| | `valid<T>()` | `patched<T>()` |
|---|---|---|
| Returns | `T` — every field guaranteed present | `Partial<T>` — every field optional |
| Valid on | POST, PUT | PATCH |
| Runtime guard | throws if the body was partial | throws if the body was full |
| Handler must | use fields directly | check `!== undefined` before assigning |
| Prevents | missing validator | **silent field erasure** |

**Correct handler:**

```typescript
private updateUserName(c: ClaireContext): Response {
    const { id } = c.request.params;
    const patch = c.patched<User>();          // Partial<User>

    const foundUser = users.find(u => u.id === Number(id));
    if (!foundUser) return new ClaireException(404, 'user not found!').toResponse();

    if (patch.name !== undefined) foundUser.name = patch.name;
    if (patch.age  !== undefined) foundUser.age  = patch.age;

    return c.response.json(users);
}
```

Note the object is **not** destructured up front — destructuring discards the "was it present?" information the guards depend on.

**Every failure mode is now loud:**

| Mistake | Caught by | When |
|---------|-----------|------|
| `c.valid<T>()` on a PATCH route | runtime guard, with a hint naming the fix | first request |
| `c.patched<T>()` on a POST route | runtime guard, with a hint naming the fix | first request |
| Unguarded assignment from a partial | TypeScript (`string \| undefined`) | as you type |
| No validator attached | existing empty-body check | first request |

**Design decisions:**
- **The compile error is the product.** `Type 'string | undefined' is not assignable to type 'string'` is not friction — it is the framework catching data loss before the code runs.
- **Rejected a `Proxy`-based runtime guard** that would throw on reading an unvalidated key. It breaks the legitimate `if (patch.name !== undefined)` pattern and would have required a parallel `c.has()` API to work around ClaireX's own guard. The type signature already solves it.
- **Naming:** `patched<T>()` over `partial<T>()` — `partial` was already taken by the validator's schema transform, and reusing it across two layers with different meanings would confuse more than the symmetry helped.
- Follows the established ClaireX pattern: middleware writes, handler reads, guard throws with a hint if the pairing is wrong — same as `c.valid<T>()` (Task 30) and `c.auth<T>()` (Task 33).

**Future candidate — Rule 5 for the `.claire` plugin:** *`c.valid<T>()` in a handler registered on a PATCH route is a violation.* Both the route registration and the handler live in the same file, so it is the same correlation technique Rule 3 needs. That would move this from a runtime guard to a load-time rejection.

---

### Task 47: ValidationRule — `immutable` Flag ✅
**Commits:** `10dea91`, `28d015b`, `6f95b24`
**Relates to:** Task 45

**The problem:**
With one schema per resource, every field became patchable. `id` is declared `required: true` for POST — which meant PATCH accepted it too, so a client could send `{ id: 999 }` and rewrite the primary key. Nothing stopped it except handler discipline (the handler simply never assigned `id`), which is implicit safety that a future edit could quietly remove.

**What was done:**
- Added `immutable?: boolean` to `ValidationRule`
- `partial()` skips immutable fields entirely — they never enter the PATCH schema, so they can never reach `validated`
- `before()` **rejects** the request if an immutable field is present in a PATCH body, rather than silently dropping it

```typescript
protected partial(schema: ValidationSchema): ValidationSchema {
    const result: ValidationSchema = {};
    for (const key in schema) {
        const rule = schema[key];
        if (!rule || rule.immutable) continue;   // excluded from partial mode
        result[key] = { ...rule, required: false };
    }
    return result;
}
```

```typescript
// immutable fields cannot be sent on PATCH — checked before any other rule
if (isPartial) {
    const full: ValidationSchema = this.rules();
    for (const key in full) {
        if (full[key]?.immutable && body[key] !== undefined) {
            return new ClaireException(400,
                `Validation failed!: "${key}" cannot be updated`).toResponse();
        }
    }
}
```

**Usage:**
```typescript
override rules(): ValidationSchema {
    return {
        id:   { type: "number", required: true },
        name: { type: "string", required: true, min: 3 },
        age:  { type: "number", required: true, min: 18, immutable: true },
    };
}
```

`age` is required on create and rejected on update.

**Design decisions:**
- **Reject, do not drop.** Silently ignoring a field the client explicitly sent is exactly the kind of quiet behaviour ClaireX avoids elsewhere. A 400 tells the client they did something wrong.
- **Checked first, before type/min/max.** Order of priority: *are you allowed to touch this field?* → *is the value valid?* → *did you send anything at all?* Validating an immutable field's type before rejecting it would be wasted work and a confusing error message.
- **The check reads `this.rules()`, not `schema`** — immutable keys have already been stripped from the partial schema, so the original is needed to know what to look for.
- **`immutable?` is optional with no default.** `undefined` is falsy, so an absent flag means mutable. Consistent with `required?`, `min?`, `max?` — you write it only when you mean it. Writing `immutable: false` everywhere would be noise.

---

### Task 48: VS Code Extension — `.claire` as First-Class TypeScript ✅
**Commits:** `eafc4c2`, `d4512ff`, `c2fa151`, `463ec27`
**Relates to:** Task 44, Task 43

**The problem:**
The extension registered `.claire` as its own language ID:

```json
"languages": [{ "id": "claire", "extensions": [".claire"], ... }],
"grammars":  [{ "language": "claire", "scopeName": "source.claire", ... }]
```

Its grammar inherited `source.ts`, so syntax highlighting worked — but **that was all.** VS Code's built-in TypeScript extension only provides language features for documents whose language is `typescript`/`javascript`. A custom language ID excluded `.claire` from every one of them: no IntelliSense inside the file, no hover types, no go-to-definition, no rename, no quick fixes, no formatting.

Imports resolved (that happens inside the TypeScript program, driven by other files) but the editing experience was hollow.

**The realisation:** you cannot have both a custom language ID *and* full TypeScript features. They are mutually exclusive. Since a `.claire` file **is** TypeScript, TypeScript should own it.

**What was done:**
- Removed `contributes.languages` — nothing competes with TypeScript for `.claire` documents any more
- Removed `contributes.grammars` — TypeScript's own grammar handles highlighting
- Removed `contributes.iconThemes` — replaced by a Material Icon Theme clone (see below)
- Added `contributes.configurationDefaults` — ships the required settings so users configure nothing
- `contributes.snippets` language changed from `claire` to `typescript`
- Removed `main` and the build step — every remaining contribution is declarative, so the extension needs no JavaScript entry point and no `activationEvents`

```json
"contributes": {
    "typescriptServerPlugins": [
        { "name": "@clairex/typescript-plugin", "enableForWorkspaceTypeScriptVersions": true }
    ],
    "configurationDefaults": {
        "files.associations": { "*.claire": "typescript" },
        "material-icon-theme.files.customClones": [
            { "name": "claire", "base": "typescript", "color": "#722f37", "fileExtensions": ["claire"] }
        ]
    },
    "snippets": [
        { "language": "typescript", "path": "./snippets/claire.json" }
    ]
}
```

**Before vs after:**

| Feature | Custom language ID | `.claire` as TypeScript |
|---------|-------------------|------------------------|
| Syntax highlighting | ✅ (inherited grammar) | ✅ (TypeScript's own) |
| `.claire` import resolution | ✅ (TS plugin) | ✅ (TS plugin) |
| IntelliSense / autocomplete | ❌ | ✅ |
| Hover types | ❌ | ✅ |
| Go to definition / rename | ❌ | ✅ |
| Quick fixes / refactors | ❌ | ✅ |
| Formatting | ❌ | ✅ |
| Custom file icon | ✅ (own icon theme) | ✅ (Material clone) |
| User configuration required | some | **none** |

**On the icon — a genuine VS Code limitation:**
There is no API to add a single file icon to an existing icon theme. Shipping `iconThemes` meant users had to *switch* to "ClaireX Icons", losing their own theme — and since the theme defined only `.claire`, every other file rendered blank. The workaround is a Material Icon Theme clone: a wine-coloured (`#722f37`) TypeScript icon mapped to `.claire`, shipped via `configurationDefaults` so it applies automatically without replacing anyone's theme. It also matches the wine terminal banner, giving ClaireX one consistent colour identity across editor and console.

**Design decisions:**
- **`configurationDefaults` over documentation.** Settings the extension can apply itself should never be the user's job. Users can still override them.
- **Declarative over programmatic.** With no `main`, there is no bundle to build, no activation lifecycle, and one less thing to break on repackage.
- **Convention accepted:** `.claire` files are TypeScript to the editor, and ClaireX's extra rules are enforced by the Bun loader at run time (Task 40). Two enforcement layers, one language.

**Packaging notes (hard-won):**
- `vsce` walks up into the monorepo root because of `"workspaces"` in the root `package.json`, pulling in ~1700 unrelated files and failing on `extension/../../tsconfig.json`. Workaround: copy the extension folder outside the repo and package from there.
- The `@clairex/typescript-plugin` dependency must be hand-staged into `node_modules/` before packaging — a `workspace:*` spec makes `npm list` (which `vsce` runs) fail.
- **An installed extension ships its own frozen copy of the TypeScript plugin.** Rebuilding the plugin locally has no effect until the extension is repackaged and reinstalled. For plugin development, uninstall the extension and load the plugin via a `tsconfig.json` `plugins` entry instead — the inner loop is then just rebuild + restart TS Server.
- TypeScript rejects **relative paths** in `compilerOptions.plugins` — a plugin must be referenced by package name and be resolvable from `node_modules`.
- VS Code must use the **workspace** TypeScript (`typescript.tsdk`, or "TypeScript: Select TypeScript Version → Use Workspace Version") for a project-local plugin to load at all. Its bundled TypeScript never searches the project's `node_modules`.

**Result:** `.claire` files behave exactly like `.ts` files in the editor, with a distinct wine icon, and every ClaireX-specific rule still enforced at load time. Zero configuration — no `.vscode/settings.json`, no `tsconfig.json` plugin entry.

---

### Task 49: Submission Preparation ✅
**Commits:** `75d9701`, `e12eb60`, `d3f19c7`…`0e51123`, `1107b2a`
**Relates to:** Task 42

Everything between "the framework works" and "a judge can evaluate it". The source was
frozen before this task started — nothing here changed `src/`.

**Licensing.** `LICENSE` (MIT) added at the root and a `license` field added to
`package.json`. `@clairex/core` had been published with no license field, so npm was
treating it as all-rights-reserved while `create-clairex` declared MIT — the two now agree.

**README.** Rewritten from the `bun init` stub into a full document: hero, features, three
getting-started paths, usage, configuration, testing, how Kiro was used, costs and limits,
editor support, attribution, license. Covers all nine required submission items.

An audit pass then caught: two malformed links rendering as literal text, a `.claire`
import path missing its extension, a `bunfig.toml` fence tagged as bash, and two missing
required sections (attribution, license). Getting Started was moved above the reference
sections so setup instructions come first.

**VS Code extension packaging.** `vsce package` failed with
`invalid relative path: extension/../../tsconfig.json`. Cause: this is a Bun workspace, so
`node_modules/@clairex/typescript-plugin` is a symlink to `../typescript-plugin`; `vsce`
followed it out of the extension directory and tried to package the whole monorepo — 1999
files. Two attempted fixes (removing `files`, declaring the plugin in `dependencies`) both
failed, the second because workspace resolution reports the dependency's path as
`../typescript-plugin`.

Resolved by packaging from a dereferenced copy outside the monorepo (`cp -RL` to `/tmp`),
where there is no parent workspace to escape into. The `.vsix` is committed at
`packages/vscode-extension/clairex-vscode-0.1.0.vsix` (19 files, 84 KB) with the built
plugin bundled at `node_modules/@clairex/typescript-plugin/dist/`.

Two dead files removed while in there: `extension.ts` (unreferenced since the `main` entry
point was dropped in Task 48) and a stray `dist/extension.js`.

> **Note for future packaging:** the `.vsix` must be built from a copy outside the
> monorepo, or Bun's workspace symlinks will break the manifest. `dist/` in
> `typescript-plugin` is gitignored, so run its `build` first.

**Distribution.** `create-clairex` published to npm (Task 41). Docs site deployed. Both
repositories made public — until then every GitHub link in the docs site returned a 404 to
anyone but the author.

**Repository cleanup.** `draft/specs/` removed: an older, smaller duplicate of
`.kiro/specs/` (342 vs 508 lines for design, 249 vs 1709 for tasks) plus a
`design copy.md`. Two spec folders in one repository make it ambiguous which is
authoritative. `draft/src/` was kept — Task 28 references it as the record of the earlier
Hono-like approach.

**Outstanding:** demo video (Task 42).

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
| 31 | ClaireCors — CORS Middleware | ✅ Done |
| 32 | ClaireJWT — JWT Authentication Middleware | ✅ Done |
| 33 | ClaireContext — Auth Payload Storage | ✅ Done |
| 34 | ClaireUtil — Static Utility Class | ✅ Done |
| 35 | ClaireRequest — Headers Helper API | ✅ Done |
| 36 | npm Publish — @clairex/core | ✅ Done |
| 37 | Params Encapsulation — Solved | ✅ Done |
| 38 | Sub-Exceptions — Scratched | ✅ Done |
| 39 | Typed Handler Enforcement | ⬜ Pending |
| 40 | Bun.plugin — .claire Extension | ✅ Experimental (2 rules working) |
| 41 | CLI Scaffolding — create-clairex | ✅ Done |
| 42 | Documentation & Submission | ⚠️ Video outstanding |
| 43 | @clairex/typescript-plugin — Import Resolution | ✅ Done (solves Problem 5) |
| 44 | VS Code Extension — clairex-vscode | ✅ Superseded by Task 48 |
| 45 | ClaireValidator — One Validator Per Resource | ✅ Done |
| 46 | ClaireContext — `patched<T>()` & Silent PATCH Bug | ✅ Done |
| 47 | ValidationRule — `immutable` Flag | ✅ Done |
| 48 | VS Code Extension — .claire as First-Class TypeScript | ✅ Done |
| 49 | Submission Preparation | ✅ Done |
