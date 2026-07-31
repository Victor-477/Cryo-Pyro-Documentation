---
title: "The full catalog"
group: "Examples"
lead: "Every example that ships with the project — 45 programs under `cryo/examples/` — with what each one demonstrates and the backends it runs on."
---
This is the complete list, generated from the directory rather than curated, so nothing shipped is missing from it. Run any of them the same way:

```bash
python burnout/cryoc.py cryo/examples/example_slices.cryo --backend pyro --run
```

> `--backend auto` picks the lightest backend that covers the features a program uses. Where a row lists several, the program produces the same output on each — that is the parity rule the project is built around.

## Language core

| Example | Demonstrates | Backends |
|---|---|---|
| `example_v2.cryo` | the expanded core: control flow, operators, functions | c |
| `example_v3.cryo` | the same core through the native C backend | c |
| `example_v4.cryo` | `switch`, bitwise ops, numeric literals, `assert`, `>C( ... )` | c |
| `example_go.cryo` | the full language on the Go backend | go |
| `example_bytecode.cryo` | the core lowered to `.pyro` and run on the VM | pyro |
| `example_stdlib.cryo` | math, strings, enums and conversions | pyro/go/node |
| `example_stdlib_ext.cryo` | `clamp`/`sign`/`gcd`/`hypot`, `starts_with`/`ends_with`/`repeat`, padding | pyro/go/node |
| `example_time_random.cryo` | `now_ms`, `monotonic_ms`, `seed`, `random`, `random_int` | pyro/go/node |

## Collections, ranges and comprehensions

| Example | Demonstrates | Backends |
|---|---|---|
| `example_containers.cryo` | arrays, maps and structs on the VM | pyro |
| `example_collections.cryo` | `sort`/`reverse`/`slice`/`index_of` — all non-mutating | pyro/go/node |
| `example_ranges.cryo` | range-based `for` (`a..b`, `a..=b`) on **every** backend | pyro/go/node/c/asm/wasm |
| `example_slices.cryo` | slicing (`xs[a..b]`, `s[a..]`) and ranges as values (`int[] r = 0..5`) | pyro/go/node |
| `example_higher_order.cryo` | `map`, `filter`, `reduce`, `find`, `any`, `all` | pyro/go/node |
| `test_phase10_3.cryo` | `enumerate`, `pairs`, list and map comprehensions | pyro/go/node |

## Types and abstraction

| Example | Demonstrates | Backends |
|---|---|---|
| `example_generics.cryo` | `fn max_of<T>`, `struct Pair<A,B>` by monomorphization | pyro/go/node |
| `example_traits.cryo` | `trait` + `impl` with static dispatch, and generic bounds | pyro/go/node |
| `example_struct.cryo` | a struct returned in registers | asm |

## Functions and closures

| Example | Demonstrates | Backends |
|---|---|---|
| `example_lambdas.cryo` | first-class functions, lambdas and closures | go/node |
| `example_funcvalues.cryo` | function values **on the Pyro VM** — pass, store, return, capture | pyro/go/node |
| `example_func_arrays.cryo` | arrays of function values | pyro/go/node |

## Data and errors

| Example | Demonstrates | Backends |
|---|---|---|
| `example_json.cryo` | typed `json_encode`/`json_decode` on the VM | pyro/go/node |
| `example_try.cryo` | error propagation with the `?` operator | pyro/go/node |
| `example_saas.cryo` | maps + JSON + optionals together | go |

## Modules

| Example | Demonstrates | Backends |
|---|---|---|
| `example_modules.cryo` | namespaced imports (`import "x" as ns`) and `pub` visibility | pyro/go/node |
| `example_geo.cryo` | a module with `pub` exports **and** private items | pyro/go/node |
| `lib_geometria.cryo` | the geometry module imported by the examples above | (library) |

## Interactive programs

Whole terminal applications, not snippets — the closest thing to "what does writing something real in this feel like".

| Example | Demonstrates | Backends |
|---|---|---|
| `example_calc.cryo` | an interactive calculator — `input()`, parsing, a loop | pyro/go |
| `example_chart.cryo` | a real-time bar chart redrawn in the terminal | pyro/go |
| `example_winupdate.cryo` | a progress-screen simulation — timing and redraw | pyro/go |

## Concurrency and network

| Example | Demonstrates | Backends |
|---|---|---|
| `example_http.cryo` | `http_get`/`sleep` as VM natives, plus JSON | pyro/go |
| `example_async.cryo` | `spawn`/`await` concurrency with HTTP | go |

## Web

| Example | Demonstrates | Backends |
|---|---|---|
| `api/server.cryo` | a REST API — struct payloads, validation, stats — as a standalone `.exe` | go |
| `frontend/app.cryo` | a web page written in Cryo; one vanilla file or `.html` + `app.wasm` | frontend |
| `fullstack/server.cryo` | a static server via the `http_serve` native | pyro |
| `fullstack/client.cryo` | the browser half, compiled to WebAssembly | wasm |

## AI, agents and machine access

| Example | Demonstrates | Backends |
|---|---|---|
| `example_llm.cryo` | `schema` + `llm ... as T` + `tool` | go |
| `example_agent.cryo` | the agent loop (tool-calling) | go |
| `example_agent_pedido.cryo` | an e-commerce agent with six tools | go |
| `example_agent_landpage.cryo` | an agent that creates and opens a landing page | go |
| `example_pyro.cryo` | native skills + machine access | go |

## Foreign blocks and embedding

| Example | Demonstrates | Backends |
|---|---|---|
| `example_foreign.cryo` | verified foreign blocks and libraries | go/c |
| `example_go_http.cryo` | a Go block using `net/http` via `library` | go |
| `example_node.cryo` | the Cryo core in JavaScript + `library >node os<` | node |
| `example_node_fs.cryo` | reading and writing a file via `library >node fs<` | node |
| `embedding/` | driving the compiler and VM from a host program | (Python) |

## Backend-specific

| Example | Demonstrates | Backends |
|---|---|---|
| `example_asm.cryo` | the integer subset compiled to x86-64 assembly | asm |

> Two names are worth explaining. `lib_geometria.cryo` is a **library**, imported by the module examples rather than run on its own. `test_phase10_3.cryo` keeps its development name; it is a working demonstration of comprehensions despite the prefix.
