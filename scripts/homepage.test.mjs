import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "index.html");

test("homepage removes writing anchor and section", async () => {
  const html = await fs.readFile(indexPath, "utf-8");

  assert.ok(!html.includes("#writing"), "Nav should not link to #writing");
  assert.ok(!html.includes('id="writing"'), "Writing section should be removed");
});
