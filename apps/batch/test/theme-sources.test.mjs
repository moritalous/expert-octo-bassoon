import test from "node:test";
import assert from "node:assert/strict";

import { describeThemeSourcePolicy, getProductionFeedUrls } from "../src/theme-sources.mjs";

test("getProductionFeedUrls collects Google Alerts and explicit supplemental feeds only", () => {
  const theme = {
    google_alert_rss: [
      "https://www.google.com/alerts/feeds/primary",
      "https://www.google.com/alerts/feeds/primary"
    ],
    supplemental_rss: [
      "https://example.com/feed.xml",
      "   "
    ],
    extra_rss: [
      "https://aws.amazon.com/jp/blogs/news/feed/"
    ]
  };

  assert.deepEqual(getProductionFeedUrls(theme), [
    "https://www.google.com/alerts/feeds/primary",
    "https://example.com/feed.xml"
  ]);
});

test("describeThemeSourcePolicy reports normalized source buckets", () => {
  const theme = {
    google_alert_rss: ["https://www.google.com/alerts/feeds/primary", ""],
    supplemental_rss: ["https://example.com/feed.xml"]
  };

  assert.deepEqual(describeThemeSourcePolicy(theme), {
    primary: ["https://www.google.com/alerts/feeds/primary"],
    supplemental: ["https://example.com/feed.xml"]
  });
});
