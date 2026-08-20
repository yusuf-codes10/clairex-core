# ClaireX App

Built with [ClaireX](https://github.com/yusuf-codes10/clairex-core) — a class-based, explicitly-typed web framework for Bun.

## Run

```bash
bun install
bun dev
```

Server starts on `http://localhost:3000`.

## Try it

```bash
# list users
curl http://localhost:3000/users

# one user
curl http://localhost:3000/users/1

# create — every field required
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"id":3,"name":"Ada","age":36}'

# validation failure — name too short
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"id":4,"name":"Ad","age":36}'

# partial update — only the fields you send
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"age":24}'

# immutable field rejected on PATCH
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"id":99}'
```

## Structure

```
src/
├── index.ts                          the app — unlock keys, start the server
├── types/user.ts                     compile-time shape
├── keys/user.key.claire              routes + handlers for one resource
└── validators/user.validator.claire  runtime shape — one validator per resource
```

## `.claire` files

`.claire` files are TypeScript with extra rules enforced at load time: every file
must export a class, and every method must declare an explicit return type. A
violation stops the process before the server starts.

This requires the loader, registered in `bunfig.toml`:

```toml
preload = ["@clairex/core/plugin"]
```

**Do not remove that line** — without it, `.claire` files are parsed with no loader
and their exports will not be found.

### Editor support

For `.claire` files to behave like `.ts` in VS Code (IntelliSense, hover, go-to-definition),
install the ClaireX extension. It is optional — the framework runs fine without it.

## Validation

One validator per resource. ClaireX adjusts enforcement based on the HTTP method:

| Method | `required` enforced | Notes |
|--------|--------------------|-------|
| POST / PUT | ✅ yes | full body |
| PATCH | ❌ no | partial — type/min/max still checked |
| GET / DELETE | — | skipped, no body |

Read the validated body with the accessor that matches the method:

```typescript
const body  = c.valid<User>();      // POST/PUT — every field guaranteed
const patch = c.patched<User>();    // PATCH — returns Partial<User>
```

Using the wrong one throws immediately with a message naming the fix.
