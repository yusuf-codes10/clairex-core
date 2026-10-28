# ClaireX for VS Code

Language support for `.cx` files, the source files of the [ClaireX](https://github.com/yusuf-codes10/clairex-core) framework: a class-based, explicitly typed web framework for Bun.

## Features

- **Syntax highlighting** for `.cx` files. They are treated as TypeScript, so you get the colors and bracket matching you are used to.
- **TypeScript support**: `.cx` files are understood by the TypeScript language server, so imports resolve and type errors show up as you type.
- **Snippets** for common ClaireX building blocks (keys, validators, middleware). Start typing a prefix and press `Tab`.
- **File icon** for `.cx` files, for users of [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme).

<!-- TODO: screenshot or GIF here. Use a full https:// URL (a raw.githubusercontent.com link works); the Marketplace won't show relative image paths unless "repository" is set in package.json. -->

## Getting started

1. Install this extension.
2. Open or create a project with ClaireX. The quickest way is the scaffold:

   ```bash
   bun create clairex my-app
   ```

3. Open any `.cx` file. Highlighting and type checking work right away.

## Snippets

| Prefix | Description |
| ------ | ----------- |
| `TODO` | Fill in from `snippets/claire.json` |

## Requirements

- [Bun](https://bun.sh) to run ClaireX projects.
- VS Code `1.80.0` or newer.
- The extension bundles `@clairex/typescript-plugin`, so there is nothing else to install.

## Known issues

- Snippets are registered for the TypeScript language, so they can also appear in regular `.ts` files.
- ClaireX files are highlighted as TypeScript. There is no dedicated ClaireX grammar yet.

Found a bug or have an idea? [Open an issue](https://github.com/yusuf-codes10/clairex-core/issues).

## Release notes

### 0.2.0

- Files now use the `.cx` extension instead of `.claire`.

### 0.1.0

- First release with `.claire` file support, snippets and the TypeScript plugin.

## License

See [LICENSE](LICENSE).