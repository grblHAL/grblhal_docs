const HTML_TAG = /<[a-z][\w:-]*\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;

function normalizeSelfClosingAnchors(html) {
  // HTML anchors are not void elements; browsers ignore their self-closing slash.
  return html.replace(/<a\b((?:[^"'<>]|"[^"]*"|'[^']*')*?)\/>/gi, '<a$1></a>');
}

function getHtmlIds(html) {
  const ids = new Set();
  for (const tag of html.match(HTML_TAG) || []) {
    for (const match of tag.matchAll(/\s+([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      if (match[1].toLowerCase() === 'id') ids.add(match[2] ?? match[3] ?? match[4] ?? '');
    }
  }
  return ids;
}

module.exports = { normalizeSelfClosingAnchors, getHtmlIds };
