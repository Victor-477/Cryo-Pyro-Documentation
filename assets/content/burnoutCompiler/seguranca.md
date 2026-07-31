---
title: "Code security"
group: "The Burnout Compiler"
lead: "Safe mode (default) instruments the generated code; the static audit (`--audit`) inspects the AST before compiling."
---
## Safe mode (default)

On by default; turn off with `--unsafe`. It applies, where relevant, to the three native backends:

- **Integer overflow** — `+ - *` go through helpers that abort on overflow (`cryoAddOvf`/`cryoSubOvf`/`cryoMulOvf` on Go; `cryo_add_ovf`/… via `__builtin_*_overflow` on C).
- **Division/modulo by zero** — `/` and `%` are always protected (`cryoIDivChk`/`cryoIModChk` on Go, runtime on C, and on the Pyro VM). **Division** `INT64_MIN / -1` aborts on all these backends (non-representable result); **modulo** `INT64_MIN % -1` returns `0` (well-defined).
- **`assert(cond)` / `assert(cond, "msg")`** — aborts if the condition fails.
- **Array bounds-checking** — guaranteed by Go natively; on C via the runtime.
- **Binary hardening (C backend)** — `-fstack-protector-strong`, `-D_FORTIFY_SOURCE=2`, `-Wformat-security`.

## unsafe / safe blocks

Turn instrumentation off locally for audited hot paths — and re-enable it with `safe` inside an `unsafe` context:

```cryo
int fast = 0;
unsafe {
    fast = sum * 2;   // no overflow check here
}
```

## Static audit (--audit)

Walks the AST and classifies findings as **HIGH / MEDIUM / LOW**:

| Finding | Level | What it is |
|---|---|---|
| `foreign-block` | HIGH | `>C(...)` blocks embed unverified code |
| `div-by-zero` | HIGH | division by a literal zero |
| `command-exec` | HIGH | `pyro_exec()` runs an arbitrary shell command |
| `tainted-exec` | HIGH | untrusted data reaches `pyro_exec()` — command injection |
| `tainted-path` | HIGH | untrusted data reaches `pyro_write_file()` — path traversal |
| `tainted-ssrf` | HIGH | untrusted data reaches `http_get()`/`http_post()` — SSRF |
| `tainted-open` | HIGH | untrusted data reaches `pyro_open()` |
| `hardcoded-secret` | HIGH/MED | a secret embedded in the source (key format / sensitive name) |
| `unvalidated-deserialization` | HIGH | `json_decode()` of untrusted data cast with `as T` |
| `broad-permission` | HIGH/MED | a `permissions` block granting a whole class with `"*"` |
| `unbounded-allocation` | MEDIUM | `repeat()`/`pad_start()`/`pad_end()` sized by untrusted input |
| `toctou-path` | LOW | `file_exists()`/`is_dir()` checked, then the same path used |
| `unsafe-block` | MEDIUM | disables instrumentation |
| `file-write` / `shell-open` | MEDIUM | `pyro_write_file()` / `pyro_open()` touch disk/OS |
| `net-egress` | MEDIUM | `http_get()` / `http_post()` (SSRF risk) |
| `external-lib` / `foreign-import` | LOW | external dependencies |
| `llm-egress` | LOW | `llm()` / `agent()` send data to an external endpoint |
| `untrusted-input` | LOW | use of `input()` |

```bash
python burnout/cryoc.py app.cryo --audit
```

If there is any HIGH-level finding, the audit records it on the error output. Two ways to run: `--audit` prints the report and **keeps compiling**; `--audit-only` prints the report and **exits** (handy in CI).

### Taint analysis (untrusted data flow)

The audit tracks **untrusted data** flowing from a *source* into a dangerous *sink*. When they connect, the generic finding (e.g. `command-exec`) is joined by a specific HIGH finding (e.g. `tainted-exec`) — the difference between "this call is sensitive" and "this call is sensitive **and fed by untrusted input**".

| Sources (untrusted) | Sinks (dangerous) |
|---|---|
| `input()` · `read_file()` | `exec(cmd)` → `tainted-exec` |
| `http_accept()` (method/path/query/body) | `read_file(p)` · `write_file(p, …)` · `delete_file(p)` → `tainted-path` |
| `args()` · `env()` · `asset()` | `pyro_open(target)` → `tainted-open` |
| `http_get()` · `http_post()` · `llm()` · `agent()` | `http_get(url)` / `http_post(url, …)` → `tainted-ssrf` |

The request map returned by `http_accept()` is attacker-supplied in every field, so a handler that routes on `req["path"]` and then opens a file under it is exactly the shape `tainted-path` exists to catch.

Taint is computed **per function**, not across the whole program. It is tracked by *name*, so a program-wide set made a `path` fed by `http_accept()` in one handler mark every unrelated `path` elsewhere as untrusted — a false HIGH on correct code, which is the expensive kind of wrong: `--strict` gates CI on HIGH, so a noisy rule mostly buys someone turning the gate off. The trade is real, though: taint does **not** cross a call boundary, so a tainted value passed as an argument is not tracked into the callee. Validate at the boundary rather than relying on the analysis to follow it.

