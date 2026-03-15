function decodeXml(text = "") {
  const decoded = text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&middot;", "・")
    .trim();
  const cdataMatch = decoded.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i);
  return cdataMatch ? cdataMatch[1].trim() : decoded;
}

function stripHtml(text = "") {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function cleanTextFragment(text = "") {
  return stripHtml(decodeXml(text));
}

function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function attributeValue(block, tag, attribute) {
  const match = block.match(new RegExp(`<${tag}[^>]*\\s${attribute}="([^"]+)"[^>]*\\/?>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function parseRssItems(xml) {
  const items = [];
  const matches = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];
  for (const rawItem of matches) {
    const title = tagValue(rawItem, "title") || "(no title)";
    const link = tagValue(rawItem, "link");
    const pubDate = tagValue(rawItem, "pubDate") || null;
    const description = tagValue(rawItem, "description") || "";
    if (!link) continue;
    items.push({ title, link, pubDate, description });
  }
  return items;
}

function parseAtomEntries(xml) {
  const items = [];
  const matches = xml.match(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi) ?? [];
  for (const rawEntry of matches) {
    const title = tagValue(rawEntry, "title") || "(no title)";
    const link =
      attributeValue(rawEntry, "link", "href") ||
      tagValue(rawEntry, "link");
    const pubDate = tagValue(rawEntry, "published") || tagValue(rawEntry, "updated") || null;
    const description = tagValue(rawEntry, "content") || tagValue(rawEntry, "summary") || "";
    if (!link) continue;
    items.push({ title, link, pubDate, description });
  }
  return items;
}

export function parseFeedItems(xml) {
  const rssItems = parseRssItems(xml);
  if (rssItems.length > 0) return rssItems;
  return parseAtomEntries(xml);
}

export function summarizeItem(item) {
  const cleaned = cleanTextFragment(item.description);
  if (cleaned.length > 30) return cleaned.slice(0, 180);
  return `${cleanTextFragment(item.title)} に関する更新です。詳細は出典リンクを確認してください。`;
}
