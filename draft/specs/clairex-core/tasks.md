# ClaireX-core Implementation Tasks

## Task Sequence

Tasks are ordered by dependency — each task builds on the previous ones. Complete them in order.

---

### Task 1: Project Structure & Base Configuration
**Relates to:** All user stories (foundation)  
**Dependencies:** None

**What to do:**
- Set up the `src/` directory structure with folders for each module
- Configure `tsconfig.json` with strictest settings (noImplicitAny, noImplicitReturns, exactOptionalPropertyTypes)
- Set up `package.json` exports and entry point
- Create barrel files (`index.ts`) for clean imports

**Expected structure:**
```
src/
├── core/
├── router/
├── context/
├── middleware/
├── handler/
├── validator/
├── response/
├── exceptions/
├── plugins/
└── index.ts (barrel export)
```

**Done when:** `bun run build` succeeds with empty module files, exports are wired up.

---

### Task 2: ClaireException — Typed Error Classes
**Relates to:** US-8 (Typed Error Handling)  
**Dependencies:** Task 1

**What to do:**
- Implement base `ClaireException` class extending `Error`
- Add `statusCode`, `message`, and optional `metadata` properties
- Create pre-built exceptions: `NotFoundException`, `ValidationException`, `UnauthorizedException`, `InternalException`
- Implement `toJSON()` method for structured error serialization

**Done when:** Can instantiate exceptions, they have correct status codes, and serialize to JSON.

---

### Task 3: ClaireResponseBuilder — Response Construction
**Relates to:** US-7 (Response Builder)  
**Dependencies:** Task 1

**What to do:**
- Implement `ClaireResponseBuilder` class with fluent chainable API
- Implement `status(code)` method
- Implement terminal methods: `json<T>(data)`, `text(data)`, `html(data)`, `redirect(url, status?)`, `stream(readable)`
- Each terminal method returns a native `Response` object
- Default status is 200 if not explicitly set

**Done when:** Can build responses like `new ClaireResponseBuilder().status(201).json({ id: 1 })` and get a valid `Response`.

---

### Task 4: ClaireValidator — Built-in Validation
**Relates to:** US-4 (Built-in Validation)  
**Dependencies:** Task 2 (needs ClaireException for validation errors)

**What to do:**
- Define `ValidationRule` interface (type, required, min, max, pattern, custom)
- Define `ValidationRules<T>` mapped type
- Implement abstract `ClaireValidator<T>` class with `validate()` and `rules()` methods
- Implement validation logic: type checking, required fields, min/max, pattern matching, custom functions
- Throw `ValidationException` on failure with structured error details in metadata

**Done when:** Can extend `ClaireValidator`, define rules, call `validate(data)`, and get typed output or a `ValidationException`.

---

### Task 5: ClaireContext — Typed Request Context
**Relates to:** US-3 (Typed Request Context)  
**Dependencies:** Task 3 (needs ClaireResponseBuilder)

**What to do:**
- Implement `ClaireContext<TParams, TQuery, TBody>` class
- Wrap native `Request` object
- Parse and expose `params: TParams`, `query: TQuery`, `body: TBody`
- Implement lazy body parsing (parse on first access, cache result)
- Provide `response()` method that returns a new `ClaireResponseBuilder`
- Query string parsing from URL

**Done when:** Can construct a `ClaireContext` from a `Request` + route match data, access typed params/query/body, and build responses.

---

### Task 6: ClaireHandler — Typed Function Signature
**Relates to:** US-6 (Typed Handler Signatures)  
**Dependencies:** Task 5 (needs ClaireContext)

**What to do:**
- Define `ClaireHandler<TParams, TQuery, TBody>` type
- Handler takes `ClaireContext<TParams, TQuery, TBody>` and returns `Response | Promise<Response>`
- Ensure type parameters cannot be omitted (no defaults)

**Done when:** TypeScript enforces explicit type parameters when defining handlers — omitting them causes a compile error.

---

### Task 7: ClaireMiddleware — Onion Model Middleware
**Relates to:** US-5 (Middleware)  
**Dependencies:** Task 5 (needs ClaireContext)

**What to do:**
- Implement abstract `ClaireMiddleware` class with `before()` and `after()` methods
- Implement `MiddlewareChain` class that manages an ordered list of middleware
- Implement onion-model execution: before hooks run outside-in, after hooks run inside-out
- Support short-circuit in `before()` (return early response to skip handler)

**Done when:** Can create middleware classes, chain them, and verify execution order follows onion model.

---

### Task 8: ClaireRouter — Route Registration & Matching
**Relates to:** US-2 (Class-Based Routing)  
**Dependencies:** Task 6 (needs ClaireHandler type)

