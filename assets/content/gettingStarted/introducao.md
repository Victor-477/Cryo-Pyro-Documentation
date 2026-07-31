---
title: "Introduction"
group: "Getting Started"
lead: "Cryo is a programming language built from scratch — its own syntax, its own compiler, its own bytecode and its own virtual machines. Nothing here wraps an existing language or runtime."
---
The project is a language system in **three stages**, with two custom languages and a compiler in the middle:

<div class="pipeline">
  <div class="stage"><span class="st-tag">1 · write</span><h4>Cryo <code>.cryo</code></h4><p>The language you write — typed, high-level.</p></div>
  <div class="stage"><span class="st-tag">2 · compile</span><h4>Burnout</h4><p>lexer → parser → AST → code generator.</p></div>
  <div class="stage"><span class="st-tag">3 · run</span><h4>Pyro <code>.pyro</code></h4><p>Custom bytecode running on the Pyro VM (Go or C) — or compiled ahead of time into a native binary.</p></div>
</div>

The `.pyro` is compact and opaque (the code section is encoded), runs on the machine through the VM, and serves as **native training data for AI agents** — the AI reads instructions already in the form the machine executes.

## This is a real language, not a wrapper

The most common question about a new language is which existing one it is standing on. The answer here is none. Every stage was written for this project:

- The **grammar and the parser** are original — a hand-written recursive-descent parser, not a grammar handed to a parser generator.
- The **bytecode is an original instruction set** with its own binary container, documented down to the byte in [the `.pyro` format](#/pyro-formato) and [the instruction set](#/pyro-isa).
- The **virtual machine was written twice**, independently, in Go and in C — and the two are held to byte-identical output by a parity suite.
- The **compiler compiles itself.** The Cryo→Pyro compiler is written *in Cryo* and reaches a [fixed point](#/selfhost): the bytecode it emits is byte-identical whether it was built by the Python front-end or by itself.

> Cryo is not a dialect, a preprocessor, or a thin layer over Python. A `.cryo` file is parsed by a compiler written for it, lowered to an instruction set designed for it, and executed by a machine implemented for it. [What was actually built](#/construido) lists every piece, with the files, so the claim can be checked rather than taken on faith.

## Where to start

<div class="card-grid">
  <a class="card" href="#/instalacao"><span class="card-emoji">⚙️</span><h4>Installation</h4><p>Full Windows setup — Python, a C compiler, Go and Node.</p></a>
  <a class="card" href="#/inicio-fast"><span class="card-emoji">🚀</span><h4>Quick start</h4><p>Compile and run your first program in a minute.</p></a>
  <a class="card" href="#/exemplos"><span class="card-emoji">📦</span><h4>Examples</h4><p>Complete programs showing what the language can do.</p></a>
  <a class="card" href="#/sintaxe"><span class="card-emoji">📖</span><h4>The language</h4><p>Types, functions, control flow and operators.</p></a>
</div>

## New in v1.1.0

Phase 10 is complete. Everything below is additive — v1.1.0 runs v1.0.0 programs unchanged, and both VMs still load a v2 `.pyro`.

<div class="card-grid">
  <a class="card" href="#/api"><span class="card-emoji">🔌</span><h4>REST APIs</h4><p>Write the API in Cryo; compile it to a standalone <code>.exe</code>.</p></a>
  <a class="card" href="#/frontend"><span class="card-emoji">🎨</span><h4>Front-end pages</h4><p>HTML, JS and CSS blocks in a <code>.cryo</code> file — emitted as a page.</p></a>
  <a class="card" href="#/lambdas"><span class="card-emoji">🧩</span><h4>Closures on the VM</h4><p>Functions passed, stored, returned and captured — on Pyro itself.</p></a>
  <a class="card" href="#/arrays"><span class="card-emoji">🔪</span><h4>Slices &amp; ranges</h4><p><code>xs[a..b]</code> on arrays and strings; <code>0..5</code> as a value.</p></a>
  <a class="card" href="#/roadmap"><span class="card-emoji">🧬</span><h4>Generics &amp; traits</h4><p>Monomorphized <code>&lt;T&gt;</code>, plus <code>trait</code>/<code>impl</code> with static dispatch.</p></a>
  <a class="card" href="#/modulos"><span class="card-emoji">📦</span><h4>Namespaces</h4><p><code>import "geo.cryo" as geo;</code> with <code>geo::area(...)</code> and <code>pub</code>.</p></a>
</div>

## The platform

<div class="card-grid">
  <a class="card" href="#/selfhost"><span class="card-emoji">🔁</span><h4>Self-hosting</h4><p>The compiler is written in Cryo and reaches a fixed point.</p></a>
  <a class="card" href="#/nativo"><span class="card-emoji">⚡</span><h4>Native binaries</h4><p>AOT to a standalone executable — no VM, no runtime deps.</p></a>
  <a class="card" href="#/wasm"><span class="card-emoji">🕸️</span><h4>WebAssembly</h4><p>Compile Cryo to a <code>.wasm</code> module for the browser.</p></a>
  <a class="card" href="#/fullstack"><span class="card-emoji">🌐</span><h4>Full-stack</h4><p>Server (<code>http_serve</code>) and client (WASM), one language.</p></a>
</div>

## A taste

```cryo
schema Invoice { string customer; number total; string[] items; }
tool fn fetch_price(string sku) -> number ={ return 19.90; }

// typed, validated structured output
Invoice f = llm("gpt-x", "Extract the invoice: " + text) as Invoice;

// tool-calling loop: the model asks for tools, the runtime runs them
string r = agent("gpt-x", "Price of SKU-1 with 10% off?");
```

## The three languages

| Component | Role | Files |
|---|---|---|
| **Cryo** | Source language (front-end → AST) | `cryo/lexer.py`, `parser.py`, `ast_nodes.py` |
| **Burnout** | The compiler (CLI + code generators) | `burnout/cryoc.py`, `codegen_*.py` |
| **Pyro** | Target language (bytecode + VM) | `pyro/vm/main.go`, `main.c`, `PYRO_BYTECODE.md` |

## Closed loop

The system compiles and runs itself. The Cryo→Pyro compiler is **written in Cryo** ([self-hosting](#/selfhost)) and reaches a fixed point; a `.pyro` can be compiled ahead of time into a [standalone native binary](#/nativo); and the same language runs on the [server and in the browser](#/fullstack).

> **Language version:** v1.1.0. The **go** backend is the most complete (LLM, agents, concurrency); the **pyro** backend covers the whole core and is the route to native binaries; **wasm** targets the browser.
