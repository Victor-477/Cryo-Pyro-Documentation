---
title: "Examples"
group: "Examples"
lead: "Complete programs you can run today, grouped by what you are trying to do."
---
Every example here is a **whole program**: save it as `demo.cryo` and run it with the command shown. Nothing is a fragment that needs assembling first.

## By what you are trying to do

<div class="card-grid">
  <a class="card" href="#/ex-core"><span class="card-emoji">🔢</span><h4>Core &amp; stdlib</h4><p>Math, strings, conversions, control flow.</p></a>
  <a class="card" href="#/ex-colecoes"><span class="card-emoji">🔪</span><h4>Collections</h4><p>Arrays, maps, slices and ranges as values.</p></a>
  <a class="card" href="#/ex-tipos"><span class="card-emoji">🧬</span><h4>Types</h4><p>Structs, enums, matching, generics and traits.</p></a>
  <a class="card" href="#/ex-funcoes"><span class="card-emoji">🧩</span><h4>Functions</h4><p>Lambdas, closures and functions as values.</p></a>
  <a class="card" href="#/ex-dados"><span class="card-emoji">📄</span><h4>Data &amp; errors</h4><p>JSON round-trips, try/catch and the <code>?</code> operator.</p></a>
  <a class="card" href="#/ex-modulos"><span class="card-emoji">📦</span><h4>Modules</h4><p>Split a program across files; <code>pub</code> and namespaces.</p></a>
  <a class="card" href="#/ex-programas"><span class="card-emoji">🖥️</span><h4>Interactive programs</h4><p>Whole terminal apps — input, loops, redraw.</p></a>
  <a class="card" href="#/ex-web"><span class="card-emoji">🌐</span><h4>Web</h4><p>REST APIs, pages, and the full-stack demo.</p></a>
  <a class="card" href="#/ex-ia"><span class="card-emoji">🤖</span><h4>AI &amp; agents</h4><p>Schemas, tools, the agent loop and skills.</p></a>
  <a class="card" href="#/ex-foreign"><span class="card-emoji">🔗</span><h4>Foreign &amp; backends</h4><p>Embedding Go, C or Node, and per-backend programs.</p></a>
  <a class="card" href="#/ex-catalogo"><span class="card-emoji">📚</span><h4>Full catalog</h4><p>Every file under <code>cryo/examples/</code>, with its backend.</p></a>
</div>

## Running one from the repository

```bash
python burnout/cryoc.py cryo/examples/example_agent_pedido.cryo --backend go --run
```

> Not sure which backend fits? Use `--backend auto` and the compiler picks the lightest one that covers the features your program uses.

## Which backend can run what

| If the example uses | Reach for |
|---|---|
| the core language, stdlib, collections, JSON | `pyro` — and it also runs on `go` and `node` |
| concurrency, LLM/agents, skills, machine access | `go` |
| a browser target | `wasm`, or [`--backend frontend`](#/frontend) for a page |
| a standalone binary | `pyro` then AOT ([native](#/nativo)), or `go` |

The [full catalog](#/ex-catalogo) lists the backend for every shipped example.

## Tests

The suites compile and run these programs on every generator:

```bash
python burnout/tests/test_smoke.py
python burnout/tests/test_cli.py
```