The flow propagates through assignments (`a = input(); b = a; exec(b)` is flagged). A literal argument is **not** flagged:

```cryo
string cmd = input("command: ");
string out = exec(cmd);             // ⛔ tainted-exec (command injection)

string safe = exec("ls -la");       // only command-exec (literal, not tainted)
```

### The other input-driven rules

```cryo
map<string,string> req = http_accept();

// ⛔ unvalidated-deserialization — `as T` asserts a shape, it does not check one.
// Every field read afterwards is whatever the caller chose to send.
map<string,string> body = json_decode(req["body"]) as map<string,string>;

// ⚠️ unbounded-allocation — one request can exhaust memory. Clamp the count.
string pad = repeat("x", to_int(req["query"]));

// ℹ️ toctou-path — the file can be replaced between the check and the use.
if (file_exists(p)) { print(read_file(p)); }   // handle the failure instead
```

`broad-permission` covers the `permissions { … }` block: `exec = "*"` or `write = "*"` is HIGH, a broad `read` is MEDIUM. Declaring a whole class proves nothing about the program — name the paths, hosts or binaries it actually needs.

> The analysis is conservative and program-wide (a lightweight linter, not a full type-and-flow prover). It never rejects a program — it reports — and does not replace manual review. Sanitize/validate before the sink, or keep an allowlist.

### Hardcoded secrets

The audit flags secrets committed to source — by **value** (recognized key formats such as `sk-…`, `AKIA…`, `ghp_…`, `xox…` → HIGH) or by **name** (a non-empty string assigned to `api_key`, `token`, `senha`, `password`, `client_secret`, … → MEDIUM):

```cryo
const string OPENAI = "sk-abcdefghij0123456789";   // ⛔ hardcoded-secret (HIGH)
string api_key = "hunter2hunter2";                  // ⚠️ hardcoded-secret (MEDIUM)
```

Move secrets to an environment variable (`pyro_env("OPENAI_API_KEY")`) or a secret store.

### Failing the build: --strict

In CI, `--strict` **fails the build** (exit code `2`) whenever there is any HIGH-level finding. It implies the audit, so it works on its own as well as alongside `--audit` / `--audit-only`:

```bash
python burnout/cryoc.py app.cryo --strict               # audit + gate, exit 2 on HIGH
```

```bash
python burnout/cryoc.py app.cryo --audit-only --strict  # report only, same gate
```

Without `--strict`, HIGH findings are reported but the exit code stays `0` (the build proceeds).

## Runtime sandbox (--sandbox)

The static audit is advisory. The **sandbox** is runtime enforcement: with `--sandbox`, network/machine operations **fail closed** (abort) instead of reaching out. It works on the **pyro** and **go** backends:

```bash
python burnout/cryoc.py app.cryo --backend pyro --sandbox --run
python burnout/cryoc.py app.cryo --backend go   --sandbox --run
```

```text
[Cryo Security] Sandbox: pyro_exec blocked by sandbox policy
```

On the **Pyro VM** the policy is baked into the `.pyro` (format flag bit2); on the **go** backend it is baked into the generated program (a `cryoSandboxGuard` before each sensitive call). Either way you can also sandbox an **existing** artifact at run time — without recompiling — with `PYRO_SANDBOX=1` in the environment. The policy only ever tightens: it can turn the sandbox on, never off (an artifact built with `--sandbox` stays sandboxed regardless of the variable).

| Mechanism | Scope |
|---|---|
| `cryoc … --sandbox` | bakes the policy into the artifact (`.pyro` flag bit2, or a guard in the `.go`) — permanent |
| `PYRO_SANDBOX=1` (env) | runtime policy over any artifact, checked when the sensitive op runs |

What is gated:

| Backend | Blocked under sandbox | Allowed |
|---|---|---|
| `pyro` (VM) | `http_get` · `http_post` | `sleep`, everything non-network |
| `go` | `http_get` · `http_post` · `llm`/`agent` · `pyro_exec` · `pyro_write_file` · `pyro_open` | `pyro_env`/`pyro_args`/`pyro_read`/`pyro_time`/`sleep` (read-only/benign) |

> The `go` backend has the widest machine/network surface (exec, file write, shell-open, LLM egress), so `--sandbox` matters most there. For running fully untrusted code, combine it with the [static audit](#/seguranca) and `--strict`.

### Backend suggestion

The audit also checks whether the chosen backend covers the features used. If it does not (an exclusive feature, or a foreign block it does not emit), it suggests `--backend auto`:

```text
$ python burnout/cryoc.py app.cryo --backend c --audit
[Audit] backend 'c' does not cover features [map].
            Use --backend auto (would pick 'pyro') or --backend pyro.
```

Available on the API as `burnout.missing_capabilities(ast, backend)`.
