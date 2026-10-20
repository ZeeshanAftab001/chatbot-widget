// Tiny, safe markdown: escapes HTML first, then supports bold, italic, code, links (http/https), lists.
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

export function renderMarkdown(text = "") {
  const out = [];
  let list = null;
  const flush = () => {
    if (list) out.push(`<${list.tag}>${list.items.join("")}</${list.tag}>`);
    list = null;
  };
  for (const line of text.split("\n")) {
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    const m = ul || ol;
    if (m) {
      const tag = ul ? "ul" : "ol";
      if (!list || list.tag !== tag) { flush(); list = { tag, items: [] }; }
      list.items.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    flush();
    if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return out.join("");
}
