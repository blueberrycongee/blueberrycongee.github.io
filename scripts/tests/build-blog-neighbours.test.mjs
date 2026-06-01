import assert from "node:assert/strict";
import { test } from "node:test";
import { findNeighbours } from "../blog-utils.mjs";

test("findNeighbours returns prev and next for a middle post", () => {
  const sorted = [
    { url: "/2025/01/01/a/", date: "2025-01-01" },
    { url: "/2025/06/01/b/", date: "2025-06-01" },
    { url: "/2025/12/01/c/", date: "2025-12-01" },
  ];
  const result = findNeighbours(sorted, "/2025/06/01/b/");
  assert.deepEqual(result.prev, sorted[0]);
  assert.deepEqual(result.next, sorted[2]);
});

test("findNeighbours returns null next for newest post", () => {
  const sorted = [
    { url: "/2025/01/01/a/", date: "2025-01-01" },
    { url: "/2025/06/01/b/", date: "2025-06-01" },
  ];
  const result = findNeighbours(sorted, "/2025/06/01/b/");
  assert.equal(result.next, null);
  assert.deepEqual(result.prev, sorted[0]);
});

test("findNeighbours returns null prev for oldest post", () => {
  const sorted = [
    { url: "/2025/01/01/a/", date: "2025-01-01" },
    { url: "/2025/06/01/b/", date: "2025-06-01" },
  ];
  const result = findNeighbours(sorted, "/2025/01/01/a/");
  assert.equal(result.prev, null);
  assert.deepEqual(result.next, sorted[1]);
});

test("findNeighbours returns both null for unknown url", () => {
  const result = findNeighbours(
    [{ url: "/2025/01/01/a/", date: "2025-01-01" }],
    "/2099/01/01/missing/"
  );
  assert.equal(result.prev, null);
  assert.equal(result.next, null);
});
