import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "index.html");
const aboutPath = path.join(__dirname, "..", "about", "index.html");

test("footer has email and github", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(html.includes("lpageo@163.com"), "email present");
  assert.ok(html.includes("github.com/blueberrycongee"), "github present");
});

test("about page references selected projects", async () => {
  const html = await fs.readFile(aboutPath, "utf-8");
  assert.ok(html.includes("Lumina Note"), "Lumina Note project");
  assert.ok(html.includes("LLMux"), "LLMux project");
  assert.ok(html.includes("Wuu"), "Wuu project");
});
