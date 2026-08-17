import { plugin } from "bun"; // only thing you need
import { transform } from "../core/utils";

plugin({
  name: "my-plugin",
  setup(build) {
    build.onLoad({ filter: /\.myext$/ }, async ({ path }) => {
      const contents = await Bun.file(path).text();
      return {
        contents: transform(contents),
        loader: "js",
      };
    });
  },
});