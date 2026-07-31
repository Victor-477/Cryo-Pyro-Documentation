---
title: "Pyro: instruction set"
group: "Pyro — Bytecode & VM"
lead: "Each instruction is 1 opcode byte + fixed-size operands. Jumps are relative to the end of the instruction itself."
---
## Opcodes

| Opcode | Hex | Operand | Stack effect |
|---|---|---|---|
| `HALT` | 00 | — | ends |
| `CONST` | 01 | u16 idx | pushes `consts[idx]` |
| `TRUE`/`FALSE`/`NULL` | 02/03/04 | — | pushes literal |
| `POP` | 05 | — | discards the top |
| `LOAD` | 06 | u16 slot | pushes `local[slot]` |
| `STORE` | 07 | u16 slot | `local[slot] = pop()` |
| `ADD`…`MOD` | 10–14 | — | `pop b, a` → pushes `a op b` |
| `NEG` | 15 | — | negates the top |
| `BAND`…`SHR` | 16–1A | — | bitwise (integers) |
| `BNOT` | 1B | — | bit complement |
| `EQ`…`GE` | 20–25 | — | comparison → bool |
| `NOT` | 26 | — | logical negation |
| `JMP` | 30 | i32 rel | relative jump |
| `JMPF`/`JMPT` | 31/32 | i32 rel | `pop`; jumps if false/true |
| `CALL` | 40 | u16 fn, u8 argc | calls function (new frame) |
| `RET` | 41 | — | returns the top to the caller |
| `PUSHFN` | 42 | u16 funcidx | pushes a **function value** (first-class fn) |
| `CALL_VALUE` | 43 | u8 argc | calls the function value sitting beneath the `argc` args |
| `PRINT` | 50 | — | prints `pop()` per type |
| `ASSERT` | 51 | — | `pop cond, msg`; aborts if false |
| `PRINTLN` | 52 | — | prints an empty line |
| `NEWARR`/`NEWMAP` | 60/61 | u16 n | containers from the stack top |
| `INDEX`/`SETIDX` | 62/63 | — | indexed read/write (bounds-checked) |
| `LEN` | 64 | — | `pop cont` → pushes its length |
| `APPEND` | 65 | — | `pop v, pop arr`; `arr.push(v)` → pushes the new length (net −1) |
| `HAS`/`KEYS` | 66/67 | — | key presence / array of keys |
| `NATIVE` | 70 | u8 id, u8 argc | native VM builtin (table below) |
| `TRYPUSH`/`TRYPOP`/`THROW` | 71–73 | (TRYPUSH: i32, u16) | try/catch: install handler / remove / throw |
| `COALESCE`/`UNWRAP` | 74/75 | — | operator `??` / unwrap `x!` |

> Jumps are **relative** to the end of the instruction itself: `rel = target − (pc_after_operand)`.

## Native builtins (NATIVE)

