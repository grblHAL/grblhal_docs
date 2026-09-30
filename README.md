# grblHAL Documentation

[![Build and publish documentation](https://github.com/grblHAL/grblhal_docs/actions/workflows/publish-docs.yml/badge.svg)](https://github.com/grblHAL/grblhal_docs/actions/workflows/publish-docs.yml)

Live documentation: [grblhal.org/docs](https://grblhal.org/docs)

This repository contains the Markdown source for the grblHAL documentation site.

## Documentation source

Markdown pages belong in `content/markdown/`. Images and other site assets belong in `content/images/`.

File and folder names are ordered by their numeric prefix:

```text
01-Getting-Started/
  01-what-is-grblhal.md
  02-grbl-vs-grblhal.md
```

## Contribute or suggest changes

Documentation improvements are welcome. To propose a change:

1. Fork [grblHAL/grblhal_docs](https://github.com/grblHAL/grblhal_docs) to your own GitHub account, then clone your fork.
2. Create a new branch in your fork for the change.
3. Install the project dependencies and start the local preview server:

   ```bash
   npm ci
   npm run dev
   ```

   Open the local URL printed in the terminal. The preview uses the same documentation generator as the published site.
   To use another port, run `npm run dev -- --port=3104`.
4. Edit files under `content/` using any text editor you prefer—Notepad, Notepad++, Visual Studio Code, or another editor.
5. Save your changes. The preview server rebuilds the site and refreshes the browser after each successful save, so you can review the rendered page as you work.
6. When you are happy with the result, commit the changes to your new branch and push it to your fork. Then open a pull request from that branch back to [grblHAL/grblhal_docs](https://github.com/grblHAL/grblhal_docs).

## Build and publish

The GitHub Actions workflow builds the HTML site from committed Markdown and publishes it to [grblhal.org/docs](https://grblhal.org/docs) whenever a change is merged into `main`.

The generated `docs/` folder is a build artifact and is intentionally not committed. To generate it locally:

```bash
npm ci
npm run build
```

The build preserves the existing navigation, search, Markdown rendering, syntax highlighting, wiki links, admonitions, table of contents, and responsive styling. Do not edit `docs/` directly.

## Markdown guide

Pages use [GitHub Flavored Markdown](https://github.github.com/gfm/) (GFM), plus the site-specific features below. Use standard Markdown for normal content; use the extensions only where they add value.

### Page metadata

Every page needs a short, stable `slug`. It defines the public address: `slug: reference/plugins` publishes at `/docs/reference/plugins`. The optional title is used in the navigation and browser title; `order` overrides filename ordering.

```md
---
slug: getting-started/connecting
title: Connecting a controller
order: 10
---
```

### Slug links

Choose a slug that describes the page's place in the documentation, using lowercase letters, numbers, hyphens, and `/`. Do not include `/docs` in the front matter. Slugs are public addresses, so keep them stable after publishing unless you deliberately want to replace an old link.

```md
slug: reference/plugins
```

Link to a page with `/docs/` followed by its slug. Link to a section by adding its heading ID. The build checks both the page and heading ID, so `npm run build` fails if an internal slug link is incorrect.

```md
[Plugins](/docs/reference/plugins)
[Plugin reference](/docs/reference/plugins#sienciatc)
```

Give sections that will be linked often a short, stable custom ID. Automatically generated IDs are fine for one-off links, but change when the heading text changes.

```md
## Sienci ATCi (Automatic Tool Changer Interface) {#sienciatc}
```

### Headings and links to sections

Use one `#` heading for the page title, then `##` through `######` for sections. Every heading receives a fragment link automatically. Give a heading a stable custom ID by adding `{#id}` at the end; IDs may contain letters, numbers, `_`, `-`, and `:`.

```md
# Connecting a controller

## USB connection {#usb-connection}

Link directly to the section: [USB connection](#usb-connection).
```

The page index includes all `##` headings. Add `<!-- toc -->` to include a selected `###` heading too:

```md
### Driver installation <!-- toc -->
```

### Paragraphs and inline formatting

Separate paragraphs with a blank line. Use the usual inline Markdown formatting:

```md
This is **bold**, *italic*, ~~struck through~~, and `inline code`.

A new paragraph starts after a blank line. End a line with a backslash\
to force a line break.
```

### Links and images

```md
[grblHAL on GitHub](https://github.com/grblHAL/core)

<https://grblhal.com>

![Controller wiring diagram](/images/controller-wiring.png)
```

Put image files in `content/images/`. Root-relative `/images/...` URLs work both locally and on the published `/docs` site. Relative links can be used to point to other source pages:

```md
[First connection](../01-Getting-Started/05-first-connection.md)
```

Reference links and escaped Markdown characters are also supported:

```md
[grblHAL documentation][docs]

[docs]: https://github.com/grblHAL/core

Write \*asterisks\* without italic formatting.
```

### Lists and task lists

```md
- Unordered item
  - Nested item

1. First step
2. Second step

- [x] Firmware downloaded
- [ ] Controller connected
```

### Quotes and callouts

Use a normal blockquote for quoted or supplementary text:

```md
> Always disconnect power before changing controller wiring.
```

For a highlighted callout, use one of `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, or `CAUTION`:

```md
> [!WARNING]
> Disconnect machine power before wiring the controller.
```

### Admonition panels

Admonitions support `note`, `tip`, `warning`, `danger`, and `info`. A title in square brackets is optional.

````md
:::tip[Back up your settings]
Save a copy of your settings before updating firmware.

You can use **Markdown** inside the panel.
:::
````

### Code

Wrap short commands or setting names in backticks. Use fenced code blocks for longer examples; adding a language enables syntax highlighting when it is recognised.

````md
Use `$I` to request controller information.

```gcode
G21
G0 X0 Y0
```
````

### Tables and horizontal rules

Tables are scrollable on smaller screens. Use three or more hyphens in the header separator; colons align a column.

```md
| Setting | Default | Description |
|:--------|:-------:|------------:|
| `$10`   | `1`     | Status report mask |
| `$22`   | `0`     | Homing enabled |

---
```

### Wiki links

Use a wiki link to link to another documentation page by its filename (without `.md`) or its path below `content/markdown/`. Add `|` to choose the link text.

```md
[[01-Getting-Started/05-first-connection|Follow the first-connection guide]]

[[05-first-connection]]
```

Unresolved wiki links are shown as broken links in the generated site, making them easy to spot.

### HTML

Raw HTML supported by GFM is passed through, which is useful for the occasional detail that Markdown cannot express. Keep it minimal and prefer Markdown where possible.

```md
<details>
<summary>Show advanced notes</summary>

This content is initially collapsed.
</details>
```
