import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const THEMES_PATH = path.join(ROOT, "config", "themes.json");
const CONTENT_DIR = path.join(ROOT, "content");
const INDEX_PATH = path.join(ROOT, "public", "index.json");

function getTodayJstDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function resolveBriefDate() {
  const override = process.env.BRIEF_DATE?.trim();
  if (!override) return getTodayJstDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(override)) {
    throw new Error(`Invalid BRIEF_DATE: ${override}. Expected YYYY-MM-DD.`);
  }
  return override;
}

function normalizeUrl(raw) {
  try {
    const url = new URL(raw);
    const blocked = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]);
    for (const key of [...url.searchParams.keys()]) {
      if (blocked.has(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function decodeXml(text = "") {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

function stripHtml(text = "") {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
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

function estimateImportance(title) {
  const t = title.toLowerCase();
  if (/(launch|release|funding|regulation|lawsuit|security|breach)/.test(t)) return "High";
  if (/(update|model|ai|startup|research|tool)/.test(t)) return "Medium";
  return "Low";
}

function summarize(item) {
  const cleaned = stripHtml(item.description);
  if (cleaned.length > 30) return cleaned.slice(0, 180);
  return `${item.title} に関する更新です。詳細は出典リンクを確認してください。`;
}

async function fetchRssItems(feedUrl) {
  const res = await fetch(feedUrl, { headers: { "user-agent": "morning-brief-bot/0.1" } });
  if (!res.ok) throw new Error(`Failed to fetch RSS: ${feedUrl} (${res.status})`);
  const xml = await res.text();
  return parseRssItems(xml);
}

async function readThemes() {
  const raw = await readFile(THEMES_PATH, "utf-8");
  return JSON.parse(raw);
}

async function readIndex() {
  try {
    const raw = await readFile(INDEX_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { generatedAt: null, items: [] };
  }
}

function renderMarkdown(date, theme, items) {
  const title = `${date} ${theme.name} 朝刊`;
  const lead = `本日の${theme.name}関連ニュースを ${items.length} 件キュレーションしました。`;
  const sections = items
    .map(
      (item, i) => `### ${i + 1}. ${item.title}\n- 重要度: ${item.importance}\n- 公開日時: ${item.publishedAt ?? "不明"}\n- 要約: ${item.summary}\n- 出典: ${item.url}`
    )
    .join("\n\n");

  return `# ${title}\n\n${lead}\n\n## トピック\n\n${sections}\n\n## 今日のメモ\n\n- 事実と推論を分離して読んでください。\n- 必要に応じて一次情報に当たって確認してください。\n`;
}

async function writeBrief(date, theme, markdown) {
  const dir = path.join(CONTENT_DIR, date);
  await mkdir(dir, { recursive: true });
  const relativePath = path.join("content", date, `${theme.id}.md`);
  await writeFile(path.join(ROOT, relativePath), markdown, "utf-8");
  return relativePath.replaceAll("\\", "/");
}

async function main() {
  const date = resolveBriefDate();
  const themes = (await readThemes()).filter((t) => t.is_active);
  const index = await readIndex();
  const newRecords = [];

  for (const theme of themes) {
    const allFeedUrls = [...theme.google_alert_rss, ...(theme.extra_rss ?? [])];
    const allItems = [];

    for (const feedUrl of allFeedUrls) {
      try {
        const items = await fetchRssItems(feedUrl);
        allItems.push(...items);
      } catch (error) {
        console.error(`[WARN] ${theme.id}: failed to fetch ${feedUrl}`, error.message);
      }
    }

    const dedupedMap = new Map();
    for (const item of allItems) {
      const normalized = normalizeUrl(item.link);
      if (dedupedMap.has(normalized)) continue;
      dedupedMap.set(normalized, {
        title: item.title,
        url: normalized,
        publishedAt: item.pubDate,
        summary: summarize(item),
        importance: estimateImportance(item.title)
      });
    }

    const finalItems = [...dedupedMap.values()].slice(0, 10);
    if (finalItems.length === 0) {
      console.warn(`[WARN] ${theme.id}: skipping brief generation for ${date} because no items were collected`);
      continue;
    }
    const markdown = renderMarkdown(date, theme, finalItems);
    const articlePath = await writeBrief(date, theme, markdown);

    newRecords.push({
      date,
      themeId: theme.id,
      themeName: theme.name,
      title: `${date} ${theme.name} 朝刊`,
      path: articlePath
    });

    console.log(`[OK] generated brief: ${articlePath} (${finalItems.length} items)`);
  }

  const merged = [...newRecords, ...index.items].filter(
    (item, idx, arr) => arr.findIndex((x) => x.date === item.date && x.themeId === item.themeId) === idx
  );

  if (newRecords.length === 0) {
    console.log("[OK] no new briefs generated; keeping existing index.json as-is");
    return;
  }
  await mkdir(path.dirname(INDEX_PATH), { recursive: true });
  await writeFile(
    INDEX_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), items: merged }, null, 2)}\n`,
    "utf-8"
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
