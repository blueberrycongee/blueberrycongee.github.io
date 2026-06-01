import assert from "node:assert/strict";
import { test } from "node:test";
import { renderPost } from "../build-blog.mjs";

test("renderPost includes back link, mono date, and prev/next when present", () => {
  const html = renderPost({
    title: "Test Post",
    dateDisplay: "2025.12.28",
    tags: ["go"],
    html: "<p>hello</p>",
    prev: { title: "Prev Post", url: "/2025/11/01/prev/" },
    next: { title: "Next Post", url: "/2026/01/01/next/" },
    currentPath: "writing",
  });
  assert.ok(html.includes("← writing"), "back link present");
  assert.ok(html.includes("2025 · 12 · 28"), "date in mono Y · M · D format");
  assert.ok(html.includes("Prev Post"), "prev title rendered");
  assert.ok(html.includes("/2025/11/01/prev/"), "prev url rendered");
  assert.ok(html.includes("Next Post"), "next title rendered");
  assert.ok(html.includes("/2026/01/01/next/"), "next url rendered");
  assert.ok(!html.includes('class="markdown-meta"'), "old markdown-meta class removed");
});

test("renderPost omits prev/next side when neighbour is null", () => {
  const html = renderPost({
    title: "Lone Post",
    dateDisplay: "2025.12.28",
    tags: [],
    html: "<p>x</p>",
    prev: null,
    next: null,
    currentPath: "writing",
  });
  assert.ok(!html.includes("post-prev is-empty") || html.includes("post-prev is-empty"), "empty prev placeholder");
  assert.ok(html.includes("post-prev is-empty"), "prev side marked empty");
  assert.ok(html.includes("post-next is-empty"), "next side marked empty");
});
