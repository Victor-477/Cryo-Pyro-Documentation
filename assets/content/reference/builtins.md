---
title: "Builtins"
group: "Reference"
lead: "The language's built-in functions, grouped by area. Availability depends on the backend."
---
## Core (all applicable backends)

| Builtin | Description |
|---|---|
| `print(v)` | prints a value |
| `input(prompt)` | reads a line (`string`) |
| `len(x)` | length of string/array/map |
| `assert(cond)` / `assert(cond, msg)` | aborts if false |
| `to_string(v)` `to_int(v)` `to_number(v)` | conversions |

## Math (go / node / pyro / c)

| Builtin | Description |
|---|---|
| `sqrt` `pow` `abs` | root, power, absolute value |
| `min` `max` | minimum, maximum |
| `floor` `ceil` `round` | rounding |
| `clamp(x, lo, hi)` | constrain `x` to `[lo, hi]` (int if all int, else number) |
| `sign(x)` | `-1` / `0` / `1` |
| `gcd(a, b)` | greatest common divisor (int) |
| `hypot(a, b)` | `sqrt(a² + b²)` without overflow |

> `sqrt`/`pow`/`abs`/`min`/`max`/`floor`/`ceil`/`round` are available on go/node/pyro/c. The Phase 10.4 additions — `clamp`/`sign`/`gcd`/`hypot` — are on **go/node/pyro** today (the c/asm backends reject them with a clear message).

## Strings (go / node / pyro)

| Builtin | Description |
|---|---|
| `upper(s)` / `lower(s)` | uppercase / lowercase |
| `trim(s)` | strips surrounding whitespace |
| `contains(s, sub)` | `true` if it contains the substring |
| `starts_with(s, p)` / `ends_with(s, p)` | prefix / suffix test |
| `find(s, sub)` | index of the substring (or `-1`) |
| `replace(s, old, new)` | replaces all occurrences |
| `substr(s, start, n)` | slice with safe bounds |
| `repeat(s, n)` | `s` concatenated `n` times (`n<0` → empty) |
| `pad_start(s, w, p)` / `pad_end(s, w, p)` | pad to width `w` with `p` (like JS) |
| `split(s, sep)` | splits into `string[]`; an empty `sep` splits into characters |
| `join(arr, sep)` | joins an array into a string |

> On the Pyro VM, all math, conversion and string builtins run via the ISA's [`NATIVE` instruction](#/pyro-isa).

### Lowered in the front end (all six backends)

These add **no native**. Each is rewritten by the parser into an ordinary Cryo
helper, so every backend gets it at once — including `c`, `asm` and `wasm`,
which is not true of the natives above. A program that declares its own
function of the same name keeps it; the rewrite only fires for a name the
program has not defined.

| Builtin | Description |
|---|---|
| `lines(s)` | splits into lines on `\n`, tolerating CRLF. Text ending in a newline does **not** yield a trailing empty line, and `lines("")` is `[]` |
| `chars(s)` | the characters of `s` as `string[]` |
| `title_case(s)` | upper-cases the first letter of each whitespace-separated word and lower-cases the rest, like Python's `str.title()` — `"hELLO wORLD"` → `"Hello World"` |
| `trim_start(s)` / `trim_end(s)` | strips whitespace from one end, over exactly the character set `trim` uses |

> Why lowering rather than natives: a new native has to be added in six places
> that cannot disagree (the two VMs, the AOT runtime, both code generators'
> tables and both semantic analysers), and a half-applied id allocation does not
> fail loudly — it makes the backends silently disagree about what an id means.
> There is only one implementation of these, and every backend compiles it.

Escapes in a string literal are `\n`, `\t`, `\r`, `\\`, `\"`, `\'` and `\$`
(a literal `${`). An unrecognised escape yields the character itself.

## Containers (go / node / pyro backends)

| Builtin | Description |
|---|---|
| `has(m, k)` | key exists in the map |
| `keys(m)` | map keys (array) |
| `remove(m, k)` | removes a key from the map |
| `arr.push(v)` | appends to the array (mutating) |
| `sort(arr)` | **new** array sorted ascending (numbers numerically, else by text) |
| `reverse(arr)` | **new** reversed array |
| `slice(x, a, b)` | **new** subarray *or substring* `[a, b)`, bounds clamped. Works on arrays **and strings** — this is what `x[a..b]` compiles to |
| `concat(a, b)` | **new** array: elements of `a` then `b` |
| `index_of(arr, x)` | first index of `x` by value, or `-1` |
| `count(arr, x)` | how many elements equal `x` |
| `sum(arr)` | sum of a numeric array (int if all int, else number) |

> `sort`/`reverse`/`slice`/`concat` are **non-mutating** — they return a fresh array and leave the original untouched.

> You rarely call `slice` by name: [`x[a..b]` slice syntax](#/arrays) is the readable form, and it lowers to exactly this call.

> A **user-defined function shadows a builtin** of the same name — you can define your own `fn sum(...)` or `fn sort(...)` and calls resolve to it (`print`, `len`, `has`, `keys` stay reserved).

## JSON (go / node / pyro)

| Builtin | Description |
|---|---|
| `json_encode(v)` | serializes to JSON |
| `json_decode(s) as T` | deserializes (typed on go/node; dynamic on pyro) |

## Network & binary I/O (go / pyro)

| Builtin | Description |
|---|---|
| `http_get(url)` `http_post(url, body)` | HTTP client (body `""` on error) |
| `sleep(ms)` | pause |
| `write_bytes(path, int[])` | write an int array as raw bytes to a file → `bool` (sandbox-gated) |
| `read_file(path)` | read a whole file → `string` (`""` on error, sandbox-gated) |
| `args()` | the program's arguments → `string[]` |
| `http_serve(port, dir)` | serve `dir` over HTTP — **blocks** (sandbox-gated) |

`read_file`, `args` and `write_bytes` are what let a program on the VM act as a real command-line tool — together they are how the [self-hosted compiler](#/selfhost) reads a `.cryo` and writes a `.pyro`. `http_serve` sends `.wasm` as `application/wasm`, answers missing paths with 404 and rejects path traversal with 403; see the [full-stack demo](#/fullstack).

## LLM & agents (go backend)

| Builtin | Description |
|---|---|
| `schema_of(T)` | JSON Schema of a type |
| `llm(m, p)` / `llm(m, p) as T` | completion / structured output |
| `tools()` `tools_json()` `tool_get(n)` | tool introspection |
| `agent(m, p)` / `agent(m, p, [tools], steps)` | tool-calling loop |
| `skills()` `skill_get(n)` `skill_has(n)` `skills_json()` | skill introspection |

## Machine (go backend)

| Builtin | Description |
|---|---|
| `pyro_exec(cmd)` | runs a command |
| `pyro_env(n)` | environment variable |
| `pyro_args()` | CLI arguments |
| `pyro_time()` | timestamp |
| `pyro_read()` | reads a line |
| `pyro_write_file(path, s)` | writes a file (`bool`) |
| `pyro_open(path)` | opens in the OS default app (`bool`) |
| `pyro_exit(code)` | ends the process |
