import { plugin } from "bun"; // only thing you need

plugin({
  name: "claire-loader",
  setup(build) {
    build.onLoad({ filter: /\.claire$/ }, async ({ path }) => {
      const contents = await Bun.file(path).text();

      //   validate ClaireX rules | throws if validated
      validate(contents, path);

      return {
        contents: contents,
        loader: "ts",
      };
    });
  },
});

export const validate = (content: string, filePath: string): void => {
  // 1. Rule number 1: Must be a class
  if (!/^\s*export\s+(default\s+)?class\s+\w+/m.test(content)) {
    throw new Error(`[ClaireX] ${filePath}: .claire files must export a class`);
  }

  // Rule 2: All methods must have explicit return types
  // Matches: ) { or ) async { without a : between ) and {
  const missingReturnType = /\)\s*\{/;
  const methodLines = content
    .split("")
    .filter(
      (line) => line.includes("(") && line.includes(")") && line.includes("{"),
    );

  for (const line of methodLines) {
    // Skip constructor — constructors don't have return types
    if (line.includes("constructor")) continue;
    // Check if there's a : between ) and {
    const afterParen = line.substring(line.lastIndexOf(")"));
    if (!afterParen.includes(":")) {
      throw new Error(
        `[ClaireX] ${filePath}: All methods must have explicit return types`,
      );
    }
  }

  // Rule 3: c.valid<T>() usage without validator → reject
  // Rule 4: explicit types on all parameters
};
