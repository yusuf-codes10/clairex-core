import { plugin } from "bun";
import { logClaireException } from '../core/utils';

plugin({
  name: "claire-loader",
  setup(build) {
    build.onLoad({ filter: /\.claire$/ }, async ({ path }) => {
      const contents = await Bun.file(path).text();

      validate(contents, path);

      return {
        contents: contents,
        loader: "ts",
      };
    });
  },
});

export const validate = (content: string, filePath: string): void => {
  // Rule 1: Must export a class
  if (!/^\s*export\s+(default\s+)?class\s+\w+/m.test(content)) {
    throw new Error(`[ClaireX] ${filePath}: .claire files must export a class`);
  }

  // Rule 2: All methods must have explicit return types
  const lines = content.split(/\r?\n/);
  const methodLines = lines.filter(
    (line) =>
      line.includes("(") &&
      line.includes(")") &&
      line.includes("{") &&
      /^\s*(private|public|protected|override)\s/.test(line),
  );

  for (const line of methodLines) {
    if (line.includes("constructor")) continue;
    // console.log("FAILING LINE:", line); // ← add this
    const afterParen = line.substring(line.lastIndexOf(")"));
    if (!afterParen.includes(":")) {
      logClaireException("ClairePlugin", 0, `Missing return type: ${filePath}`);
      // throw new Error(`[ClaireX] .claire validation failed`);
      process.exit(1);
    }
  }

  // Rule 3: Validators: c.valid<T>() usage without validator → reject
  // Rule 4: explicit types on all parameters
};
