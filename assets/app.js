const heroEl = document.getElementById("hero");
const listEl = document.getElementById("list");
const contentEl = document.getElementById("content");
const articleTitleEl = document.getElementById("article-title");
const articleMetaEl = document.getElementById("article-meta");

let selectedPath = null;
let articleState = [];

function esc(str = "") {
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function formatDate(dateText) {
  const value = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(value.getTime())) {
    return dateText;
  }
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(value);
}

function formatDateTime(dateText) {
  const value = new Date(dateText);
  if (Number.isNaN(value.getTime())) {
    return "不明";
  }
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo"
  }).format(value);
}

function extractArticleMeta(md = "", fallback = {}) {
  const lines = md.split(/\r?\n/);
  const plainParagraphs = lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("- "));
  const lead = plainParagraphs[0] ?? "";
  const countMatch = lead.match(/ニュースを\s+(\d+)\s+件/);
  const topics = [];
  let currentTopic = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("### ")) {
      currentTopic = {
        title: line.slice(4).replace(/^\d+\.\s*/, ""),
        summary: "",
        importance: ""
      };
      topics.push(currentTopic);
      continue;
    }

    if (!currentTopic) {
      continue;
    }

    if (line.startsWith("- 要約:")) {
      currentTopic.summary = line.replace("- 要約:", "").trim();
    } else if (line.startsWith("- 重要度:")) {
      currentTopic.importance = line.replace("- 重要度:", "").trim();
    }
  }

  const highlights = topics
    .map((topic) => topic.summary || topic.title)
    .filter(Boolean)
    .slice(0, 3);

  return {
    title: lines.find((line) => line.startsWith("# "))?.slice(2).trim() || fallback.title || "Morning Brief",
    lead: lead || "本日の記事サマリーは準備中です。",
    count: countMatch ? Number(countMatch[1]) : topics.length,
    highlights,
    topics
  };
}

function markdownToHtml(md = "") {
  const lines = md.split(/\r?\n/);
  const html = [];
  let inList = false;

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${esc(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${esc(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${esc(line.slice(2))}</h1>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${esc(line.slice(2))}</li>`);
    } else if (line.trim() === "") {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    } else {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<p>${esc(line)}</p>`);
    }
  }

  if (inList) {
    html.push("</ul>");
  }

  return html.join("\n");
}

function renderHero(latest, generatedAt) {
  const meta = latest.meta;
  const highlights = meta.highlights.length
    ? meta.highlights.map((item) => `<li>${esc(item)}</li>`).join("")
    : '<li>要点は本文から確認してください。</li>';

  heroEl.innerHTML = `
    <div class="hero-copy">
      <p class="section-label">Latest Edition</p>
      <h2>${esc(meta.title)}</h2>
      <p class="hero-summary">${esc(meta.lead)}</p>
      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">テーマ</span>
          <strong>${esc(latest.themeName)}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">掲載件数</span>
          <strong>${esc(String(meta.count))} 件</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">更新日</span>
          <strong>${esc(formatDate(latest.date))}</strong>
        </div>
      </div>
    </div>
    <div class="hero-highlights card inset-card">
      <p class="section-label">Quick Take</p>
      <ul>${highlights}</ul>
      <p class="muted">生成時刻: ${esc(formatDateTime(generatedAt))}</p>
      <button id="open-latest" class="primary-action" type="button">最新号を読む</button>
    </div>
  `;

  document.getElementById("open-latest")?.addEventListener("click", () => selectArticle(latest.path));
}

function renderList() {
  listEl.innerHTML = articleState.map((item) => {
    const summary = item.meta.highlights[0] || item.meta.lead;
    const isActive = item.path === selectedPath;

    return `
      <button
        class="brief-card${isActive ? " active" : ""}"
        data-path="${esc(item.path)}"
        type="button"
        aria-pressed="${isActive ? "true" : "false"}"
      >
        <span class="brief-card-date">${esc(formatDate(item.date))}</span>
        <strong>${esc(item.title)}</strong>
        <span class="brief-card-meta">${esc(item.themeName)} / ${esc(String(item.meta.count))} 件</span>
        <span class="brief-card-summary">${esc(summary)}</span>
      </button>
    `;
  }).join("");

  listEl.querySelectorAll("[data-path]").forEach((button) => {
    button.addEventListener("click", () => selectArticle(button.getAttribute("data-path")));
  });
}

async function loadArticle(item) {
  articleTitleEl.textContent = item.title;
  articleMetaEl.textContent = `${formatDate(item.date)} / ${item.themeName} / ${item.meta.count} 件`;
  contentEl.innerHTML = '<p class="muted">本文を読み込み中...</p>';

  try {
    const res = await fetch(item.path);
    const text = await res.text();
    contentEl.innerHTML = markdownToHtml(text);
  } catch (error) {
    contentEl.innerHTML = `<p class="muted">本文の読み込みに失敗しました: ${esc(String(error))}</p>`;
  }
}

async function selectArticle(path) {
  const item = articleState.find((entry) => entry.path === path);
  if (!item) {
    return;
  }

  selectedPath = item.path;
  renderList();
  await loadArticle(item);
}

async function main() {
  try {
    const res = await fetch("public/index.json");
    const data = await res.json();
    const items = [...(data.items || [])].sort((a, b) => `${b.date}${b.themeId}`.localeCompare(`${a.date}${a.themeId}`));

    if (items.length === 0) {
      heroEl.innerHTML = '<p class="muted">記事がまだありません。</p>';
      listEl.innerHTML = '<p class="muted">過去号はまだありません。</p>';
      contentEl.innerHTML = '<p class="muted">記事が生成されると、ここに本文を表示します。</p>';
      return;
    }

    articleState = await Promise.all(items.map(async (item) => {
      try {
        const res = await fetch(item.path);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const text = await res.text();

        return {
          ...item,
          meta: extractArticleMeta(text, item)
        };
      } catch (_error) {
        return {
          ...item,
          meta: {
            title: item.title,
            lead: "要約を取得できませんでした。本文から内容を確認してください。",
            count: 0,
            highlights: ["この号の要点は本文の読み込み時に確認してください。"],
            topics: []
          }
        };
      }
    }));

    const latest = articleState[0];
    renderHero(latest, data.generatedAt);
    await selectArticle(latest.path);
  } catch (error) {
    heroEl.innerHTML = `<p class="muted">index の読み込みに失敗しました: ${esc(String(error))}</p>`;
    listEl.innerHTML = "";
    contentEl.innerHTML = '<p class="muted">記事一覧を取得できませんでした。</p>';
  }
}

main();
