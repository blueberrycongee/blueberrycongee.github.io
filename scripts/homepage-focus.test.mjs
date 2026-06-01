import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homePath = path.join(__dirname, "..", "index.html");
const aboutPath = path.join(__dirname, "..", "about", "index.html");

test("homepage /now line matches about /now section", async () => {
  const home = await fs.readFile(homePath, "utf-8");
  const about = await fs.readFile(aboutPath, "utf-8");

  const homeNowMatch = home.match(/class="home-now">([^<]+)</);
  const aboutNowMatch = about.match(/id="now">[\s\S]*?<p>([^<]+)</);

  assert.ok(homeNowMatch, "home has home-now line");
  assert.ok(aboutNowMatch, "about has /now section");
  assert.equal(
    homeNowMatch[1].trim(),
    aboutNowMatch[1].trim(),
    "home /now content matches about /now content"
  );
});
