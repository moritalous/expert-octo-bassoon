import test from "node:test";
import assert from "node:assert/strict";

import { cleanTextFragment, parseFeedItems, summarizeItem } from "../src/feed-parser.mjs";

test("parseFeedItems parses RSS items", () => {
  const xml = `<?xml version="1.0"?>
  <rss version="2.0">
    <channel>
      <item>
        <title>RSS headline</title>
        <link>https://example.com/rss</link>
        <pubDate>Sat, 15 Mar 2026 00:00:00 +0000</pubDate>
        <description><![CDATA[<p>RSS summary text</p>]]></description>
      </item>
    </channel>
  </rss>`;

  assert.deepEqual(parseFeedItems(xml), [
    {
      title: "RSS headline",
      link: "https://example.com/rss",
      pubDate: "Sat, 15 Mar 2026 00:00:00 +0000",
      description: "<p>RSS summary text</p>"
    }
  ]);
});

test("parseFeedItems parses Atom entries such as Google Alerts feeds", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>Google アラート - Claude Code</title>
    <entry>
      <title type="html">Atom headline</title>
      <link href="https://www.google.com/url?rct=j&amp;url=https://example.com/atom" />
      <published>2026-03-15T00:01:30Z</published>
      <updated>2026-03-15T00:01:30Z</updated>
      <content type="html">With &lt;b&gt;Claude Code&lt;/b&gt; coverage in the article.</content>
    </entry>
  </feed>`;

  assert.deepEqual(parseFeedItems(xml), [
    {
      title: "Atom headline",
      link: "https://www.google.com/url?rct=j&url=https://example.com/atom",
      pubDate: "2026-03-15T00:01:30Z",
      description: "With <b>Claude Code</b> coverage in the article."
    }
  ]);
});

test("parseFeedItems parses Atom entries with entry attributes", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <entry xml:lang="ja">
      <title type="html">Attributed Atom headline</title>
      <link href="https://example.com/atom-attributed" />
      <updated>2026-03-15T01:00:00Z</updated>
      <summary type="html">Summary with &lt;b&gt;markup&lt;/b&gt;.</summary>
    </entry>
  </feed>`;

  assert.deepEqual(parseFeedItems(xml), [
    {
      title: "Attributed Atom headline",
      link: "https://example.com/atom-attributed",
      pubDate: "2026-03-15T01:00:00Z",
      description: "Summary with <b>markup</b>."
    }
  ]);
});

test("summarizeItem strips markup from Atom content", () => {
  const summary = summarizeItem({
    title: "Atom headline",
    description: "With <b>Claude Code</b> coverage in the article and enough detail to avoid fallback."
  });

  assert.equal(summary, "With Claude Code coverage in the article and enough detail to avoid fallback.");
});

test("cleanTextFragment decodes common entities used in feeds", () => {
  assert.equal(cleanTextFragment("Claude&nbsp;Code &middot; <b>Update</b>"), "Claude Code ・ Update");
});
