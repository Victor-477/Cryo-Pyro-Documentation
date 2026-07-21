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
└── assets/
    ├── app.js            # Router, Markdown compiler, Search indexer, & TOC tracker
    ├── styles.css        # Responsive, variable-driven CSS theme rules
    ├── highlight.js      # Custom client-side syntax highlighting implementation
    └── content.js        # Core documentation pages, written in raw Markdown
```

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

## ✍️ Editing the Documentation

All pages, headings, and descriptions are stored inside [`assets/content.js`](assets/content.js).

To add, edit, or remove sections:
1. Open [`assets/content.js`](assets/content.js) in your text editor.
2. Locate the `PAGES` array which contains structured objects representing each documentation page:
   ```javascript
   {
     slug: "language-overview",
     group: "Language",
     title: "Overview",
     lead: "A guide to Cryo language principles.",
     body: `
   # Overview
   Write markdown directly here...
     `
   }
   ```
3. Update the `groups` sorting array at the bottom of the file to adjust sidebar order.
4. Refresh the page in your browser. The search index and sidebars update automatically on reload.
