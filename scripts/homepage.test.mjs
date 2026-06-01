import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "index.html");

test("homepage has 4-item nav and marks current page", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(html.includes('href="/"'), "nav has /");
  assert.ok(html.includes('href="writing/"'), "nav has writing/");
  assert.ok(html.includes('href="index/"'), "nav has index/");
  assert.ok(html.includes('href="about/"'), "nav has about/");
  assert.ok(html.includes('class="is-current"'), "current page marked");
});

test("homepage has manifesto h1 with red accent line", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(html.includes("I BUILD"), "first line of h1");
  assert.ok(html.includes("LANGUAGE TOOLS"), "red accent line");
  assert.ok(html.includes('class="red"'), "red class on accent line");
  assert.ok(html.includes("AND AGENT SYSTEMS"), "third line of h1");
});

test("homepage has /now line", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(html.includes("home-now"), "/now line present");
  assert.ok(html.includes("Wuu language") || html.includes("LLMux"), "/now content present");
});

test("homepage has no removed sections", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(!html.includes("Selected Work"), "Selected Work removed");
  assert.ok(!html.includes("hero-card"), "hero-card removed");
  assert.ok(!html.includes("data-reveal"), "data-reveal removed");
});
