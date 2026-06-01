import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const writingPath = path.join(__dirname, "..", "..", "writing", "index.html");

test("writing index groups by year and links to posts", async () => {
  const html = await fs.readFile(writingPath, "utf-8");
  assert.ok(html.includes("writing"), "writing title present");
  assert.ok(html.includes("/index/"), "link to /index/ present");
  assert.ok(html.match(/<h2[^>]*class="year">20\d\d/), "year heading");
  assert.ok(html.includes("post-row"), "post-row class present");
  assert.ok(!html.includes("excerpt"), "no excerpt");
});
