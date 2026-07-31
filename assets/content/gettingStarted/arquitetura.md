---
title: "Architecture"
group: "Getting Started"
lead: "How a `.cryo` file becomes execution — from source text to bytecode running on the VM."
---
## The compilation path

```text
  write             compile (Burnout)                    run
 .cryo   ─────►   lexer → parser → AST → codegen   ─────►   .pyro + VM   ─────►  output
                            │                                   │
                            │                                   └─► AOT ─► native binary
     alternative targets: Go (.go) · Node (.js) · C (.c) · x86-64 (.s) · WebAssembly (.wasm)
```

1. **Lexer** (`cryo/lexer.py`) — turns the text into a list of tokens.
2. **Parser** (`cryo/parser.py`) — builds the AST (syntax tree) from the tokens.
3. **Audit** (`cryo/security.py`, optional) — walks the AST looking for risks.
4. **Codegen** (`burnout/codegen_*.py`) — emits the chosen target.
5. **Toolchain** — the Pyro VM (Go **or** C) runs the `.pyro`; or `go`/`gcc`/`node` handles the other targets; or the [AOT](#/nativo) turns the `.pyro` into a standalone binary.

There is also a **second front-end**: the same compiler [written in Cryo](#/selfhost), which runs on the VM and needs no Python. Both produce byte-identical bytecode.

## Components on disk

```text
Pyro_Cryo/
├── cryo/       # CRYO    — the source language: lexer, parser, AST, analysis
│   ├── selfhost/   # the same compiler, written in Cryo
│   └── examples/   # examples, including examples/fullstack/
├── burnout/    # Burnout — the compiler: cryoc.py, pyro.py, codegens, aot_pyro.py, tests
├── pyro/       # PYRO    — the target language: Go VM, C VM + runtime, bytecode spec
└── build/      # generated artifacts (.pyro, .go, .c, .s, binaries) — git-ignored
```

The dependency is direct: **Burnout** consumes the **CRYO** front-end and, for the pyro target, produces code for the **PYRO VM**.

## Six targets, one front-end

The same AST feeds six code generators. You pick with `--backend`:

| Backend | Output | For what |
|---|---|---|
| `go` (default) | `.go` → Go binary | Full language: LLM, agents, concurrency |
| `pyro` | `.pyro` (bytecode) → VM or [native](#/nativo) | The custom target language; compact and portable |
| `node` | `.js` → run with Node | Cryo core in JavaScript (CommonJS) |
| `c` | `.c` → binary via gcc | Core + structs/arrays in native C |
| `asm` | `.s` → binary via gcc | x86-64 (System V and Win64) |
| `wasm` | `.wasm` → browser | [Numeric subset](#/wasm), runs client-side |

See [Backends](#/backends) for the full coverage matrix.