The `NATIVE` instruction consumes `argc` arguments from the stack and pushes the result. The id table is mirrored across **four** places, all of which must agree: the generator (`NATIVES` in `codegen_pyro.py`), the Go VM (`native()` in `vm/main.go`), the C runtime (`vm/pyro_runtime.c`, shared by the C VM and the AOT) and the [self-hosted generator](#/selfhost) (`nativeId` in `cryo/selfhost/codegen.cryo`):

| id | name | id | name | id | name |
|---|---|---|---|---|---|
| 0 | `sqrt` | 7 | `round` | 14 | `trim` |
| 1 | `pow` | 8 | `to_string` | 15 | `contains` |
| 2 | `abs` | 9 | `to_int` | 16 | `find` |
| 3 | `min` | 10 | `to_number` | 17 | `replace` |
| 4 | `max` | 11 | `remove` | 18 | `substr` |
| 5 | `floor` | 12 | `upper` | 19 | `split` |
| 6 | `ceil` | 13 | `lower` | 20 | `join` |
| | | | | 21 | `input` |
| | | | | 22 | `json_encode` |
| | | | | 23 | `json_decode` |
| | | | | 24 | `http_get` |
| | | | | 25 | `http_post` |
| | | | | 26 | `sleep` |
| | | | | 27 | `write_bytes` |
| | | | | 28 | `read_file` |
| | | | | 29 | `args` |
| | | | | 30 | `http_serve` |

Phase 10 appended ids 31-51 — the extended standard library, the stateless collection operations, and time/random:

| id | name | id | name | id | name |
|---|---|---|---|---|---|
| 31 | `clamp` | 38 | `sort` | 45 | `count` |
| 32 | `sign` | 39 | `reverse` | 46 | `sum` |
| 33 | `gcd` | 40 | `slice` | 47 | `now_ms` |
| 34 | `hypot` | 41 | `index_of` | 48 | `monotonic_ms` |
| 35 | `starts_with` | 42 | `pad_start` | 49 | `random` |
| 36 | `ends_with` | 43 | `pad_end` | 50 | `random_int` |
| 37 | `repeat` | 44 | `concat` | 51 | `seed` |

`slice` (id 40) is **polymorphic over arrays and strings**, because [`x[a..b]`](#/arrays) is desugared before types are known and so cannot pick a type-specific builtin.

> **An id is permanent once shipped.** Renumbering would silently break every `.pyro` already on disk, so new builtins only ever append — which is also why the table above has gaps in its reading order rather than being regrouped.

Enums generate no code: each member (`Level_HIGH`) becomes an integer constant at compile time. `try`/`catch`/`throw` use the `TRYPUSH`/`TRYPOP`/`THROW` instructions; `??` and `x!` use `COALESCE`/`UNWRAP`. Literal global constants are inlined.

The last four natives are what turn a program on the VM into a real command-line or network program: `write_bytes` emits raw bytes (this is how the [self-hosted compiler](#/selfhost) writes a `.pyro`), `read_file` and `args` give it its input and its argument list, and `http_serve` makes it a [web server](#/fullstack). All except `args` are gated by the sandbox.

> **Stack effects are normative.** Every engine — Go VM, C VM, AOT — must pop and push exactly what the table says. An engine that *peeks* an operand instead of popping it still works on straight-line code, but leaves the operand stranded: two paths merging after a conditional then disagree on the stack depth, and later reads take the wrong value. `APPEND` is the easy one to get wrong — it pops **both** the value and the array.

## Bytecode optimizer

Before serializing, the generator applies a *peephole* over each function's instruction list (on by default; turn off with `--no-opt`):

| Step | What it does |
|---|---|
| **Constant folding** | folds constant expressions: `(0xF0\|0x0F) & 0xFF` → `CONST 255`; `"a" + "b"` → `CONST "ab"`; `100 > 50` → `TRUE`. Preserves type (int/float) and does **not** fold integer division nor int64 overflow (left to the runtime) |
| **Dead-code elimination** | removes unreachable instructions after `return`/`break`/jump |
| **Peephole** | removes `push`+`POP` and jumps to the next label |
| **Constant prune** | removes from the pool the literals no one references anymore |

Since jumps reference **labels** (resolved only at assembly), folding/removing instructions is safe. Typical effect: `-33%` on the `.pyro` size of a constant-heavy program.

## The AST optimizer

The peephole above sees three instructions at a time and only exists for the pyro backend. A second pass runs **before code generation**, on the AST, so **every backend gets it** — go, node, c, wasm and asm had no optimizer at all. Both are controlled by `--no-opt`.

| Step | What it does |
|---|---|
| **Constant folding** | `2 + 3 * 4` → `14`, `"a" + "b"` → `"ab"`, `3 < 4` → `true` |
| **Constant propagation** | `int base = 10; base * 60` → `600` |
| **Copy propagation** | `int b = a; f(b)` → `f(a)` |
| **Dead local elimination** | a variable nobody reads, whose initializer cannot be observed, is removed |
| **Inlining** | a small leaf function becomes its body at the call site |

These feed each other, so the pass repeats until nothing changes — folding `base * 60` is what turns `total` into a constant, which is what lets a later `copy = total` disappear:

```cryo
int base  = 10;
int total = base * 60;
int copy  = total;
fn double(int n) -> int ={ return n * 2; }

print(total); print(copy); print(double(21)); print(2 + 3 * 4);
```

reaches every backend as four constants — `600`, `600`, `42`, `14` — with no variables and no function call left.

### What it will not do

The refusals matter more than the transformations, because a wrong one is silent.

**Traps are behaviour, not accidents.** Division or modulo by zero is never folded, and integer arithmetic that would overflow `int64` is never folded. Safe mode raises on both, and folding would either move that error to compile time or remove it.

**A value only moves when it means the same thing elsewhere.** The AST carries no types, so two cases are excluded:

```cryo
int? y = 5;
print(y == null);        // NOT propagated: `5 == null` is a different question

fn mk() -> int[] ={ return [1, 2, 3]; }
for (int v in mk()) { }  // NOT inlined: the element type is in the
                         // signature, not in `[1, 2, 3]`
```

Both were caught by the existing test suite rather than by reading the code. Everything else is conservative by construction: a name qualifies only if it is declared exactly once and never assigned, which sidesteps shadowing, loop carriage and capture without having to model any of them.

## Incremental compilation

Compiling the self-hosted compiler (7 files, 80 KB) splits into two costs — resolving and parsing the modules, then everything after it — so there are two caches, both on by default:

| Cache | Keyed by | Saves |
|---|---|---|
| **parse** | one module file's content | re-lexing and re-parsing that file |
| **artifact** | every input that can change the output | the entire compilation |

Measured with Python's own start-up subtracted, so the numbers describe the compiler:

| | work done |
|---|---:|
| no cache | 201 ms |
| rebuild, nothing changed | **19 ms** |
| rebuild after editing a file | 205 ms |

**The win is the unchanged rebuild** — what a test suite and a repeated build actually do. Editing a file does not speed up, and the reason is worth knowing rather than hiding: the parse cache can only save parsing the files you did *not* touch, and in this project a single module is 34 ms of the 45.

```bash
python burnout/cryoc.py app.cryo --no-cache      # ignore both caches
```

```bash
python burnout/cryoc.py --clear-cache            # empty .cryocache/
```

### What invalidates an entry

A stale artifact would be worse than a slow compile — the compiler would report success over the *previous* program. So the key covers everything that can change the result: every source file read (the entry **and** its imports), the backend, the flags that reach code generation, and **the compiler's own source**.

That last one is not caution for its own sake. Without it, editing a code generator and rebuilding would hand back the artifact the previous compiler produced, and the change would appear to have done nothing — the most confusing failure this feature could have.

Two more properties, both learned the hard way:

- **A damaged entry is a miss, never a wrong answer.** The filename hashes the *inputs*, which says nothing about whether the bytes on disk are still the ones written, so each entry carries a checksum of its own contents.
- **A cached build says whatever the first one said.** Compiling is not a pure function — it prints diagnostics — and an early version skipped those along with the work, so the second build of a page whose javascript calls `cryo.…` went quiet about it. Entries store their warnings and replay them.

The cache lives in `.cryocache/` beside where you run the compiler, is content-addressed (a stale entry is never wrong, only unused), and is safe to delete at any time.

## Disassembling

See the opcodes generated for a program (compare with `--no-opt`):

```bash
python burnout/cryoc.py cryo/examples/example_containers.cryo --backend pyro --dis
python burnout/cryoc.py app.cryo --backend pyro --dis --no-opt   # without optimizing
```
