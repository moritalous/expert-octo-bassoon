const latestEl = document.getElementById("latest");
const listEl = document.getElementById("list");
const contentEl = document.getElementById("content");

function esc(str = "") {
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function markdownToHtml(md = "") {
  const lines = md.split(/\r?\n/);
  const html = [];
  let inList = false;

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3>${esc(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2>${esc(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1>${esc(line.slice(2))}</h1>`);
    } else if (line.startsWith("- ")) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${esc(line.slice(2))}</li>`);
    } else if (line.trim() === "") {
      if (inList) { html.push("</ul>"); inList = false; }
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<p>${esc(line)}</p>`);
    }
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

async function loadArticle(path) {
  contentEl.innerHTML = '<p class="muted">本文を読み込み中...</p>';
  try {
    const res = await fetch(path);
    const text = await res.text();
    contentEl.innerHTML = markdownToHtml(text);
  } catch (e) {
    contentEl.innerHTML = `<p class="muted">本文の読み込みに失敗しました: ${esc(String(e))}</p>`;
  }
}

async function main() {
  try {
    const res = await fetch("public/index.json");
    const data = await res.json();
    const items = [...(data.items || [])].sort((a, b) => `${b.date}${b.themeId}`.localeCompare(`${a.date}${a.themeId}`));

    if (items.length === 0) {
      latestEl.innerHTML = '<p class="muted">記事がまだありません。</p>';
      listEl.innerHTML = '<p class="muted">過去記事なし。</p>';
      return;
    }

    const latest = items[0];
    latestEl.innerHTML = `
      <h3>${esc(latest.title)}</h3>
      <p class="muted">${esc(latest.date)} / ${esc(latest.themeName)}</p>
      <button id="open-latest">本文を表示</button>
    `;
    document.getElementById("open-latest")?.addEventListener("click", () => loadArticle(latest.path));

    listEl.innerHTML = items.map((item) => `
      <div class="item">
        <strong>${esc(item.title)}</strong>
        <p class="muted">${esc(item.date)} / ${esc(item.themeName)}</p>
        <button data-path="${esc(item.path)}">本文を表示</button>
      </div>
    `).join("");

    listEl.querySelectorAll("button[data-path]").forEach((btn) => {
      btn.addEventListener("click", () => loadArticle(btn.getAttribute("data-path")));
    });

    await loadArticle(latest.path);
  } catch (e) {
    latestEl.innerHTML = `<p class="muted">indexの読み込みに失敗しました: ${esc(String(e))}</p>`;
  }
}

main();
