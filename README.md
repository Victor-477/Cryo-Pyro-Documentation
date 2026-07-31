# 📖 Cryo & Pyro Documentation Website

[![Documentation](https://img.shields.io/badge/Docs-Next.js--Style-blueviolet.svg)](index.html)
[![Dependencies](https://img.shields.io/badge/Dependencies-None-brightgreen.svg)](index.html)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, high-performance, **Next.js-style documentation website** for the Cryo language, Burnout compiler, and Pyro VM. Features sidebar navigation, search capabilities, syntax highlighting, a table of contents index, and a light/dark mode theme toggle — **completely static and lightweight** with zero external dependencies (no CDNs, no build processes).

---

## ✨ Features

* **Instant Search:** Press `Ctrl+K` (or `⌘+K`) or click the search box to search the entire documentation library instantly.
* **Responsive Layout:** Adaptive sidebar navigation, header, and table of contents that scale gracefully from mobile phones to ultra-wide displays.
* **Light / Dark Mode Toggle:** Smooth HSL-tailored thematic switch (Cryo "Ice" / Pyro "Fire" aesthetics) stored locally to persist choices.
* **Zero Dependencies:** Raw JavaScript-powered hash router, lightweight CSS layout, and a bundled client-side syntax highlighter for Cryo, C, Go, and JSON. Nothing to install, nothing to build.
* **Markdown Sources:** Every page is a plain `.md` file under `assets/content/`, loaded at runtime — edit a page, refresh, done.
* **Static Hosting:** Drop the folder on any static file server (GitHub Pages, nginx, `python -m http.server`). No backend, no build pipeline.

---

## 📂 Project Structure

```text
Cryo Pyro Documentation/
├── index.html            # Main HTML Shell & Layout structure
└── assets/
    ├── app.js            # Content loader, router, Markdown compiler, search, TOC
    ├── styles.css        # Responsive, variable-driven CSS theme rules
    ├── highlight.js      # Custom client-side syntax highlighting implementation
    └── content/          # The documentation itself — one .md file per page
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

Save the file and refresh the browser. There is no build step — `app.js` reads
`_nav.yaml`, fetches the pages it lists, and parses the frontmatter itself.

Because the pages are fetched, **the site must be served, not opened as a
`file://` path** — browsers block `fetch()` of local files. See
[Getting Started](#-getting-started) below. Opened from disk, the site says so
explicitly with the command to run; it does not fail silently.

A page's frontmatter `group` must match the group `_nav.yaml` lists it under —
the loader reports a mismatch rather than quietly using one of them.

---

## 🚀 Getting Started

Serve the folder — any static server will do:

```bash
cd "Cryo Pyro Documentation"
python -m http.server 8877
```

Then open **[http://localhost:8877](http://localhost:8877)**.

> Double-clicking `index.html` will **not** work. The pages are fetched from
> `assets/content/`, and every browser blocks `fetch()` under the `file://`
> protocol for security reasons. Opened that way the site tells you so and
> prints the command above, rather than showing an empty page.

---

## ✍️ Adding, moving and removing pages

Everything happens in `assets/content/`. Save, refresh, done — nothing to rebuild.

**Add a page.** Create `assets/content/<group>/<slug>.md` with the frontmatter
shown above, then add its slug to that group's `pages:` list in
[`_nav.yaml`](assets/content/_nav.yaml). `_nav.yaml` is what the loader reads,
so a page it does not list is never fetched and never appears.

**Reorder or move a page.** `_nav.yaml` alone decides the sidebar order *and*
the previous/next pager order; the file layout does not. To move a page between
groups, move the `.md` file into the other group's directory, move its slug in
`_nav.yaml`, and update the `group:` in its frontmatter — the loader checks
those last two agree and reports it if they don't.

**Rename a page.** Renaming the file changes its URL, since the slug *is* the
filename. Check for inbound `#/<old-slug>` links first; the checker below
reports the ones you miss.

Internal links use the hash router: `[Backends](#/backends)`, where the target
matches another page's slug.

### Checking your edits

Node can validate the content without a browser — this catches pages listed in
`_nav.yaml` that don't exist, `.md` files nothing links to, and dead internal
links:

```bash
node -e 'const fs=require("fs"),d="assets/content/",nav=fs.readFileSync(d+"_nav.yaml","utf8");let g=[],c=null;for(const l of nav.split(/\r?\n/)){const s=l.trim();if(!s||s[0]==="#")continue;if(s.startsWith("- title:"))g.push(c={dir:"",pages:[]});else if(s.startsWith("dir:"))c.dir=JSON.parse(s.slice(4).trim());else if(s.startsWith("pages:"))c.pages=JSON.parse(s.slice(6).trim())}let bad=0;const S=new Set(),F=new Map();for(const x of g)for(const p of x.pages){S.add(p);const f=d+x.dir+"/"+p+".md";fs.existsSync(f)?F.set(p,fs.readFileSync(f,"utf8")):(console.log("listed but missing:",f),bad++)}for(const x of g)for(const f of fs.readdirSync(d+x.dir))if(f.endsWith(".md")&&!S.has(f.slice(0,-3))){console.log("orphan (not in _nav.yaml):",x.dir+"/"+f);bad++}for(const[p,t]of F){const re=/#\/([a-z0-9-]+)/g;let m;while(m=re.exec(t))if(!S.has(m[1])){console.log("dead link:",p,"->",m[1]);bad++}}console.log(bad?bad+" problem(s)":"OK: "+S.size+" pages, all links resolve")'
```
