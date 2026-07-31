---
title: "VS Code extensions"
group: "Ecosystem"
lead: "Three extensions cover the system in the editor: **Cryo** (language), **Pyro** (bytecode) and **Burnout** (the compiler)."
---
## The three extensions

| Folder | Extension | What it does |
|---|---|---|
| `cryo-vscode` | **Cryo Lang** | Syntax highlighting, snippets and config for the `.cryo` language |
| `pyro-vscode` | **Pyro Bytecode** | Disassembly highlighting (`.pyasm`) + a command to disassemble `.pyro` |
| `burnout-vscode` | **Burnout Compiler** | Compile/run commands, audit, tokens/AST + diagnostics + LSP |

## Cryo Lang

Highlights the full language syntax — types, `schema`/`tool`/`skill`, `spawn`/`await`, LLM builtins (`llm`, `agent`, `schema_of`), network (`http_get`, `sleep`) and machine (`pyro_open`, `pyro_write_file`). Includes snippets for `fn`, `struct`, `schema`, `tool`, `agent`, `llm`, `spawn`, `map`, `try` and more.

## Pyro Bytecode

The `.pyro` is binary, so the value is in the **disassembly**. The extension highlights the disassembly text (`.pyasm`) and adds the command:

- **Pyro: Disassemble .pyro** — right-click a `.pyro` (or use the palette); runs `disasm_pyro` and opens the readable listing in a new tab.

Settings: `pyro.pythonPath`, `pyro.burnoutPath`.

## Burnout Compiler

Brings the compiler into the editor:

| Command | Action |
|---|---|
| Compile and run | default backend + `--run` (`Ctrl+Alt+R`) |
| Compile (choose backend) | menu go / pyro / c / asm / node |
| Security audit | `--audit` in the Burnout panel |
| Disassemble bytecode | `--dis` of the generated `.pyro` |
| Show AST / tokens | front-end inspection |

Compiler errors (lexical/syntactic/codegen) become **squiggles** at the correct line and column, via the `$burnout` problem matcher. There is also a `burnout` **task provider** for `tasks.json`. It also embeds the [Language Server](#/lsp) (diagnostics-as-you-type, hover, go-to-definition, outline).

Settings: `burnout.pythonPath`, `burnout.compilerEntry`, `burnout.defaultBackend`, `burnout.safeMode`, `burnout.lsp.enabled`, `burnout.lspPath`.

## Installing the extensions

To develop/test, open the extension folder in VS Code and press **F5** (opens an *Extension Development Host* window). To package and install:

```bash
npm install -g @vscode/vsce
cd cryo-vscode && vsce package        # produces a .vsix
code --install-extension cryo-lang-v2-0.9.0.vsix
```

> The **Burnout Compiler** extension locates the compiler automatically: it looks for `burnout/cryoc.py` in the workspace and, if not found, uses `python -m burnout` (the [installed package](#/biblioteca)).
