---
title: "Language Server (LSP)"
group: "Ecosystem"
lead: "A native LSP server provides **diagnostics-as-you-type**, hover, go-to-definition and outline — reusing the compiler front-end."
---
The server ([`burnout/lsp.py`](https://github.com/Victor-477/Burnout)) speaks JSON-RPC over stdio, **with no dependencies** (Python stdlib only), and reuses the same lexer/parser/semantic-analysis as the compiler — so diagnostics are identical to those from compilation.

## Features

| Capability | What it does |
|---|---|
| **Diagnostics** | lexical, syntactic, **semantic** (variable/function/arity), module and foreign-block errors — published on open/edit |
| **Hover** | documentation for builtins and keywords; signatures of user functions/structs/enums |
| **Go to definition** | jumps to the declaration of a function/struct/enum |
| **Outline (documentSymbol)** | lists the file's functions, structs, enums and consts |

## In VS Code

The **Burnout Compiler** extension already includes a built-in LSP client (no `npm`): when a `.cryo` file is opened, it looks for `burnout/lsp.py` in the workspace and wires everything up automatically. Settings: `burnout.lsp.enabled` and `burnout.lspPath`.

## In other editors

Any editor with an LSP client can use it — the server command is:

```bash
python burnout/cryoc.py --lsp        # or: python burnout/lsp.py
```

Example (Neovim, `nvim-lspconfig` with a custom server): set `cmd = {"python", "path/burnout/lsp.py"}` and `filetypes = {"cryo"}`.

> The server is conservative: it only reports what is unambiguous (never rejects a valid program). It is the same analysis as the [semantic check](#/semantica).