**What to do:**
- Implement `ClaireRouter` class with `get()`, `post()`, `put()`, `delete()`, `patch()` methods
- Implement path pattern parsing: static segments, `:param` parameters, `*` wildcards
- Implement route matching algorithm (find best match for incoming path)
- Extract path parameters from matched routes
- Store routes with their handlers and metadata

**Done when:** Can register routes with typed handlers and match incoming paths to the correct route, extracting params.

---

### Task 9: RouterGroup — Grouped Routes with Scoped Middleware
**Relates to:** US-9 (Route Groups)  
**Dependencies:** Task 7 (needs ClaireMiddleware), Task 8 (needs ClaireRouter)

**What to do:**
- Implement `RouterGroup` class with prefix and scoped middleware
- Implement `use()` for group-level middleware
- Implement HTTP method handlers that prepend the group prefix
- Support nested groups (group within a group, prefixes concatenate)
- Integrate with `ClaireRouter.group()` method

**Done when:** Can create route groups with prefixes and scoped middleware, nested groups concatenate prefixes.

---

### Task 10: Plugin System — IPlugin Interface
**Relates to:** US-10 (Plugin System)  
**Dependencies:** Task 8 (needs router available for plugins to register routes)

**What to do:**
- Define `IPlugin` interface with `name: string` and `register(app: ClaireX): void`
- Implement plugin registration in the core class
- Plugins receive the app instance and can add routes, middleware, etc.
- Ensure plugins are registered in order and before server starts

**Done when:** Can create a plugin class implementing `IPlugin`, register it via `app.use(plugin)`, and it can add routes/middleware.

---

### Task 11: ClaireX Core — Application Bootstrap & Server
**Relates to:** US-1 (Core Server Setup)  
**Dependencies:** Task 7, Task 8, Task 9, Task 10 (needs all components)

**What to do:**
- Implement main `ClaireX` class that ties everything together
- Implement `listen(port)` method that starts `Bun.serve()`
- Implement `use()` method (overloaded for plugins and middleware)
- Implement `server()` method to expose the Bun server instance
- Implement the main request handler that:
  1. Matches route via ClaireRouter
  2. Constructs ClaireContext
  3. Runs middleware chain (before)
  4. Runs validation (if validator attached to route)
  5. Calls handler
  6. Runs middleware chain (after)
  7. Returns response
- Implement global exception handler (catches ClaireException, returns JSON error)

**Done when:** Can create a full ClaireX app, register routes with validation and middleware, start the server, and handle requests end-to-end.

---

### Task 12: Integration & Smoke Testing
**Relates to:** All user stories  
**Dependencies:** Task 11

**What to do:**
- Create an example app using ClaireX that demonstrates all features
- Test: route registration and matching (static, params, wildcards)
- Test: typed context access (params, query, body)
- Test: built-in validation (valid input passes, invalid throws)
- Test: middleware execution order (onion model)
- Test: response builder (all methods)
- Test: error handling (thrown exceptions become JSON responses)
- Test: route groups with scoped middleware
- Test: plugin registration

**Done when:** Example app runs, all major features work end-to-end, no runtime errors.

---

### Task 13: Documentation & Hackathon Submission Prep
**Relates to:** Hackathon requirements  
**Dependencies:** Task 12

**What to do:**
- Write comprehensive README.md:
  - Problem statement and motivation
  - Installation & setup instructions
  - Quick start example
  - API documentation for each class
  - Section on "Built with Kiro" documenting spec-driven process
- Ensure `.kiro/` folder is committed (specs as proof of process)
- Create demo video showing:
  - The problem ClaireX solves
  - A working example app
  - Brief Kiro spec-driven workflow walkthrough
- Verify: project installs cleanly (`bun install`), runs (`bun run`), and matches README

**Done when:** A judge can clone the repo, follow the README, run the project, and understand the full vision.

---

## Summary

| Task | Component | Depends On |
|------|-----------|-----------|
| 1 | Project Structure | — |
| 2 | ClaireException | 1 |
| 3 | ClaireResponseBuilder | 1 |
| 4 | ClaireValidator | 2 |
| 5 | ClaireContext | 3 |
| 6 | ClaireHandler | 5 |
| 7 | ClaireMiddleware | 5 |
| 8 | ClaireRouter | 6 |
| 9 | RouterGroup | 7, 8 |
| 10 | Plugin System | 8 |
| 11 | ClaireX Core | 7, 8, 9, 10 |
| 12 | Integration Testing | 11 |
| 13 | Documentation & Submission | 12 |
