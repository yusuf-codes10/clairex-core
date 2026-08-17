import { plugin } from "bun"; // only thing you need

plugin({
  name: "claire-loader",
  setup(build) {
    build.onLoad({ filter: /\.claire$/ }, async ({ path }) => {
      const contents = await Bun.file(path).text();

    //   validate ClaireX rules | throws if validated

      return {
        contents: transform(contents),
        loader: "js",
      };
    });
  },
});

export const validate = (content: string, filePath: string): void => {
  // 1. Rule number 1: Must be a class
  if(!content.includes('class')) {
    throw new Error(`[ClaireX] ${filePath}: .claire files must export a class`);
  }
}