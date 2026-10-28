const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

test('site build accepts HTML targets, closes anchors, and rejects missing targets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-anchor-test-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.mkdirSync(path.join(root, 'content/markdown'), { recursive: true });
    for (const file of ['build-docs.js', 'anchors.js']) {
      fs.copyFileSync(path.join(__dirname, file), path.join(root, 'scripts', file));
    }
    const target = '---\ntitle: Fields\nslug: fields\n---\n# Fields {#field-list}\n\n| Field | Meaning |\n| --- | --- |\n|<a id="rtfield-thc"/>**`THC:`** | Plasma status |\n|<a id="rtfield-in"></a>**`In:`** | Inputs |\n';
    fs.writeFileSync(path.join(root, 'content/markdown/fields.md'), target);
    const linksFile = path.join(root, 'content/markdown/links.md');
    const links = '---\ntitle: Links\nslug: links\n---\n# Links\n\n[THC](fields.md#rtfield-thc) [In](/docs/fields#rtfield-in) [Short](./fields#rtfield-thc) [Heading](fields.md#field-list)\n';
    fs.writeFileSync(linksFile, links);
    const build = () => spawnSync(process.execPath, [path.join(root, 'scripts/build-docs.js'), '--prefix=/docs'], {
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: path.resolve(__dirname, '../node_modules') }
    });
    let result = build();
    assert.equal(result.status, 0, result.stderr);
    const html = fs.readFileSync(path.join(root, 'docs/fields/index.html'), 'utf8');
    assert.ok(html.includes('<a id="rtfield-thc"></a><strong><code>THC:</code></strong>'));
    const linksHtml = fs.readFileSync(path.join(root, 'docs/links/index.html'), 'utf8');
    assert.equal((linksHtml.match(/href="\/docs\/fields#rtfield-/g) || []).length, 3);
    fs.writeFileSync(linksFile, links + '\n[Missing](fields.md#missing-anchor)\n');
    result = build();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing anchor #missing-anchor/);
  } finally {
    // Only remove the temporary directory created by this test.
    fs.rmSync(root, { recursive: true, force: true });
  }
});
