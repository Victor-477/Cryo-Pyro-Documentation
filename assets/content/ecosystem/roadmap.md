---
title: "Roadmap"
group: "Ecosystem"
lead: "The implementation plan for Cryo and Pyro to grow until they support **large projects** — in phases, each with a clear goal."
---
The canonical file is [`ROADMAP.md`](https://github.com/Victor-477) at the project root. Summary:

## Phase 4 — Language robustness (CRYO) — ✅ done

- ✅ **Cryo modules** ([`import "file.cryo"`](#/modulos)) — dedup, nested imports, cycle and name-clash detection
- ✅ **String interpolation** (`"total: ${x}"`) on the pyro/go/node backends
- ✅ **Global constants on Pyro** (compile-time inlining)
- ✅ **`try/catch/finally` and optionals** (`??`/`x!`) on the Pyro VM
- ✅ **[Prior semantic analysis](#/semantica)** (variable/function/arity/`break`) with line, the same on every backend
- ✅ **Character iteration** (`for (string c in s)`) consistent across the 3 backends

## Phase 5 — Competitive Pyro (strong VM) — ✅ done

- ✅ **Native `input()` on the Pyro VM**
- ✅ **Native JSON on the Pyro VM** (`json_encode`/`json_decode`)
- ✅ **Native HTTP on the Pyro VM** (`http_get`/`http_post`/`sleep`)
- ✅ **Bytecode optimizer** (constant folding, dead-code, peephole, constant prune; `--no-opt` disables)
- ✅ **i32 jumps + debug info** (`.pyro` v2 format, pc → line, readable *stack traces*)
- ⬜ Faster dispatch (benchmark against Python/Lua) — future work

## Phase 6 — Tools for large projects — ✅ done

- ✅ **[LSP](#/lsp)** (diagnostics-as-you-type, hover, go-to-definition, outline) — native server + client embedded in VS Code
- ✅ **[Formatter](#/formatador)** (`cryoc fmt`, whitespace-only and idempotent)
- ✅ **[Audit hardening](#/seguranca)** — taint analysis (source→sink), hardcoded-secret detection and `--strict` (CI gate on HIGH findings)
- ✅ **Test framework** (`test fn` + `cryoc test`), **REPL** (`cryoc repl` / `pyro repl`)
- ✅ **Package manager** (`cryo.toml`), **VM debugger**, **examples CI**

## Phase 7 — Scale and new targets — ✅ done

- ✅ **[Runtime sandbox](#/seguranca)** (`--sandbox`) — pyro **and** go backends refuse network/machine operations; policy baked into the artifact or set at runtime with `PYRO_SANDBOX=1`
- ✅ **[WASM backend](#/wasm)** — emits a `.wasm` module directly (no `wat2wasm`/Emscripten); numeric subset, structured control flow, all functions exported; verified against the VM in Node
- ✅ **`spawn`/`await` on the Pyro VM** (cooperative scheduler)
- ✅ **Streaming LLM**, agent loop and validated structured output

## Phase 8 — A complete, attractive language — ✅ done

Closing the gaps that make a programmer reach for another language. Ordered by value × dependency; each item ships with tests on the three main backends (pyro/go/node) and keeps **Pyro at parity**.

| # | Feature | Why it attracts |
|---|---|---|
| 8.1 | ✅ **[First-class functions + lambdas](#/lambdas)** (`fn(T)->U` values, `(x) => x+1`, closures) — go/node/pyro done | `map`/`filter`/`reduce`, callbacks, comparators |
| 8.2 | ✅ **Enums with data + pattern matching** (`enum Result { Ok(int), Err(string) }`, `match` with destructuring + exhaustiveness) — go/node/pyro | Algebraic data types — model states without `null` |
| 8.3 | ✅ **[Error propagation `?`](#/erros)** (`int v = parse(s)?;` early-returns the `Err`) — go/node/pyro | Error ergonomics without verbose `try/catch` |
| 8.4 | ✅ **Generics** (`fn f<T>`, `struct Par<A,B>`, monomorphized) | Typed collections/utilities without duplication |
| 8.5 | ✅ **Iterators, ranges & comprehensions** (`0..n`, `enumerate`, `[x*2 for x in xs]`) | Concise, expressive loops |
| 8.6 | ✅ **Expanded standard library** (array `map/filter/sort/reduce`, string, `time`, `random`) | Batteries included — fewer external deps |
| 8.7 | ✅ **Module namespaces + alias** (`import "geo.cryo" as geo`, `pub`) | Large projects without name clashes |
| 8.8 | ✅ **Interfaces/traits** (structural contracts, static dispatch) | Polymorphism without inheritance; bounds for generics |

## Phase 9 — Self-hosted Pyro (compilation independent of other languages) — ✅ done

The Pyro route used to depend on **Python** (the compiler) and **Go** (the VM). This phase removed both, turning Pyro into a closed system that compiles and runs itself — shippable as a single binary.

| # | Item | Description |
|---|---|---|
| 9.1 | ✅ **Pyro VM in C** | Full single-file C VM ([`pyro/vm/main.c`](#/pyro-vm)) built by the same gcc/MinGW/MSVC toolchain as the c/asm backends — drops the **Go** dependency for running `.pyro`. Full parity with the Go VM: every opcode and every NATIVE builtin, with the harness comparing **stdout + stderr + exit code** across the examples and abort/try-catch cases (byte-identical messages and stack traces) |
| 9.2 | ✅ **Minimal Pyro runtime** | Runtime isolated into its own unit (`pyro/vm/pyro_runtime.h`+`.c`): value model, refcount, strings/arrays/maps, conversions, I/O and the NATIVE builtins — the engine (`main.c`) depends only on the header, across the `fatal()`/`pyro_sandboxed` boundary. Specified in `PYRO_RUNTIME.md`, and now shared by the C VM **and** the AOT |
| 9.3 | ✅ **[Cryo→Pyro compiler written in Cryo](#/selfhost)** | Lexer (token-identical to the reference), parser (AST-identical) and a single-pass codegen, all in Cryo, running on the VM. Covers the full `codegen_pyro` language subset: scalars, every operator and precedence level, all control flow, functions and recursion, containers, enums-with-data + `match`, `try`/`catch`, optionals and string interpolation |
| 9.4 | ✅ **Fixed-point bootstrap** | The compiler compiles **itself**: a feature-rich program yields a byte-identical `.pyro` whether the codegen was built by the Python front-end or by itself (`sha256(P_A) == sha256(P_B)`). Getting there required bitwise operators, `break`/`continue`, and a `charCode` fix for control characters that had been silently corrupting the self-compiled lexer |
| 9.5 | ✅ **[AOT: `.pyro` → native](#/nativo)** | `burnout/aot_pyro.py` lowers bytecode to C against the Pyro runtime — one C function per Pyro function, jump targets as `goto` labels — producing binaries with no VM and no `.pyro` at runtime. `try`/`catch`/`throw` unwind across C frames via `setjmp`/`longjmp` over a global machine state, so unwinding is leak-free |
| 9.6 | ✅ **Single-entry `pyro` CLI** | One command over the whole toolchain: `pyro build` (native binary), `run` (native, else VM), `vm`, `c`. Auto-detects the C compiler and the VM; accepts `.cryo` or `.pyro` |
| 9.7 | ✅ **Standalone front-end + [full-stack](#/fullstack)** | `pyroc.cryo` becomes a real CLI program via the `read_file`/`args` natives — compiling without Python — and AOT-compiles into a native `pyroc`. `http_serve` makes a Cryo program a web server, and the [WASM backend](#/wasm) puts Cryo in the browser. The C runtime gained the same natives, so all three engines agree byte-for-byte, including on HTTP responses |

Sequence: **9.1 → 9.2** freed execution from Go; **9.3 → 9.4** freed compilation from Python (with a fixpoint proof); **9.5 → 9.6** delivered the native route and the single binary; **9.7** removed the last Python dependency and closed the loop end to end. Pyro is now a self-sufficient target — written, compiled and executed inside its own ecosystem.

> **What building the native path taught us.** Compiling and linking for real surfaced four bugs the whole test suite had missed. Float `SUB` was computing `x * y` — invisible because the front-end constant-folds literal-only expressions, so `1.0 - 1.0` never reached the runtime; it only showed up as corrupted float constants once the self-hosted compiler (whose IEEE-754 mantissa loop subtracts `1.0` per bit) started emitting them. `APPEND` peeked the array instead of popping it, desyncing the stack wherever a `push` sat inside one branch of an `if`. `index_get` handed out array elements as borrowed references that callers then released, freeing them in place. And `strdup`/`_popen`/`_pclose`/`read_i32` were implicitly declared, which truncates pointers on 64-bit hosts. Each now has a regression test — the lesson being that a test suite is only as good as the paths it actually reaches.

## Phase 10 — Modern language features & a richer standard library — ✅ done

Bringing Cryo up to the everyday ergonomics of Python/Rust/Kotlin/Swift/TypeScript. This phase **builds** the language-completeness ideas from Phase 8, now with the golden rule from day one: every feature lands with **Pyro parity** and tests, never go-only.

| # | Item | Status |
|---|---|---|
| 10.1 | **[Range-based for](#/controle-de-fluxo)** — `for (int i in a..b)` / `a..=b`, lowered in the front-end so it runs on every backend | ✅ done |
| 10.2 | **[Collection operations](#/builtins)** — `sort`/`reverse`/`slice`/`index_of`/`concat`/`count`/`sum`, all non-mutating, plus the function-taking `map`/`filter`/`reduce`/`find_first`/`any`/`all` once 10.6 landed. Go VM == C VM | ✅ done |
| 10.3 | **Iterators, `enumerate`, `pairs` & comprehensions** — `for (i, v) in enumerate(xs)`, `[f(x) for x in xs if c]` and map comprehensions, desugared to plain loops so every backend gets them | ✅ done |
| 10.4 | **[Extended standard library](#/builtins)** — `clamp`/`sign`/`gcd`/`hypot`, `starts_with`/`ends_with`/`repeat`, `pad_start`/`pad_end`, `concat`/`count`/`sum`, plus `now_ms`/`monotonic_ms`/`random`/`random_int`/`seed`. Natives with go/node/pyro parity (Go VM == C VM) | ✅ done |
| 10.5 | **Generics** — `fn max_of<T>(T a, T b)`, `struct Pair<A,B>`, resolved by compile-time **monomorphization** (`T` → `int`, mangled to `max_of__int`). Concrete declarations are generated before analysis, so every backend gains generics with no backend change | ✅ done |
| 10.6 | **[Function values & closures on the Pyro VM](#/lambdas)** — done: `PUSHFN`/`CALL_VALUE`/`CLOSURE` opcodes, a `kFunc`/`VAL_FUNC` value kind in both VMs, and a C function-pointer table in the AOT. Functions are passed, stored, returned and **captured**; capture is by value, so a captured variable must be effectively final (which is what keeps pyro identical to go/node) | ✅ done |
| 10.7 | **Interfaces / traits** — `trait Printable { ... }` + `impl Printable for Person`, lowered at compile time to mangled functions (`Person__to_str(Person this)`) with **static dispatch**. Includes generic bounds `<T: Printable>`. Zero VM or backend changes | ✅ done |
| 10.8 | **[Module namespaces & visibility](#/modulos)** — `import "geo.cryo" as geo;` with `geo::area(...)`, and `pub` to mark the exported surface — large projects without name clashes | ✅ done |
| 10.9 | **[Ranges & slices as values](#/arrays)** — `xs[a..b]` / `[a..=b]` / `[a..]` / `[..b]` on arrays **and strings**, and `a..b` as a value outside a `for`. Desugared in the front end; `for (int i in a..b)` still compiles to a counted loop and allocates nothing | ✅ done |
| 10.10 | **[Postfix calls `f(a)(b)`](#/lambdas)** — was a silent mis-parse (`print(p(1)(10))` became `print(p(1), 10)`). Argument lists are now strict, and a chained call is a real `CallValueExpr` lowered to `CALL_VALUE` | ✅ done |
| 10.11 | **[Structure of front-end](#/frontend)** — html/javascript/CSS blocks wrapped in functions to give them names, composed with `>html( ... )<script = ..., style = ...>`. Slots are checked against the block's **language**, so swapping `script` and `style` is a compile error, not a blank page | ✅ done |
| 10.12 | **[Structure parameters for foreign blocks](#/estrangeiros)** — the `<k = v>` tail works on **every** foreign language (`>Java( ... )<util = helper>`), and each value must resolve to a real declaration — otherwise the typo would surface from javac or gcc instead of from Cryo | ✅ done |
| 10.13 | **[Different HTML outputs](#/frontend)** — `--backend frontend` with `--emit html` (one self-contained vanilla file, zero subresource requests) or `--emit pyro` (an `.html` shell plus `app.wasm`, the program's own Cryo functions running in the browser) | ✅ done |

**Phase 10 is complete.** The arc: **10.1–10.4** delivered day-to-day collection and stdlib ergonomics; **10.5–10.7** added abstraction power (generics, closures, traits); **10.8** scaled to large codebases; **10.9** rounded out ranges and slices; **10.10** fixed a silent mis-parse found along the way; **10.11–10.13** made a `.cryo` file able to *be* a web page. Each is a feature mainstream languages make programmers reach for — delivered with Pyro parity, so nothing is locked to the go backend.

## Phase 11 — Applications, Safety and Intelligence — ✅ done

Phase 10 finished the **language**. Phase 11 made it something you can **build** with, and hardened it.

### Track A — what applications need from the language

| Item | Description |
|---|---|
| 11.1 | ✅ **Mutable module state** — top-level `var` accessible across all functions, `GETGLOBAL`/`SETGLOBAL` opcodes in VM, Go package scope hoist |
| 11.2 | ✅ **Struct methods without a trait** — `impl Person { fn greet() }`, lowering to monomorphic functions |
| 11.3 | ✅ **[Richer string formatting](#/sintaxe)** — `${value:.2f}`, alignment, fill, thousands separators, percent, string truncation. Desugared in front end |
| 11.4 | ✅ **[Error ergonomics](#/erros)** — `match` guards and `or_else` unblocked |
| 11.5 | ✅ **[Iteration protocol](#/controle-de-fluxo)** — `for (k, v in map)` directly, and any type made iterable by implementing `iter()` |

### Track B — full applications on the Pyro VM

| Item | Description |
|---|---|
| 11.6 | ✅ **HTTP Server** — `http_listen`, `http_accept`, `http_respond` loop, REST APIs in pure Cryo |
| 11.7 | ✅ **Filesystem & process natives** — `list_dir`, `make_dir`, `delete_file`, `file_size`, `write_file`, `env`, `exec`, all sandbox-gated |
| 11.8 | ✅ **Persistence** — `write_file_atomic` and JSON document store in pure Cryo (`store.cryo`) |
| 11.9 | ✅ **Application packaging** — `pyro app build` / `--assets DIR`: one executable with embedded assets |
| 11.10 | ✅ **Reference application** — `cryo/examples/taskapp/` with HTTP API, browser UI, persistence and auth in pure Cryo |

### Track C — security of the code and the machine

| Item | Description |
|---|---|
| 11.11 | ✅ **Capability-based sandbox** — `PYRO_POLICY` with fine-grained capability grants |
| 11.12 | ✅ **Declared permissions, checked twice** — compile-time check and runtime enforcement |
| 11.13 | ✅ **Harden the `.pyro` loader** — bounds checking on all offsets and counts |
| 11.14 | ✅ **Integrity & signing** — reproducible builds and HMAC-SHA256 signature verification |
| 11.15 | ✅ **Extend the audit** — unvalidated deserialization, unbounded allocation, TOCTOU paths |

### Track D — the LLM layer: control and better answers

| Item | Description |
|---|---|
| 11.16 | ✅ **[Generation controls](#/schema)** — `temperature`, `top_p`, `max_tokens`, `stop`, `seed`, `timeout` |
| 11.17 | ✅ **[Streaming](#/schema)** — `for (string token in llm_stream(…))` lazy token generation |
| 11.18 | ✅ **[Validated structured output with repair](#/schema)** — JSON repair and schema validation |
| 11.19 | ✅ **[Resilience](#/schema)** — retry with exponential backoff and `llm_try` |
| 11.20 | ✅ **[Agent loop upgrades](#/agent)** — parallel tool execution, tool errors as values, context window limits |

### Track E — Burnout: optimization and compiler resources

| Item | Description |
|---|---|
| 11.21 | ✅ **[Beyond peephole](#/pyro-formato)** — AST-level optimization (constant/copy propagation, dead code elimination, inlining) |
| 11.22 | 🟡 **Faster dispatch** — measured guards and dispatch loop benchmarks |
| 11.23 | ✅ **[Incremental compilation](#/pyro-isa)** — module parse cache and build artifact cache |
| 11.24 | ✅ **[Diagnostics](#/erros)** — multiline error rendering with carets and suggestions |
| 11.25 | ✅ **Debugging and profiling** — interactive debugger and sampling profiler |

### Close-out from Phase 10

| Item | Description |
|---|---|
| 11.26 | ✅ **[`replace` with an empty needle](#/builtins)** — canonical VM behavior across all engines |
| 11.27 | ✅ **C backend gaps** — maps, optionals, array stringification closed |
| 11.28 | ✅ **Self-hosted compiler parity** — lexer and parser parity with reference compiler |

## Phase 12 — From a language to a toolchain — ✅ done

Phase 11 asked *"can I ship this?"*. Phase 12 asks *"can a team work in it?"*.

| Item | Description |
|---|---|
| 12.1 | ✅ **A test framework in the language** — `test fn name() ={ … }` and `cryoc test file.cryo`. `test` is a **contextual** keyword; runner is a front-end lowering |
| 12.2 | ✅ **REPL** — `cryoc repl` and `pyro repl`. Declarations persist, bare expressions evaluate directly, `:load` support |
| 12.3 | ✅ **[Packages](#/pacotes)** — `cryo.toml`, `cryo.lock` and `import "@dep/file.cryo"`. Content-based lock pinning |
| 12.4 | ✅ **CI over the examples** — every example compiled on each backend with output agreement assertions |
| 12.5 | ✅ **[Concurrency in the VM](#/concorrencia)** — `spawn`/`await` on cooperative single-threaded scheduler |
| 12.6 | ✅ **[Self-hosted parser: the rest](#/selfhost)** — try/catch/finally, switch, lambdas, map literals, casts, imports, traits, spawn/await |
| 12.7 | ✅ **Stale phase tables reconciled** — all phases aligned with reality |
| 12.8 | ✅ **Dynamic `assert` message** — expression evaluated on failure on all backends |
| 12.9 | ✅ **[Payload-less enum member as a value](#/structs-enums)** — `E e = A;` and `Status.ATIVO` work on all four backends |
| 12.10 | ✅ **[`json_encode` key order](#/json)** — keys sorted by text across all backends |
| 12.11 | ✅ **[A future can be awaited twice](#/concorrencia)** — avoids deadlock on Go backend |
| 12.12 | ✅ **[`assert` made consistent](#/erros)** — lazy evaluation and consistent error reporting |
| 12.13 | ✅ **[One out-of-bounds message](#/seguranca)** — unified canonical message across all engines |

## Phase 13 — Proving it, at scale — ✅ done

Phase 12 asked *"can a team work in it?"*. Phase 13 asks *"can the system find its own defects?"*

| Item | Description |
|---|---|
| 13.1 | ✅ **Differential testing** — random deterministic Cryo program generator (`difftest.py`) with automatic test case shrinking |
| 13.2 | ✅ **[Self-hosted semantic analysis](#/selfhost)** — `semantic.cryo` refuses invalid programs at compile-time |
| 13.3 | ✅ **[Generics in the self-hosted parser](#/selfhost)** — type parameters on `fn` and `struct` with bounds, type arguments at call sites |
| 13.4 | ✅ **Performance profiling & pre-sized operand stack** — 11% faster dispatch loop, stack overflow protection |
| 13.5 | 🟡 **[Standard library gaps](#/builtins)** — `lines`, `chars`, `title_case`, `trim_start`, `trim_end` front-end lowerings |
| 13.6 | ✅ **[Parser error recovery](#/semantica)** — statement boundary error recovery without cascading noise |

## Phase 14 — Contact with someone else — in progress

Phase 13 asked *"can the system find its own defects?"*. Phase 14 asks *"does it survive contact with someone else?"*. Removing the words "on this machine" from the claims already made.

| Item | Description | Status |
|---|---|---|
| 14.1 | **CI on foreign hardware** — `.github/workflows/ci.yml` (Ubuntu, `gcc`, `go` 1.21, `node` 20, Python 3.12) + `Burnout/tests/run_all.py` with `--require` flag | 🟡 written |
| 14.2 | **A clean clone, on a machine with nothing on it** — `pip install .` and repo build verification | ⬜ planned |
| 14.3 | **POSIX portability** — non-Windows platform execution, LF normalization, path separators | ⬜ planned |
| 14.4 | **The first hour, followed literally** — clean setup and tutorial validation from scratch | ⬜ planned |
| 14.5 | **A second opinion on the numbers** — cross-platform VM and compiler benchmarks | ⬜ planned |

## Principles

1. **Modules first** — no large project fits in one file.
2. **Pyro parity with Go** — each phase shrinks the "use --backend go" list.
3. **A good error is a feature** — position, actionable message and a backend suggestion.
4. **A feature ships only with tests** — the suite grows with it.
5. **The docs follow the code** — every feature updates this site.

