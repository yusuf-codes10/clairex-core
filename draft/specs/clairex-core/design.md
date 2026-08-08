# ClaireX-core Design

## Architecture Overview

ClaireX-core follows a layered, class-based architecture where each component is a standalone class that can be instantiated, extended, and overridden. The framework is built on top of Bun.serve and enforces explicit typing at every boundary.

```
┌─────────────────────────────────────────────────┐
│                   ClaireX (Core)                │
│         listen() · use() · server()             │
│              Bun.serve Adapter                   │
└──────────────────────┬──────────────────────────┘
                       │
              ┌────────▼────────┐
              │   ClaireRouter  │
              │ get/post/put/   │
              │ delete/patch    │
              │ path params     │
              │ wildcards       │
              └───┬─────────┬───┘
                  │         │
     ┌────────────▼──┐  ┌──▼───────────────┐
     │ ClaireContext  │  │ ClaireMiddleware │
     │ Request        │  │ MiddlewareChain  │
     │ Response       │  │ before/after     │
     │ params/query/  │  │ onion model      │
     │ body           │  └──────────────────┘
     └───────┬────────┘
             │
   ┌─────────┼──────────────┬──────────────────┐
   │         │              │                  │
   ▼         ▼              ▼                  ▼
┌────────┐ ┌───────────┐ ┌───────────────┐ ┌────────────────┐
│Claire  │ │Claire     │ │Claire         │ │Claire          │
│Handler │ │Validator  │ │Exception      │ │Response Builder│
│typed fn│ │body/params│ │typed error    │ │json/text/html/ │
│signature│ │query      │ │classes        │ │redirect/stream │
└────────┘ └───────────┘ └───────────────┘ └────────────────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
  ┌──────────┐ ┌──────┐ ┌──────────┐
  │RouterGroup│ │Plugin│ │  (future)│
  │prefix    │ │IPlugin│ │  custom  │
  │scoped mw │ │register│ │  .cx ext │
  └──────────┘ └──────┘ └──────────┘
```

---

## Core Classes & Responsibilities

### 1. ClaireX (Core Entry Point)

**Responsibility:** Application bootstrap, server lifecycle, global plugin/middleware registration.

```typescript
class ClaireX {
  private router: ClaireRouter;
  private plugins: IPlugin[];
  private middlewares: ClaireMiddleware[];

  public listen(port: number): void;        // Start Bun.serve on given port
  public use(plugin: IPlugin): void;         // Register a plugin
  public use(middleware: ClaireMiddleware): void; // Register global middleware
  public server(): Server;                   // Expose underlying Bun server
}
```

**Design Decisions:**
- Single entry point — one `new ClaireX()` per application
- `use()` is overloaded to accept both plugins and middleware
- Wraps `Bun.serve()` internally — developers never touch it directly

---

### 2. ClaireRouter

**Responsibility:** Route registration, HTTP method mapping, path matching, parameter extraction.

```typescript
class ClaireRouter {
  public get<TParams, TQuery>(path: string, handler: ClaireHandler<TParams, TQuery>): void;
  public post<TParams, TQuery, TBody>(path: string, handler: ClaireHandler<TParams, TQuery, TBody>): void;
  public put<TParams, TQuery, TBody>(path: string, handler: ClaireHandler<TParams, TQuery, TBody>): void;
  public delete<TParams, TQuery>(path: string, handler: ClaireHandler<TParams, TQuery>): void;
  public patch<TParams, TQuery, TBody>(path: string, handler: ClaireHandler<TParams, TQuery, TBody>): void;
  public group(prefix: string, callback: (group: RouterGroup) => void): void;
}
```

**Design Decisions:**
- Generic type parameters are REQUIRED — no defaults, no inference
- Path parameter patterns follow `:param` syntax (e.g., `/users/:id`)
- Wildcard support via `*` suffix (e.g., `/files/*`)
- Radix tree or trie-based matching for performance

---

### 3. ClaireContext

**Responsibility:** Wraps the native Request/Response into a typed, developer-friendly context object passed to every handler.

```typescript
class ClaireContext<TParams, TQuery, TBody> {
  public readonly request: Request;
  public readonly params: TParams;
  public readonly query: TQuery;
  public readonly body: TBody;

  public response(): ClaireResponseBuilder;
}
```

**Design Decisions:**
- Immutable after construction — no mutation of params/query/body after parsing
- Generic types enforce that the developer declares what shape they expect
- Body parsing happens once, lazily, and is cached on the context
- Response is accessed via a builder method, not a mutable property

---

### 4. ClaireMiddleware

**Responsibility:** Request/response transformation via an onion-model middleware chain.

```typescript
abstract class ClaireMiddleware {
  public abstract before(ctx: ClaireContext<unknown, unknown, unknown>): Promise<void> | void;
  public abstract after(ctx: ClaireContext<unknown, unknown, unknown>): Promise<void> | void;
}

class MiddlewareChain {
  private middlewares: ClaireMiddleware[];

  public add(middleware: ClaireMiddleware): void;
  public execute(ctx: ClaireContext<unknown, unknown, unknown>, handler: Function): Promise<Response>;
}
```

**Design Decisions:**
- Abstract class — developers extend it and override `before()` and `after()`
- Onion model: `before` hooks run outside-in, `after` hooks run inside-out
- Middleware can short-circuit by returning a response early in `before()`

