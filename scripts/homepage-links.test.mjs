import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "index.html");

const requiredLinks = [
  "https://github.com/blueberrycongee",
  "https://github.com/blueberrycongee/Lumina-Note",
  "https://github.com/blueberrycongee/llmux",
  "https://github.com/blueberrycongee/wuu",
];

test("homepage includes GitHub username in logo and project links", async () => {
  const html = await fs.readFile(indexPath, "utf-8");

  assert.ok(html.includes("blueberrycongee"), "Expected GitHub username in homepage content");
  requiredLinks.forEach((link) => {
    assert.ok(html.includes(link), `Missing link: ${link}`);
  });
});
