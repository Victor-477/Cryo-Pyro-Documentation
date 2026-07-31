---
title: "Pyro: the VM"
group: "Pyro — Bytecode & VM"
lead: "The Pyro VM loads, decodes and executes the `.pyro`. There are two independent implementations — Go and C — plus an AOT translator, and all three must behave identically."
---
## Three engines, one runtime

| Engine | Files | Role |
|---|---|---|
| **Go VM** | `pyro/vm/main.go` | reference implementation; garbage-collected |
| **C VM** | `pyro/vm/main.c` + `pyro_runtime.{c,h}` | portable, deterministic **reference counting** |
| **AOT** | `burnout/aot_pyro.py` | translates `.pyro` → C against the same runtime → [native binary](#/nativo) |

The C VM's `main.c` is only the **engine** (load, decode, dispatch); the value model, containers and natives live in the isolated `pyro_runtime`. The AOT is a second engine over that same runtime, so a natively compiled program inherits VM semantics by construction rather than reimplementing them.

The Go and C engines are held to **byte-for-byte parity** — stdout, stderr and exit code — by `burnout/tests/test_c_vm.py`, which also compares the HTTP responses served by `http_serve`.

## Dynamic typing

Values carry their type at runtime (int64, float64, bool, string, null) and operations are resolved by the VM:

- `ADD` with a string operand → **concatenation** (the other is converted).
- Arithmetic with any `float` → promotion to float; otherwise, integer.
- `EQ`/`NE` compare by value between compatible types.

## Security in the VM

- Integer `DIV`/`MOD` by zero **abort** (`[Cryo Security] DivByZero`).
- `ASSERT` aborts with the message if the condition is false.
- On abort, the VM prints a **stack trace** (function + line) when debug info is present.

## Compilation and execution

The VM is built once (Go) and reused. The compiler handles this automatically with `--run`:

```bash
python burnout/cryoc.py cryo/examples/example_bytecode.cryo --backend pyro --run
```

Internally: `go build` of the VM in `pyro/vm/` produces `build/pyrovm`, which then loads and executes the `.pyro`. If Go is not installed, the `.pyro` is generated anyway (just not executed).

Building the C VM instead:

```bash
gcc -O2 -std=c11 -o pyrovm Pyro/vm/main.c Pyro/vm/pyro_runtime.c -lm -lws2_32
```

`-lws2_32` is Windows-only — the runtime uses sockets for `http_serve`. With MSVC the equivalent is `cl /O2 /utf-8 /Fe:pyrovm.exe main.c pyro_runtime.c ws2_32.lib` (`/utf-8` keeps the accented error messages byte-identical to the Go VM's).

## References in the code

- **Generator:** `burnout/codegen_pyro.py` (opcodes and serialization).
- **Go VM:** `pyro/vm/main.go` (load, decode and execute).
- **C VM:** `pyro/vm/main.c` (engine) + `pyro_runtime.{c,h}` (runtime, specified in `PYRO_RUNTIME.md`).
- **AOT:** `burnout/aot_pyro.py` (`.pyro` → C).
- **Disassembler:** `burnout/disasm_pyro.py`.
