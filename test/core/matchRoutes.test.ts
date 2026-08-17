import { test, expect, describe } from "bun:test";
import { matchRoute } from "../../src/core/utils";

describe("matchRoute", () => {
  test("matches a static route", () => {
    expect(matchRoute("/users", "/users")).toEqual({});
  });

  test("matches root path", () => {
    expect(matchRoute("/", "/")).toEqual({});
  });

  test("returns null on static mismatch", () => {
    expect(matchRoute("/users", "/posts")).toBeNull();
  });

  test("returns null on segment count mismatch", () => {
    expect(matchRoute("/users/:id", "/users")).toBeNull();
  });

  test("extracts a single param", () => {
    expect(matchRoute("/users/:id", "/users/123")).toEqual({ id: "123" });
  });

  test("extracts multiple params", () => {
    expect(matchRoute("/users/:id/posts/:postId", "/users/1/posts/42")).toEqual({
      id: "1",
      postId: "42",
    });
  });

  test("handles trailing slashes gracefully", () => {
    expect(matchRoute("/users/", "/users")).toEqual({});
    expect(matchRoute("/users", "/users/")).toEqual({});
  });

  test("handles leading slashes consistently", () => {
    expect(matchRoute("users/:id", "/users/5")).toEqual({ id: "5" });
  });

  test("returns null when static segment doesn't match with param present", () => {
    expect(matchRoute("/users/:id/posts", "/users/1/comments")).toBeNull();
  });

  test("param value can contain special characters", () => {
    expect(matchRoute("/files/:name", "/files/my-file.txt")).toEqual({
      name: "my-file.txt",
    });
  });

  test("returns null for empty path against non-empty route", () => {
    expect(matchRoute("/users", "/")).toBeNull();
  });
});
