---
title: "The CLI (cryoc)"
group: "The Burnout Compiler"
lead: "`burnout/cryoc.py` is the entry point — it compiles, runs, inspects and audits."
---
## Usage

```bash
python burnout/cryoc.py <file.cryo> [options]
```

## Options

| Option | Effect |
|---|---|
| `--backend {auto,go,c,asm,pyro,node,wasm,frontend}` | Choose the generator; `auto` picks the best for the program (default: `go`). `frontend` assembles [html/javascript/CSS blocks](#/frontend) into a page |
| `--emit {html,pyro}` | `frontend` backend only: one self-contained vanilla file, or an `.html` shell plus `app.wasm` |
| `--run` | Compile and then execute |
| `-o, --output <file>` | Output artifact path |
| `--abi {sysv,win64}` | asm backend ABI (default per platform) |
| `--unsafe` | Turns off safety instrumentation |
| `--audit` | Runs the static audit (report + backend suggestion) and **keeps compiling** |
| `--audit-only` | Runs the audit, prints the report and **exits without compiling** |
| `--strict` | Exit code `2` if there is any HIGH finding (CI gate). Implies the audit; combines with `--audit`/`--audit-only` |
| `--emit-only` | Only generates the source (`.pyro`/`.s`); does not invoke the toolchain |
| `--dis` | Disassembles the generated Pyro bytecode |
| `--no-opt` | Turns off both optimizers — the AST pass (all backends) and the pyro bytecode peephole |
| `--no-cache` | Do not read or write the [incremental cache](#/pyro-isa) |
| `--clear-cache` | Empty `.cryocache/` (works on its own, with no input file) |
| `--sandbox` | pyro/go backends: refuse network/machine operations by policy (also via `PYRO_SANDBOX=1` at runtime) |
| `--tokens` | Prints the lexer tokens |
| `--ast` | Prints the AST |
| `-v, --verbose` | Detailed output |
| `--no-banner` | Hides the banner |

> Sub-commands: `python burnout/cryoc.py fmt <files> [--write] [--check]` (see [Formatter](#/formatador)) and `python burnout/cryoc.py --lsp` (see [Language Server](#/lsp)).

## Examples

```bash
# Pyro target (custom bytecode) — generates .pyro and runs on the VM
python burnout/cryoc.py cryo/examples/example_bytecode.cryo --backend pyro --run

# Go target (full language)
python burnout/cryoc.py cryo/examples/example_saas.cryo --backend go --run

# native C / x86-64 targets
python burnout/cryoc.py cryo/examples/example_v4.cryo  --backend c
python burnout/cryoc.py cryo/examples/example_asm.cryo --backend asm

# WebAssembly target (browser)
python burnout/cryoc.py client.cryo --backend wasm -o app.wasm

# inspection and security
python burnout/cryoc.py app.cryo --audit
python burnout/cryoc.py app.cryo --backend pyro --dis
```

## The `pyro` command

`cryoc` is the compiler front-end. `burnout/pyro.py` sits one level up and wraps the **whole toolchain** — front-end, bytecode, AOT and C compiler — behind a single command. It accepts either `.cryo` or `.pyro`:

```bash
python burnout/pyro.py build app.cryo -o app.exe
```

| Command | Does |
|---|---|
| `pyro build <in> [-o out]` | compiles to a standalone [native binary](#/nativo) |
| `pyro run <in>` | runs natively when a C toolchain exists, else falls back to the VM |
| `pyro vm <in>` | runs on the Pyro bytecode VM |
| `pyro c <in>` | emits the AOT C source |

## Where the artifacts go

Without `-o`, output goes to `build/` with the same base name as the source and the backend extension (`.go`, `.pyro`, `.c`, `.s`). The `.cryo` sources stay separate from generated artifacts.
