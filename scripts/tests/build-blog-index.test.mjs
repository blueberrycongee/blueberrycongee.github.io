import assert from "node:assert/strict";
import { test } from "node:test";
import { renderIndex } from "../build-blog.mjs";

const samplePosts = [
  { title: "A", dateDisplay: "2026.01.18", url: "/2026/01/18/a/", tags: ["go", "essay"] },
  { title: "B", dateDisplay: "2025.12.28", url: "/2025/12/28/b/", tags: ["go"] },
  { title: "C", dateDisplay: "2025.11.03", url: "/2025/11/03/c/", tags: [] },
];

test("renderIndex time view lists posts by date", () => {
  const html = renderIndex(samplePosts, "time", "index");
  assert.ok(html.includes("/2026/01/18/a/"), "post A present");
  assert.ok(html.includes("/2025/12/28/b/"), "post B present");
});

test("renderIndex tags view groups by tag with counts", () => {
  const html = renderIndex(samplePosts, "tags", "index");
  assert.ok(html.includes("go"), "tag 'go' present");
  assert.ok(html.includes("essay"), "tag 'essay' present");
});

test("renderIndex categories view groups by category", () => {
  const html = renderIndex(samplePosts, "categories", "index");
  assert.ok(
    html.includes("uncategorized") || html.includes("Other"),
    "uncategorized bucket present"
  );
});

test("renderIndex has tab nav with current view marked", () => {
  const html = renderIndex(samplePosts, "tags", "index");
  assert.ok(html.includes("/index/"), "default tab link");
  assert.ok(html.includes("/index/tags"), "tags tab link");
  assert.ok(html.includes("/index/categories"), "categories tab link");
  assert.ok(html.includes("is-current"), "current view marked");
});
