const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Marked } = require('marked');
const { normalizeSelfClosingAnchors, getHtmlIds } = require('./anchors');

const markdown = new Marked({ renderer: { html: normalizeSelfClosingAnchors } });

test('table anchors close before the following label in either form', () => {
  for (const anchor of ['<a id="rtfield-thc"></a>', '<a id="rtfield-thc"/>', "<a id='rtfield-thc' />"]) {
    const html = markdown.parse(`| Field | Meaning |\n| --- | --- |\n|${anchor}**\`THC:\`** | Plasma status |`);
    assert.match(html, /<a id=["']rtfield-thc["']\s*><\/a><strong><code>THC:<\/code><\/strong>/);
    assert.ok(getHtmlIds(html).has('rtfield-thc'));
  }
});

test('HTML IDs are collected without accepting examples or unrelated attributes', () => {
  const html = markdown.parse('<span id="plasma-status-letters"></span>\n\n<a ID=rtfield-in></a>\n\n`<a id="inline-example"/>`\n\n```html\n<a id="code-example"/>\n```\n\n<span data-id="wrong" title=" id=also-wrong"></span>');
  assert.deepEqual([...getHtmlIds(html)], ['plasma-status-letters', 'rtfield-in']);
  assert.match(html, /&lt;a id=&quot;inline-example&quot;\/&gt;/);
  assert.match(html, /&lt;a id=&quot;code-example&quot;\/&gt;/);
});

test('normalization preserves other tags and slashes inside quoted attributes', () => {
  const html = '<a title="a /> b" id="target"/><br/><img src="image.png"/>';
  assert.equal(normalizeSelfClosingAnchors(html), '<a title="a /> b" id="target"></a><br/><img src="image.png"/>');
});
