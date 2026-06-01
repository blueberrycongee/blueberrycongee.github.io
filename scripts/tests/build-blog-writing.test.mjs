import assert from "node:assert/strict";
import { test } from "node:test";
import { renderWriting } from "../build-blog.mjs";

test("renderWriting groups posts by year and shows red year headings", () => {
  const posts = [
    { title: "A", dateDisplay: "2026.01.18", url: "/2026/01/18/a/", tags: ["x"] },
    { title: "B", dateDisplay: "2025.12.28", url: "/2025/12/28/b/", tags: ["y"] },
    { title: "C", dateDisplay: "2025.11.03", url: "/2025/11/03/c/", tags: [] },
  ];
  const html = renderWriting(posts, "writing");
  assert.ok(html.includes('class="year"'), "year heading has class year");
  assert.ok(html.includes("2026"), "year 2026 present");
  assert.ok(html.includes("2025"), "year 2025 present");
  assert.ok(html.includes('href="/2026/01/18/a/"'), "post A link present");
  assert.ok(html.includes('href="/index/"'), "link to /index/ present");
  assert.ok(!html.includes("excerpt"), "no excerpt");
  assert.ok(!html.includes('class="hero-card"'), "no hero-card");
});

test("renderWriting shows post count", () => {
  const posts = [
    { title: "A", dateDisplay: "2025.01.01", url: "/x/", tags: [] },
  ];
  const html = renderWriting(posts, "writing");
  assert.ok(html.includes("1 post") || html.includes("1 posts"), "post count rendered");
});
