import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "index.html");

test("homepage focus list reflects updated interests", async () => {
  const html = await fs.readFile(indexPath, "utf-8");

  assert.ok(html.includes("人机（AI）协作"), "Expected focus on human-AI collaboration");
  assert.ok(html.includes("vLLM"), "Expected vLLM mention");
  assert.ok(html.includes("Agent"), "Expected Agent mention");
  assert.ok(html.includes("热爱开源"), "Expected open-source enthusiasm");
});
