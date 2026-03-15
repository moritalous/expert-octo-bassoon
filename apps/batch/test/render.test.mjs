import test from "node:test";
import assert from "node:assert/strict";

import { markdownToHtml } from "../../../assets/render.mjs";

test("markdownToHtml renders source links and importance badges", () => {
  const html = markdownToHtml(`### 1. Claude update
- 重要度: High
- 出典: [記事を開く](https://example.com/article)`);

  assert.match(html, /importance-badge importance-high/);
  assert.match(html, /<a href="https:\/\/example.com\/article"/);
  assert.match(html, /記事を開く/);
});

test("markdownToHtml strips inline html noise from summaries", () => {
  const html = markdownToHtml("- 要約: With <b>Claude Code</b> &middot; update");

  assert.doesNotMatch(html, /<b>/);
  assert.match(html, /Claude Code/);
  assert.match(html, /・/);
});

test("markdownToHtml keeps parentheses inside markdown link URLs", () => {
  const html = markdownToHtml("- 出典: [記事を開く](https://example.com/wiki/Foo_(bar))");

  assert.match(html, /href="https:\/\/example\.com\/wiki\/Foo_\(bar\)"/);
  assert.doesNotMatch(html, /bar\)<\/a>\)/);
});
