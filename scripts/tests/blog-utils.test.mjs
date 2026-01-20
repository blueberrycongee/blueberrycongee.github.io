import assert from "node:assert/strict";
import { parseFrontMatter } from "../blog-utils.mjs";

const bracketList = `
title: Sample
date: 2026-01-18
tags: [AI, Agent, Future, Career]
categories: [Thinking]
`.trim();

const parsed = parseFrontMatter(bracketList);
assert.deepEqual(parsed.tags, ["AI", "Agent", "Future", "Career"]);
assert.deepEqual(parsed.categories, ["Thinking"]);

console.log("blog-utils tests passed");
