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