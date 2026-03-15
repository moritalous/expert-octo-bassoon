function normalizeFeedList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => item?.trim()).filter(Boolean);
}

export function getProductionFeedUrls(theme) {
  const primary = normalizeFeedList(theme.google_alert_rss);
  const supplemental = normalizeFeedList(theme.supplemental_rss);

  return [...new Set([...primary, ...supplemental])];
}

export function describeThemeSourcePolicy(theme) {
  return {
    primary: normalizeFeedList(theme.google_alert_rss),
    supplemental: normalizeFeedList(theme.supplemental_rss)
  };
}