---

### 5. ClaireHandler

**Responsibility:** Defines the typed function signature for route handlers.

```typescript
type ClaireHandler<TParams, TQuery, TBody = never> = (
  ctx: ClaireContext<TParams, TQuery, TBody>
) => Promise<Response> | Response;
```

**Design Decisions:**
- All type parameters must be explicitly provided — no implicit `any` or `unknown` defaults
- Return type is always `Response` or `Promise<Response>` — predictable and explicit
- `TBody` defaults to `never` for GET/DELETE (no body expected)

---

### 6. ClaireValidator

**Responsibility:** Built-in validation for request body, params, and query — no external libraries.

```typescript
abstract class ClaireValidator<T> {
  public abstract validate(data: unknown): T;
  public abstract rules(): ValidationRules<T>;
}

interface ValidationRules<T> {
  [K in keyof T]: ValidationRule;
}

interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
}
```

**Design Decisions:**
- Class-based — you extend `ClaireValidator` and define `rules()` for your shape
- Validation and type definition live together in the same class
- `validate()` returns the typed object or throws a `ClaireException`
- No decorators needed — rules are declared via a method (simpler, no experimental features)
- Custom validation via `custom` function for complex logic

---

### 7. ClaireResponseBuilder

**Responsibility:** Fluent builder for constructing typed HTTP responses.

```typescript
class ClaireResponseBuilder {
  public status(code: number): this;
  public json<T>(data: T): Response;
  public text(data: string): Response;
  public html(data: string): Response;
  public redirect(url: string, status?: number): Response;
  public stream(readable: ReadableStream): Response;
}
```

**Design Decisions:**
- Chainable builder pattern: `ctx.response().status(201).json(data)`
- Each terminal method (`json()`, `text()`, etc.) returns a final `Response`
- `json()` is generic — enforces that the response body type is explicit
- Status defaults to 200 if not set

---

### 8. ClaireException

**Responsibility:** Typed error classes for structured, predictable error handling.

```typescript
class ClaireException extends Error {
  public readonly statusCode: number;
  public readonly message: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(statusCode: number, message: string, metadata?: Record<string, unknown>);
}

// Pre-built exceptions
class NotFoundException extends ClaireException { /* 404 */ }
class ValidationException extends ClaireException { /* 400 */ }
class UnauthorizedException extends ClaireException { /* 401 */ }
class InternalException extends ClaireException { /* 500 */ }
```

**Design Decisions:**
- Extends native `Error` — works with try/catch and stack traces
- Pre-built common exceptions for convenience
- Framework has a global exception handler that catches unhandled ClaireExceptions and returns structured JSON responses
- Metadata allows attaching validation errors, debug info, etc.

---

### 9. RouterGroup

**Responsibility:** Group routes under a shared prefix with scoped middleware.

```typescript
class RouterGroup {
  private prefix: string;
  private middlewares: ClaireMiddleware[];

  public use(middleware: ClaireMiddleware): void;
  public get<TParams, TQuery>(path: string, handler: ClaireHandler<TParams, TQuery>): void;
  public post<TParams, TQuery, TBody>(path: string, handler: ClaireHandler<TParams, TQuery, TBody>): void;
  // ... other HTTP methods
}
```

**Design Decisions:**
- Groups inherit parent middleware + add their own scoped middleware
- Prefix is prepended to all routes within the group
- Groups can be nested (group within a group)

---

### 10. Plugin (IPlugin Interface)

**Responsibility:** Extensibility — allows modular features to hook into the framework lifecycle.

```typescript
interface IPlugin {
  name: string;
  register(app: ClaireX): void;
}
```

**Design Decisions:**
- Minimal interface — just `name` and `register()`
- `register()` receives the app instance — plugins can add routes, middleware, etc.
- Core stays lightweight; everything optional goes through plugins

---

## Request Lifecycle

```
Incoming HTTP Request (Bun.serve)
       │
       ▼
  ClaireX.handleRequest()
       │
       ▼
  ClaireRouter.match(method, path)
       │
       ▼
  Construct ClaireContext<TParams, TQuery, TBody>
       │
       ▼
  MiddlewareChain.execute() — BEFORE hooks (outside → in)
       │
       ▼
  ClaireValidator.validate() — body/params/query
       │ (throws ClaireException on failure)
       ▼
  ClaireHandler(ctx) — developer's route handler
       │
       ▼
  MiddlewareChain.execute() — AFTER hooks (inside → out)
       │
       ▼
  Return Response (via ClaireResponseBuilder)
```

---

## Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| Explicit over implicit | All types must be declared — no inference, no `any` defaults |
| Classes over functions | Every component is a class that can be extended/overridden |
| Colocation | Types + validation live in the same class |
| Zero external deps for validation | ClaireValidator replaces Zod/Yup/Joi entirely |
| Bun-native | Built on Bun.serve, uses Bun APIs, targets Bun runtime only |
| Override-friendly | OOP inheritance lets you customize any framework behavior |

---

## Technology Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode, no implicit any)
- **Server:** Bun.serve
- **Build:** Bun bundler (future: Bun.plugin for custom extensions)
- **Testing:** Bun test runner
- **Dependencies:** Zero runtime dependencies (framework is self-contained)
