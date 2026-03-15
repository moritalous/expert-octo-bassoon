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

function parseMarkdownLink(text, startIndex) {
  if (text[startIndex] !== "[") {
    return null;
  }

  const labelEnd = text.indexOf("](", startIndex);
  if (labelEnd === -1) {
    return null;
  }

  const label = text.slice(startIndex + 1, labelEnd);
  let cursor = labelEnd + 2;
  let depth = 1;

  while (cursor < text.length) {
    const char = text[cursor];
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return {
          type: "markdown",
          start: startIndex,
          end: cursor + 1,
          label,
          url: text.slice(labelEnd + 2, cursor)
        };
      }
    }
    cursor += 1;
  }

  return null;
}

function parseBareUrl(text, startIndex) {
  const match = text.slice(startIndex).match(/^https?:\/\/[^\s<]+/);
  if (!match) {
    return null;
  }

  return {
    type: "bare",
    start: startIndex,
    end: startIndex + match[0].length,
    url: match[0]
  };
}

function renderInline(text = "") {
  let html = "";
  let cursor = 0;

  while (cursor < text.length) {
    const nextMarkdownStart = text.indexOf("[", cursor);
    const nextBareMatch = text.slice(cursor).match(/https?:\/\/[^\s<]+/);
    const nextBareStart = nextBareMatch ? cursor + (nextBareMatch.index ?? 0) : -1;
    const starts = [nextMarkdownStart, nextBareStart].filter((value) => value >= 0);

    if (starts.length === 0) {
      html += escapeHtml(cleanText(text.slice(cursor)));
      break;
    }

    const nextStart = Math.min(...starts);
    html += escapeHtml(cleanText(text.slice(cursor, nextStart)));

    const token =
      nextStart === nextMarkdownStart
        ? parseMarkdownLink(text, nextStart) ?? parseBareUrl(text, nextStart)
        : parseBareUrl(text, nextStart);

    if (!token) {
      html += escapeHtml(cleanText(text.slice(nextStart, nextStart + 1)));
      cursor = nextStart + 1;
      continue;
    }

    if (token.type === "markdown") {
      html += `<a href="${escapeHtml(token.url)}" target="_blank" rel="noreferrer">${escapeHtml(cleanText(token.label))}</a>`;
    } else {
      html += `<a href="${escapeHtml(token.url)}" target="_blank" rel="noreferrer">${escapeHtml(cleanText(token.url))}</a>`;
    }
    cursor = token.end;
  }

  return html;
}

function renderMetaValue(label, value) {
  if (label === "重要度") {
    const tone = value.toLowerCase();
    return `<span class="importance-badge importance-${escapeHtml(tone)}">${escapeHtml(value)}</span>`;
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
