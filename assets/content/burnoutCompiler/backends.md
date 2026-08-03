---
title: "Backends"
group: "The Burnout Compiler"
lead: "Six code generators from the same AST. Each covers a subset of the language."
---
## Coverage matrix

| Feature | Go (base) | Node | C | asm | Pyro | wasm |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| int/bool, arithmetic, bitwise | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| functions, recursion, if/while/for/switch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅³ |
| break/continue/assert | ✅ | ✅ | ✅ | ✅ | ✅ | ✅³ |
| number (double), dynamic string | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| arrays, enum | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| math/conversion/string builtins | ✅ | ✅ | ✅ (math) | ❌ | ✅ (NATIVE) | ❌ |
| struct | ✅ | ✅ | ✅ | ✅¹ | ✅ | ❌ |
| try/catch/finally | ✅² | ✅ | ✅ | ❌ | ✅ | ❌ |
| map `map<K,V>` | ✅ | ✅ | ✅⁴ | ❌ | ✅ | ❌ |
| optionals `T?` / null-safety | ✅ | ✅ | ✅⁵ | ❌ | ✅ | ❌ |
| native JSON | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| HTTP (`http_get`/`http_post`/`sleep`) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| serving (`http_serve`) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| concurrency, LLM, skills, `pyro_*` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AOT → standalone native binary | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| runs in the browser | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| foreign blocks | `>Go(...)` | `>Node(...)` | `>C(...)` | ❌ | ❌ | ❌ |

> **`--backend frontend`** is not in this matrix because it does not generate a program: it assembles [html/javascript/CSS blocks](#/frontend) into a **document**. Under `--emit pyro` it delegates the program's logic to the wasm column above.

¹ The `asm` backend supports **struct return in registers** (`int`/`bool` fields), per each ABI's classification. Large or by-value structs point to `--backend c`.

² On Go, `try/catch/finally` becomes `func(){ defer/recover }()`; `throw` becomes `panic`.

⁴ Since 11.27 the C backend has maps: an open-addressed hash table in the runtime, with keys and values of `int`, `number`, `string` or `bool`. Rendering and `keys()` order by the key's own **text**, matching the VM and the go/node backends — so `map<int,…>` prints `{1: …, 10: …, 2: …}`, which looks odd and is correct.

⁵ Also 11.27: `int?`, `number?`, `bool?` and `string?` are pointers, the same representation the go backend uses. An optional of a struct is still refused, by name.

³ The `wasm` backend targets a **numeric subset** (`int`/`bool` as `i64`) — see [WebAssembly](#/wasm). Anything outside it is **rejected at compile time** rather than silently mis-compiled.

## Backend go (default)

The most complete — the SaaS/LLM route. Requires only Go installed; the safety helpers (`cryoOr`, `cryoAssert`, `cryoAddOvf`…) are inlined in the `.go` itself, with no external runtime.

## Backend pyro

Generates the **custom bytecode** `.pyro`, run by the Pyro VM. Covers the language core (int/number/bool/string, functions, control flow, arithmetic/bitwise/logic, arrays/maps/structs, print and assert), **enums**, the **stdlib** (math, conversions, strings, `remove`, `input`) via `NATIVE`, and — since Phase 4 — **`try/catch/finally`, optionals (`??`/`x!`), string interpolation, modules and global constants**. See [the Pyro target language](#/pyro-formato).

## Backend node

Compiles the **Cryo core to JavaScript** (CommonJS) and runs it with `node` — no build step. Covers scalars, strings, bool, arrays, maps (objects), structs (objects), enums, functions, all control flow, operators, `print`/`assert`, JSON, and **JavaScript blocks/libraries** (`>Node( ... )` / `>JS( ... )` and `library >node fs<` → `require`).

```bash
python burnout/cryoc.py app.cryo --backend node --run
```

The backend does **type inference** to respect Cryo semantics: `int / int` yields integer division (truncates toward zero), while involving `number` yields floating-point division; and indexed access on **arrays and strings** (not maps) gets a **bounds-check** in safe mode — including **nested** read/write (`m[i][j]` becomes `cryoSetIndex(cryoIndex(m, i), j, v)`, checking both indices). Division by zero also aborts.

> LLM/agent features, concurrency (`spawn`/`await`) and machine access (`pyro_*`) are **not** covered by the node backend — use `--backend go`. The generator emits a clear error in those cases. There is no 64-bit integer (numbers are JavaScript `double`).

## Backends c and asm

Generate native C and x86-64 (two ABIs: System V and Win64). The `asm` backend emits a clear error pointing to `--backend c` when it hits a feature outside the native subset. Both use the `burnout/runtime/cryo_runtime.c` runtime.

## Backend wasm

Emits a **`.wasm` binary module directly** — no `wat2wasm`, no Emscripten, no external toolchain. Every function is exported, so JavaScript can call it. See [WebAssembly](#/wasm).

```bash
python burnout/cryoc.py client.cryo --backend wasm -o app.wasm
```

> Note that `pyro` and `wasm` are not competitors: `pyro` is the route to a **native binary** on the server, `wasm` the route to the **browser**. A single program can use both — that is what the [full-stack demo](#/fullstack) does.

## Automatic selection (--backend auto)

With `--backend auto`, the compiler **analyzes the program** and picks the ideal backend — optimizing processing by avoiding unnecessary toolchains:

```bash
python burnout/cryoc.py app.cryo --backend auto --run
# → automatic backend: pyro  (pure core — Pyro bytecode, lightest)
```

The choice follows the capabilities the code requires:

| The program uses... | Chosen backend |
|---|---|
| Only the core (scalars, arrays, maps, structs, functions, flow) | `pyro` (lightest) |
| concurrency, LLM, machine access, `spawn`/`await` | `go` |
| A `>Node( ... )` block | `node` |
| A `>C( ... )` block | `c` |
| A `>Go( ... )` block | `go` |

The analysis is **conservative**: it only recommends a backend that covers every feature used; when unsure, it uses `go` (superset). If the chosen backend still fails, the compiler **recompiles with `go`** automatically. Also on the API: `burnout.select_backend(ast)` and `burnout.compile_source(src, backend="auto")`.

## Interop (foreign blocks)

`>Go( ... )` (go target) and `>C( ... )` (c target) blocks embed native code, and `library >lang name<` pulls dependencies. A block is only accepted if its language was imported with `import >Lang<`. See the dedicated page: [Foreign blocks & libraries](#/estrangeiros).
