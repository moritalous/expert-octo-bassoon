function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decodeEntities(text = "") {
  return text
    .replaceAll("&nbsp;", " ")
    .replaceAll("&middot;", "・")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function cleanText(text = "") {
  return decodeEntities(text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function renderInline(text = "") {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
  let html = "";
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const [full, label, markdownUrl, bareUrl] = match;
    const start = match.index ?? 0;
    html += escapeHtml(cleanText(text.slice(lastIndex, start)));

    if (markdownUrl) {
      html += `<a href="${escapeHtml(markdownUrl)}" target="_blank" rel="noreferrer">${escapeHtml(cleanText(label))}</a>`;
    } else if (bareUrl) {
      html += `<a href="${escapeHtml(bareUrl)}" target="_blank" rel="noreferrer">${escapeHtml(cleanText(bareUrl))}</a>`;
    }

    lastIndex = start + full.length;
  }

  html += escapeHtml(cleanText(text.slice(lastIndex)));
  return html;
}

function renderMetaValue(label, value) {
  if (label === "重要度") {
    const tone = value.toLowerCase();
    return `<span class="importance-badge importance-${escapeHtml(tone)}">${escapeHtml(value)}</span>`;
  }
  if (label === "出典") {
    return renderInline(value);
  }
  return renderInline(value);
}

export function markdownToHtml(markdown = "") {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inTopic = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  function closeTopic() {
    closeList();
    if (inTopic) {
      html.push("</section>");
      inTopic = false;
    }
  }

  for (const line of lines) {
    if (line.startsWith("### ")) {
      closeTopic();
      inTopic = true;
      html.push(`<section class="topic-card"><h3>${renderInline(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeTopic();
      html.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeTopic();
      html.push(`<h1>${renderInline(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push('<ul class="meta-list">');
        inList = true;
      }
      const content = line.slice(2);
      const metaMatch = content.match(/^([^:]+):\s*(.+)$/);
      if (metaMatch) {
        const [, rawLabel, rawValue] = metaMatch;
        const label = cleanText(rawLabel);
        const value = cleanText(rawValue);
        html.push(
          `<li class="meta-row"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${renderMetaValue(label, value)}</span></li>`
        );
      } else {
        html.push(`<li>${renderInline(content)}</li>`);
      }
      continue;
    }

    if (line.trim() === "") {
      closeList();
      continue;
    }

    closeList();
    html.push(`<p>${renderInline(line)}</p>`);
  }

  closeTopic();
  return html.join("\n");
}
