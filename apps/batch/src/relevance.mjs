function normalizeText(value = "") {
  return value.toLowerCase();
}

function countKeywordHits(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.filter((keyword) => normalized.includes(normalizeText(keyword)));
}

function getSourceName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function scoreArticle(theme, article) {
  const config = theme.relevance ?? {};
  const keywords = config.keywords ?? [];
  const excludeKeywords = config.exclude_keywords ?? [];
  const threshold = config.threshold ?? 0;
  const sourceName = article.sourceName || getSourceName(article.url);
  const fields = [
    { key: "title", text: article.title ?? "", weight: 5 },
    { key: "summary", text: article.summary ?? "", weight: 3 },
    { key: "url", text: article.url ?? "", weight: 2 },
    { key: "sourceName", text: sourceName, weight: 1 }
  ];

  let score = 0;
  const matchedKeywords = new Set();

  for (const field of fields) {
    const hits = countKeywordHits(field.text, keywords);
    if (hits.length === 0) continue;
    for (const hit of hits) matchedKeywords.add(hit);
    score += field.weight * hits.length;
  }

  const negativeHits = new Set();
  for (const field of fields) {
    const hits = countKeywordHits(field.text, excludeKeywords);
    for (const hit of hits) negativeHits.add(hit);
  }

  score -= negativeHits.size * 4;
  if (article.sourceType === "supplemental") {
    score -= 1;
  }

  const hasPositive = matchedKeywords.size > 0;
  const hasNegative = negativeHits.size > 0;
  const isRelevant = score >= threshold && hasPositive && !(hasNegative && score < threshold + 2);

  return {
    score,
    threshold,
    isRelevant,
    sourceName,
    matchedKeywords: [...matchedKeywords],
    negativeHits: [...negativeHits]
  };
}

export function rankArticles(theme, articles) {
  return articles
    .map((article) => {
      const relevance = scoreArticle(theme, article);
      return { ...article, relevance };
    })
    .filter((article) => article.relevance.isRelevant)
    .sort((a, b) => {
      if (b.relevance.score !== a.relevance.score) {
        return b.relevance.score - a.relevance.score;
      }
      return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
    });
}
