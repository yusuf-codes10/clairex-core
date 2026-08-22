<div align="center">
  <a href="https://clairex-docs.vercel.app/">
    <img src="https://clairex-docs.vercel.app/images/logo.png" width="500" height="auto" alt="ClaireX"/>
  </a>
</div>

<hr />

ClaireX -claire, French for clear- is a class-based, explicitly-typed web framework for Bun. One class per resource, validation built in, three-level middleware and zero runtime dependencies.

```ts
import { ClaireX } from '@clairex/core';

new ClaireX()
.listen();

```

## Quick Start

```bash
bun create clairex my-app
```

## Features

- **OOP First** Everything is a class you instantiate, extend, and override. No decorators, no config objects, no magic strings. `override` is enforced, so you always know when you're replacing framework behaviour.

- **Built-in Validation** One `ClaireValidator` per resource, not one per action. No Zod, no Yup, no Joi, no dependencies. Enforcement adapts to the method: `POST` and `PUT` require every field, `PATCH` treats them as optional while still checking types and bounds, and `immutable` fields are rejected on update.

- **ClaireKey (5 in 1)** Controller, router group, module, middleware scope, and plugin in a single class. A key owns its prefix, routes, handlers, and scoped middleware; `unlock()` mounts all of it at once. Routes are never defined on the app.

- **`.claire` files** An optional file extension: TypeScript with two extra rules enforced when the file loads. It must export a class, and methods declared with `private`, `public`, `protected`, or `override` must declare an explicit return type. Break either and the process stops before the server starts, a violation is an error, not a warning.

## Usage

Every resource is a `ClaireKey`, it owns its prefix, its routes, its handlers, and its middleware.

```ts
// src/keys/user.key.claire
export class userKey extends ClaireKey {
    constructor() {
        super('/users');
    }

    protected register(): void {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser, [new userValidator()]);
        this.routes('patch', '/:id', this.updateUser, [new userValidator()]);
    }
}

```

Mount and every route comes with it:

```ts
new ClaireX(3000).unlock(new userKey()).listen()
```

One validator serves the whole resource. `POST` requires every field; `PATCH` treats them as optional but still enfornces types and bounds:

```ts
export class userValidator extends ClaireValidator {
  override rules(): ValidationSchema {
    return {
      id:   { type: "number", required: true, immutable: true },
      name: { type: "string", required: true, min: 3, max: 50 },
      age:  { type: "number", required: true, min: 18 },
    };
  }
}
```

Read the full body with `valid<T>()`, a partial one with `patched<T>()` which returns `Partial<T>`, so a partial update cannot be assigned as though it were complete.

Full documantation: [!https://clairex-docs.vercel.app]


## Author
[Yusuf Codes10](!https://github.com/yusuf-codes10)