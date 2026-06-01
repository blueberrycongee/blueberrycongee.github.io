import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

async function collectPosts(rootDir) {
  const out = [];
  const skip = new Set([
    "node_modules", ".git", "scripts", "css", "js", "assets", "img", "images",
    "index", "writing", "about", "bangumis", "Gallery", "categories", "tags", "docs",
  ]);
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (skip.has(e.name)) continue;
        await walk(full);
      } else if (e.name === "index.html" && /\/\d{4}\/\d{2}\/\d{2}\//.test(full)) {
        out.push(full);
      }
    }
  }
  await walk(rootDir);
  return out;
}

test("at least one post has both prev and next links", async () => {
  const candidates = await collectPosts(root);
  assert.ok(candidates.length > 0, "at least one post exists");

  let found = 0;
  for (const file of candidates) {
    const html = await fs.readFile(file, "utf-8");
    if (
      html.includes("post-prev") &&
      html.includes("post-next") &&
      !html.includes('class="post-prev is-empty"') &&
      !html.includes('class="post-next is-empty"')
    ) {
      found += 1;
    }
  }
  assert.ok(found > 0, "at least one post with both prev and next");
});

test("newest post has empty prev side and populated next side", async () => {
  // Find the newest by date from posts.json (authoritative ordering)
  const postsJson = JSON.parse(
    await fs.readFile(path.join(root, "index", "posts.json"), "utf-8")
  );
  const newestUrl = path.join(root, postsJson[0].url, "index.html");
  const html = await fs.readFile(newestUrl, "utf-8");
  assert.ok(html.includes("post-prev is-empty"), "newest post has no prev");
  assert.ok(!html.includes("post-next is-empty"), "newest post has next");
});
