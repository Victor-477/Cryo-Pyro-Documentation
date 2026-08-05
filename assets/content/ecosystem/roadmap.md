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

## Phase 6 — Tools for large projects — in progress

- ✅ **[LSP](#/lsp)** (diagnostics-as-you-type, hover, go-to-definition, outline) — native server + client embedded in VS Code
- ✅ **[Formatter](#/formatador)** (`cryoc fmt`, whitespace-only and idempotent)
- ✅ **[Audit hardening](#/seguranca)** — taint analysis (source→sink), hardcoded-secret detection and `--strict` (CI gate on HIGH findings)
- ⬜ Test framework (`test fn` + `cryoc test`), REPL
- ⬜ Package manager (`cryo.toml`), VM debugger, examples CI

## Phase 7 — Scale and new targets

- ✅ **[Runtime sandbox](#/seguranca)** (`--sandbox`) — pyro **and** go backends refuse network/machine operations; policy baked into the artifact or set at runtime with `PYRO_SANDBOX=1`
- ✅ **[WASM backend](#/wasm)** — emits a `.wasm` module directly (no `wat2wasm`/Emscripten); numeric subset, structured control flow, all functions exported; verified against the VM in Node
- ⬜ `spawn`/`await` on the Pyro VM
- ⬜ Streaming LLM; LLM/agent on the Pyro VM

## Phase 8 — A complete, attractive language — planned

Closing the gaps that make a programmer reach for another language. Ordered by value × dependency; each item ships with tests on the three main backends (pyro/go/node) and keeps **Pyro at parity**.

| # | Feature | Why it attracts |
|---|---|---|
| 8.1 | ✅ **[First-class functions + lambdas](#/lambdas)** (`fn(T)->U` values, `(x) => x+1`, closures) — go/node done; pyro in Phase 9 | `map`/`filter`/`reduce`, callbacks, comparators |
| 8.2 | ✅ **Enums with data + pattern matching** (`enum Result { Ok(int), Err(string) }`, `match` with destructuring + exhaustiveness) — go/node/pyro | Algebraic data types — model states without `null` |
| 8.3 | ✅ **[Error propagation `?`](#/erros)** (`int v = parse(s)?;` early-returns the `Err`) — go/node/pyro | Error ergonomics without verbose `try/catch` |
| 8.4 | **Generics** (`fn f<T>`, `struct Par<A,B>`, monomorphized) | Typed collections/utilities without duplication |
| 8.5 | **Iterators, ranges & comprehensions** (`0..n`, `enumerate`, `[x*2 for x in xs]`) | Concise, expressive loops |
| 8.6 | **Expanded standard library** (array `map/filter/sort/reduce`, string, `time`, `random`) | Batteries included — fewer external deps |
| 8.7 | **Module namespaces + alias** (`import "geo.cryo" as geo`, `pub`) | Large projects without name clashes |
| 8.8 | **Interfaces/traits** (structural contracts, static dispatch) | Polymorphism without inheritance; bounds for generics |

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

## Phase 10 — Modern language features & a richer standard library — in progress

Bringing Cryo up to the everyday ergonomics of Python/Rust/Kotlin/Swift/TypeScript. This phase **builds** the language-completeness ideas from Phase 8, now with the golden rule from day one: every feature lands with **Pyro parity** and tests, never go-only.

| # | Item | Status |
|---|---|---|
| 10.1 | **[Range-based for](#/controle-de-fluxo)** — `for (int i in a..b)` / `a..=b`, lowered in the front-end so it runs on all six backends | ✅ done |
| 10.2 | **[Collection operations](#/builtins)** — `sort`/`reverse`/`slice`/`index_of`/`concat`/`count`/`sum`, all non-mutating, plus the function-taking `map`/`filter`/`reduce`/`find_first`/`any`/`all` once 10.6 landed. Go VM == C VM | ✅ done |
| 10.3 | **Iterators, `enumerate`, `pairs` & comprehensions** — `for (i, v) in enumerate(xs)`, `[f(x) for x in xs if c]` and map comprehensions, desugared to plain loops so every backend gets them | ✅ done |
| 10.4 | **[Extended standard library](#/builtins)** — `clamp`/`sign`/`gcd`/`hypot`, `starts_with`/`ends_with`/`repeat`, `pad_start`/`pad_end`, `concat`/`count`/`sum`, plus `now_ms`/`monotonic_ms`/`random`/`random_int`/`seed`. Natives with go/node/pyro parity (Go VM == C VM) | ✅ done |
| 10.5 | **Generics** — `fn max_of<T>(T a, T b)`, `struct Pair<A,B>`, resolved by compile-time **monomorphization** (`T` → `int`, mangled to `max_of__int`). Concrete declarations are generated before analysis, so all six backends gain generics with no backend change | ✅ done |
| 10.6 | **[Function values & closures on the Pyro VM](#/lambdas)** — done: `PUSHFN`/`CALL_VALUE`/`CLOSURE` opcodes, a `kFunc`/`VAL_FUNC` value kind in both VMs, and a C function-pointer table in the AOT. Functions are passed, stored, returned and **captured**; capture is by value, so a captured variable must be effectively final (which is what keeps pyro identical to go/node) | ✅ |
| 10.7 | **Interfaces / traits** — `trait Printable { ... }` + `impl Printable for Person`, lowered at compile time to mangled functions (`Person__to_str(Person this)`) with **static dispatch**. Includes generic bounds `<T: Printable>`. Zero VM or backend changes | ✅ done |
| 10.8 | **[Module namespaces & visibility](#/modulos)** — `import "geo.cryo" as geo;` with `geo::area(...)`, and `pub` to mark the exported surface — large projects without name clashes | ✅ done |
| 10.9 | **[Ranges & slices as values](#/arrays)** — `xs[a..b]` / `[a..=b]` / `[a..]` / `[..b]` on arrays **and strings**, and `a..b` as a value outside a `for`. Desugared in the front end; `for (int i in a..b)` still compiles to a counted loop and allocates nothing | ✅ done |
| 10.10 | **[Postfix calls `f(a)(b)`](#/lambdas)** — was a silent mis-parse (`print(p(1)(10))` became `print(p(1), 10)`). Argument lists are now strict, and a chained call is a real `CallValueExpr` lowered to `CALL_VALUE` | ✅ done |
| 10.11 | **[Structure of front-end](#/frontend)** — html/javascript/CSS blocks wrapped in functions to give them names, composed with `>html( ... )<script = ..., style = ...>`. Slots are checked against the block's **language**, so swapping `script` and `style` is a compile error, not a blank page | ✅ done |
| 10.12 | **[Structure parameters for foreign blocks](#/estrangeiros)** — the `<k = v>` tail works on **every** foreign language (`>Java( ... )<util = helper>`), and each value must resolve to a real declaration — otherwise the typo would surface from javac or gcc instead of from Cryo | ✅ done |
| 10.13 | **[Different HTML outputs](#/frontend)** — `--backend frontend` with `--emit html` (one self-contained vanilla file, zero subresource requests) or `--emit pyro` (an `.html` shell plus `app.wasm`, the program's own Cryo functions running in the browser) | ✅ done |

**Phase 10 is complete.** The arc: **10.1–10.4** delivered day-to-day collection and stdlib ergonomics; **10.5–10.7** added abstraction power (generics, closures, traits); **10.8** scaled to large codebases; **10.9** rounded out ranges and slices; **10.10** fixed a silent mis-parse found along the way; **10.11–10.13** made a `.cryo` file able to *be* a web page. Each is a feature mainstream languages make programmers reach for — delivered with Pyro parity, so nothing is locked to the go backend.

## Phase 11 — Applications, Safety and Intelligence — planned

Phase 10 finished the **language**. Phase 11 is about what you can **build** with it.

The honest summary of where things stand: you can write a *program* in Cryo, but not yet an *application* without reaching for a foreign block. The [REST API example](#/api) proves it — its rules are Cryo, but its state and routing live in a `>Go( ... )` block, because the VM cannot hold mutable state across functions and cannot hand a request back to Cryo code.

### Track A — what applications need from the language

| Item | Description |
|---|---|
| 11.1 | **Mutable module state.** A top-level `int[] store = [];` is *not visible inside functions* today — top-level statements are lowered into `main`, so the semantic pass reports `undeclared variable`. This one gap is why every stateful example needs a foreign block, and **all of Track B depends on fixing it** |
| 11.2 | **Struct methods without a trait** — `impl Person { ... }`, no trait ceremony for a one-off type |
| 11.3 | ✅ **[Richer string formatting](#/sintaxe)** — `${value:.2f}`, alignment, fill, thousands separators, percent, string truncation. Desugared in the front end from existing builtins, so no new native and identical output on pyro/go/node |
| 11.4 | 🟡 **[Error ergonomics](#/erros)** — [`match` guards](#/erros) shipped (lowered in the front end, so all three backends match); `?` on a `Result` shape already worked. The `or_else` default form is held back: it needs `any` to reach a typed context, which the go backend does not yet allow |
| 11.5 | ✅ **[Iteration protocol](#/controle-de-fluxo)** — `for (k, v in map)` directly, and any type made iterable by implementing `iter()`. Also fixed a pre-existing defect: `for (k, v in pairs(m))` had never compiled on the go backend |

### Track B — full applications on the Pyro VM

The headline track: make the VM somewhere to **ship** software. Every item lands on the Go VM, the C VM *and* the AOT route together — that is the parity invariant, and it is what makes the result a deployment target rather than a demo.

| Item | Description |
|---|---|
| 11.6 | **`http_api(port, handler)` — a real HTTP server.** `http_serve` is a *static file server*; it has no per-request handler, so routing, methods, bodies and computed responses are unreachable. A native taking a **Cryo function value** closes it. The pieces exist — function values landed in 10.6 — the work is a re-entrant callback through three engines. **Highest-value item in the phase** |
| 11.7 | **Filesystem & process natives** — `list_dir`, `mkdir`, `remove`, `stat`, `env`, `exec`, all sandbox-gated |
| 11.8 | **Persistence** — atomic writes plus a JSON document store, so an app survives a restart without a database |
| 11.9 | **Application packaging** — `pyro app build`: one executable with assets embedded |
| 11.10 | **A reference application written entirely in Cryo**, no foreign blocks — the proof, and the way to find what is still missing |

### Track C — security of the code and the machine

Today the sandbox is one on/off switch per native: the right shape for a demo, the wrong shape for running someone else's code.

| Item | Description |
|---|---|
| 11.11 | **Capability-based sandbox** — filesystem confined to declared paths, network to an allowlist, `exec` to named binaries; deny by default, and say *which* capability was missing |
| 11.12 | **Declared permissions, checked twice** — the program declares what it needs; the compiler rejects an undeclared capability and the runtime enforces the same list |
| 11.13 | **Harden the `.pyro` loader** — it parses untrusted binary input in C, which makes it the most exposed surface in the project. Bounds-check every offset, fuzz it, treat a crash as a release blocker |
| 11.14 | **Integrity** — optional signing verified on load, and reproducible builds (the bootstrap fixed point already proves those are achievable) |
| 11.15 | ✅ **Extend the audit** — unvalidated deserialization, unbounded allocation from input, TOCTOU on paths, over-broad permission grants. Taint scoped per function, and the `--strict` gate repaired: it had been comparing against a renamed level, so it never actually fired |

### Track D — the LLM layer: control and better answers

| Item | Description |
|---|---|
| 11.16 | ✅ **[Generation controls](#/schema)** — `temperature`, `top_p`, `max_tokens`, `stop`, `seed` and `timeout`, passed as a checked map literal. Option names are validated at compile time, and `timeout` bounds the caller rather than being sent to the provider |
| 11.17 | ✅ **[Streaming](#/schema)** — `for (string token in llm_stream(…))`, tokens delivered as they arrive. Lazy by design: the `iter()` protocol would have to buffer the whole completion first |
| 11.18 | ✅ **[Validated structured output with repair](#/schema)** — `as T` used to hand back a zero-valued struct for any reply that did not fit, indistinguishable from a real answer. The reply is now validated against the schema and re-asked with the problem named, bounded by a `repair` budget |
| 11.19 | ✅ **[Resilience](#/schema)** — retries confined to what can actually improve, with exponential backoff and `Retry-After`; a 4xx no longer costs three round trips. `llm_try` turns a failure into a value you can `match` on instead of an empty string |
| 11.20 | ✅ **[Agent loop upgrades](#/agent)** — tools asked for in one step run in parallel; a failing tool is a value the model can read instead of the end of the run (an aborting tool used to kill the program); the step budget has a defined outcome; and long runs stay inside the context window |

### Track E — Burnout: optimization and compiler resources

| Item | Description |
|---|---|
| 11.21 | ✅ **[Beyond peephole](#/pyro-formato)** — a new AST pass runs before code generation, so constant/copy propagation, dead-local elimination and inlining reach every backend; the old peephole was pyro-only and three instructions wide |
| 11.22 | 🟡 **Faster dispatch** — the benchmark suite landed and did its job. Computed-goto threading was built and passed every correctness gate, then measured **3% slower** overall (and 71% slower on string-heavy work), so it was reverted. The numbers are tracked in `Pyro/BENCHMARKS.md` |
| 11.23 | ✅ **[Incremental compilation](#/pyro-isa)** — a parse cache per module and an artifact cache per build, both content-keyed. An unchanged rebuild does 10× less work; the key includes the compiler's own source, so editing a code generator cannot return the previous version's output |
| 11.24 | ✅ **[Diagnostics](#/erros)** — every error in a pass, each shown against its own source line with a caret under the offending name, and a did-you-mean when a close one exists |
| 11.25 | ✅ **Debugging and profiling** — breakpoints over the existing pc→line table, and a sampling profiler |

### Close-out from Phase 10

| Item | Description |
|---|---|
| 11.26 | `replace(s, "", rep)` returns three different answers across the Go VM, the C VM and node — a live parity violation needing a semantics decision first |
| 11.27 | C backend gaps: maps, optionals, printing an array |
| 11.28 | The self-hosted compiler trails the Python front end on the newest syntax |

**Sequence.** 11.1 first — it unblocks Track B entirely. Then 11.6, which is what turns the VM into an application platform. 11.10 should start early and stay in progress: building something real is the only reliable way to discover what the other items missed.

> Phase 10 asked *"can the language express this?"*. Phase 11 asks *"can I ship this, run it safely, and trust what it returns?"*.

## Phase 12 — From a language to a toolchain

Phase 11 asked *"can I ship this?"*. Phase 12 asks *"can a team work in it?"*.

| Item | Description |
|---|---|
| 12.1 | ✅ **A test framework in the language** — `test fn name() ={ … }` and `cryoc test file.cryo`. `test` is a **contextual** keyword, so `int test = 0;` still compiles; the runner is a front-end lowering, so the same suite behaves identically on every backend |
| 12.2 | ✅ **REPL** — `cryoc repl`. Declarations and assignments persist, everything else runs once: replaying arbitrary statements would re-run a `write_file(…)` on every later line |
| 12.3 | ✅ **[Packages](#/pacotes)** — `cryo.toml`, `cryo.lock` and `import "@dep/file.cryo"`. No registry, no network: a dependency is a path. The lock pins **content**, so it catches an edit that leaves the version untouched |
| 12.4 | ✅ **CI over the examples** — every example compiled on each backend and run where it can be, and every backend that produced output must produce **the same** output. "It compiled" is a far weaker claim than "it agrees" |
| 12.5 | ✅ **[Concurrency in the VM](#/concorrencia)** — `spawn`/`await` run on the pyro backend now, on a cooperative single-threaded scheduler. Deterministic output and no locking, at the cost of CPU parallelism; `sleep` is the yield point, so five 200ms tasks cost 217ms instead of 1016ms |
| 12.6 | ✅ **[Self-hosted parser: the rest](#/selfhost)** — try/catch/finally, switch, lambdas, map literals, casts, imports, traits and spawn/await, plus a type grammar for `map<K,V>` and `fn(T)->R`. 11.28 called these desugarings; only the lambda body actually was. Generics remain |
| 12.7 | ✅ **Stale phase tables reconciled** — Phases 6–9 still listed items that Phases 8–12 had shipped. Every claim was re-checked by running it before being ticked |
| 12.8 | ✅ **A dynamic `assert` message is no longer dropped** — `assert(n == 4, "n was " + to_string(n))` reports *n was 5* on pyro now, as it already did on go and node. The expression had never even been evaluated |
| 12.10 | ✅ **[`json_encode` key order](#/json)** — keys are ordered by their own text on every backend. It was two defects in opposite directions: node used insertion order for maps, while go and node used declaration order for structs and pyro sorted them |
| 12.11 | ✅ **[A future can be awaited twice](#/concorrencia)** — it used to deadlock the go binary |
| 12.9 | ⬜ **A payload-less enum member used as a value** fails on node, go and c — `enum E { A, B } E e = A;` emits a bare `A` where the member is declared `E_A` |
| 12.12 | ⬜ **The `assert` message is evaluated eagerly on pyro and go, lazily on node** — so a message with a side effect behaves differently. Lazy is the better semantics; pyro and go should match node |

## Principles

1. **Modules first** — no large project fits in one file.
2. **Pyro parity with Go** — each phase shrinks the "use --backend go" list.
3. **A good error is a feature** — position, actionable message and a backend suggestion.
4. **A feature ships only with tests** — the suite grows with it.
5. **The docs follow the code** — every feature updates this site.
