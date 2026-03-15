import test from "node:test";
import assert from "node:assert/strict";

import { rankArticles, scoreArticle } from "../src/relevance.mjs";

const genAiTheme = {
  id: "gen-ai",
  relevance: {
    threshold: 7,
    keywords: ["generative ai", "claude", "bedrock", "llm", "agent"],
    exclude_keywords: ["rds", "redshift", "kinesis", "backup"]
  }
};

test("scoreArticle marks generative AI coverage as relevant", () => {
  const scored = scoreArticle(genAiTheme, {
    title: "Amazon Bedrock expands generative AI agent tooling",
    summary: "The update adds Claude-based workflows for enterprise teams.",
    url: "https://aws.amazon.com/blogs/news/bedrock-generative-ai-agents/",
    sourceType: "supplemental"
  });

  assert.equal(scored.isRelevant, true);
  assert.ok(scored.score >= genAiTheme.relevance.threshold);
  assert.ok(scored.matchedKeywords.includes("bedrock"));
});

test("scoreArticle filters unrelated infrastructure coverage", () => {
  const scored = scoreArticle(genAiTheme, {
    title: "Amazon RDS improves backup visibility for production teams",
    summary: "The release focuses on operations and recovery posture.",
    url: "https://aws.amazon.com/blogs/news/rds-backup-visibility/",
    sourceType: "supplemental"
  });

  assert.equal(scored.isRelevant, false);
  assert.ok(scored.negativeHits.includes("rds"));
});

test("rankArticles keeps only relevant articles and sorts by score", () => {
  const ranked = rankArticles(genAiTheme, [
    {
      title: "Amazon RDS improves backup visibility for production teams",
      summary: "The release focuses on operations and recovery posture.",
      url: "https://example.com/rds-backup",
      publishedAt: "2026-03-15T01:00:00Z",
      sourceType: "supplemental"
    },
    {
      title: "Claude adds agent controls for enterprise generative AI workflows",
      summary: "The LLM update improves orchestration and prompt management.",
      url: "https://example.com/claude-agent-controls",
      publishedAt: "2026-03-15T03:00:00Z",
      sourceType: "primary"
    },
    {
      title: "Bedrock launches new generative AI capabilities",
      summary: "Agent tooling and LLM management now ship in one console.",
      url: "https://example.com/bedrock-launch",
      publishedAt: "2026-03-15T02:00:00Z",
      sourceType: "supplemental"
    }
  ]);

  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].title, "Claude adds agent controls for enterprise generative AI workflows");
  assert.equal(ranked[1].title, "Bedrock launches new generative AI capabilities");
});
