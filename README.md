# Cryo · Burnout · Pyro — Documentation Website

Documentation website for the **Cryo** language, **Burnout** compiler, and **Pyro** bytecode, in the style of Next.js documentation: sidebar navigation, "on this page" index, search (Ctrl/⌘ + K), light/dark theme, and syntax highlighting — all **static and without external dependencies** (no CDNs, no build steps).

## How to Open

**Option 1 — Open the file directly**

Double-click `index.html` (or drag it into your browser).

**Option 2 — Local server** (recommended; avoids `file://` restrictions)

```bash
cd "Cryo Pyro Documentation"
python -m http.server 8877
# open http://127.0.0.1:8877 in your browser
```

## Structure

```
Cryo Pyro Documentation/
├── index.html            # page shell (topbar, sidebar, content, TOC)
└── assets/
    ├── styles.css        # design (Cryo/ice + Pyro/fire theme, light and dark)
    ├── highlight.js      # syntax highlighting (cryo, bash, go, c, json)
    ├── content.js        # ALL documentation content (markdown per page)
    └── app.js            # hash routing, markdown rendering, search, TOC
```

## Editing Content

All text lives in [`assets/content.js`](assets/content.js), as a list of pages. Each page has a `slug`, `group`, `title`, `lead`, and a markdown `body`. The navigation order (and the previous/next footer) follows the `groups` array at the end of the same file.

The content was written based on the source code of the language (`cryo/lexer.py`, `cryo/parser.py`, Burnout's `codegen_*.py`, the VM in `pyro/vm/main.go`, and the examples in `cryo/examples/`).

## Sections

- **Getting Started** — introduction, architecture, installation, quick start
- **The Cryo Language** — syntax, types, functions, control flow, operators, structs/enums, arrays, maps, optionals, JSON, errors
- **Concurrency & Network** — `spawn`/`await`/`future`, HTTP
- **LLM & Agents** — schema, tools, the `agent` loop, real LLM, skills, machine
- **Burnout Compiler** — the CLI, backends, security
- **Pyro — Bytecode & VM** — `.pyro` format, ISA, the VM
- **Reference** — builtins, keywords, examples
