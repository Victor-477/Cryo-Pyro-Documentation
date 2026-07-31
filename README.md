# 📖 Cryo & Pyro Documentation Website

[![Documentation](https://img.shields.io/badge/Docs-Next.js--Style-blueviolet.svg)](index.html)
[![Dependencies](https://img.shields.io/badge/Dependencies-None-brightgreen.svg)](index.html)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, high-performance, **Next.js-style documentation website** for the Cryo language, Burnout compiler, and Pyro VM. Features sidebar navigation, search capabilities, syntax highlighting, a table of contents index, and a light/dark mode theme toggle — **completely static, lightweight, and offline-first** with zero external dependencies (no CDNs, no build processes).

---

## ✨ Features

* **Instant Search:** Press `Ctrl+K` (or `⌘+K`) or click the search box to search the entire documentation library instantly.
* **Responsive Layout:** Adaptive sidebar navigation, header, and table of contents that scale gracefully from mobile phones to ultra-wide displays.
* **Light / Dark Mode Toggle:** Smooth HSL-tailored thematic switch (Cryo "Ice" / Pyro "Fire" aesthetics) stored locally to persist choices.
* **Zero Dependencies:** Raw JavaScript-powered hash router, lightweight CSS layout, and a bundled client-side syntax highlighter for Cryo, C, Go, and JSON.
* **Offline First:** Open the website directly in any browser using the `file://` protocol or host it easily on any static file server.

---

## 📂 Project Structure

```text
Cryo Pyro Documentation/
├── index.html            # Main HTML Shell & Layout structure
├── tools/
│   └── build_content.py  # Builds assets/content.js from assets/content/
└── assets/
    ├── app.js            # Router, Markdown compiler, Search indexer, & TOC tracker
    ├── styles.css        # Responsive, variable-driven CSS theme rules
    ├── highlight.js      # Custom client-side syntax highlighting implementation
    ├── content.js        # GENERATED — do not edit
    └── content/          # The pages you actually edit
        ├── _nav.yaml     # Sidebar groups and page order
        ├── gettingStarted/
        │   ├── introducao.md
        │   └── ...
        ├── cryoLanguage/
        └── ...           # one directory per sidebar group
```

### ✍️ Editing the documentation

Each page is one Markdown file with YAML frontmatter, and **its filename is its
slug** — `cryoLanguage/erros.md` is the page at `#/erros`:

```markdown
---
title: "Error handling"
group: "The Cryo Language"
lead: "`try` / `catch` / `finally`, `throw` and `assert`."
---

## try / catch / finally
...
```

After editing, rebuild the bundle the browser loads:

```bash
python tools/build_content.py
```

```bash
python tools/build_content.py --check   # CI: fails if content.js is stale
```

**Why a build step and not 59 fetches?** Because this site is meant to open
from `file://`, and browsers refuse `fetch()` of local files there. Loading the
pages at runtime would work when served and silently show nothing when opened
from disk — breaking the offline-first promise for exactly the people reading
offline. So the Markdown files are the source, `content.js` is the artifact,
and there is still no dependency to install: the build uses only the Python
standard library.

The build also refuses two mistakes: a page that no `_nav.yaml` entry links to
(invisible to readers), and a page whose frontmatter `group` disagrees with the
group it is listed under.

---

## 🚀 Getting Started

### Option 1: Open Directly (Simple)
Simply double-click [`index.html`](index.html) or drag and drop it into your preferred web browser (Chrome, Firefox, Safari, Edge).

### Option 2: Host Locally (Recommended)
Hosting via a local server avoids browser-specific security policies regarding local file imports (`file://` constraints on certain browsers):

```bash
cd "Cryo Pyro Documentation"
python -m http.server 8877
```
Then open your browser and navigate to: **[http://localhost:8877](http://localhost:8877)**

---

## ✍️ Adding, moving and removing pages

Everything below happens in `assets/content/`. Never edit `assets/content.js` —
it is regenerated from these files and your changes would be overwritten.

**Add a page.** Create `assets/content/<group>/<slug>.md` with the frontmatter
shown above, then add its slug to that group's `pages:` list in
[`_nav.yaml`](assets/content/_nav.yaml). A page missing from `_nav.yaml` is not
silently ignored — the build refuses it, because nothing would link to it.

**Reorder or move a page.** `_nav.yaml` alone decides the sidebar order *and*
the previous/next pager order; the file layout does not. To move a page between
groups, move the `.md` file into the other group's directory, move its slug in
`_nav.yaml`, and update the `group:` in its frontmatter — the build checks
those last two agree.

**Rename a page.** Renaming the file changes its URL, since the slug *is* the
filename. Grep for `#/<old-slug>` first; the checker below reports links you
miss.

Then rebuild and refresh:

```bash
python tools/build_content.py
```

Internal links use the hash router: `[Backends](#/backends)`, where the target
matches another page's slug.

### Checking your edits

`content.js` is plain JavaScript, so Node can validate the generated bundle
without a browser — this catches pages missing from a group and dead internal
links:

```bash
node -e 'global.window={};require("./assets/content.js");const D=window.DOCS,s=new Set(D.pages.map(p=>p.slug));let bad=0;const g=new Set();for(const x of D.groups)for(const p of x.pages){g.add(p);if(!s.has(p)){console.log("missing page:",p);bad++}}for(const p of D.pages)if(!g.has(p.slug)){console.log("ungrouped:",p.slug);bad++}const re=/#\/([a-z0-9-]+)/g;for(const p of D.pages){let m;const t=(p.lead||"")+p.body;while(m=re.exec(t))if(!s.has(m[1])){console.log("dead link:",p.slug,"->",m[1]);bad++}}console.log(bad?bad+" problem(s)":"OK: "+D.pages.length+" pages, all links resolve")'
```
