import assert from "node:assert/strict";
import { test } from "node:test";
import { renderLayout } from "../build-blog.mjs";

test("renderLayout produces 4-item nav with current-page marker", () => {
  const html = renderLayout({
    title: "Test",
    description: "test desc",
    bodyHtml: "<p>body</p>",
    currentPath: "writing",
  });
  assert.ok(html.includes('href="/"'), "nav includes /");
  assert.ok(html.includes('href="/writing/"'), "nav includes /writing/");
  assert.ok(html.includes('href="/index/"'), "nav includes /index/");
  assert.ok(html.includes('href="/about/"'), "nav includes /about/");
  assert.ok(!html.includes("/blog/"), "nav excludes /blog/");
  assert.ok(
    html.includes("is-current"),
    "current page is marked with is-current class"
  );
});

test("renderLayout uses JetBrains Mono and Inter, no Fraunces/Space Grotesk", () => {
  const html = renderLayout({ title: "x", description: "y", bodyHtml: "" });
  assert.ok(html.includes("JetBrains+Mono"), "font preconnect for JetBrains Mono");
  assert.ok(html.includes("Inter"), "font preconnect for Inter");
  assert.ok(!html.includes("Fraunces"), "Fraunces removed");
  assert.ok(!html.includes("Space+Grotesk"), "Space Grotesk removed");
});

test("renderLayout footer is single line with email and github", () => {
  const html = renderLayout({ title: "x", description: "y", bodyHtml: "" });
  assert.ok(html.includes("lpageo@163.com"), "footer has email");
  assert.ok(html.includes("github.com/blueberrycongee"), "footer has github");
  assert.ok(!html.includes("class=\"hero-card\""), "no hero-card class");
});
