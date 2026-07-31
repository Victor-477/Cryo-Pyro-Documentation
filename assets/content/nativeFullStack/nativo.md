---
title: "Native binaries (AOT)"
group: "Native & Full-Stack"
lead: "A `.pyro` can be translated ahead of time into C and linked into a standalone executable — no VM, no bytecode, no Python or Go at runtime."
---
## The route

```text
app.cryo  ──►  app.pyro  ──►  app.c  ──►  cc  ──►  app (native)
         front-end       AOT          + pyro_runtime.c
```

`burnout/aot_pyro.py` lowers each Pyro function to a C function, turning the stack machine into straight-line C with jump targets as `goto` labels, and links it against the **same** `pyro_runtime` the C VM uses. Because the runtime is shared, the native binary inherits VM semantics by construction instead of reimplementing them.

## Building

```bash
python burnout/pyro.py build app.cryo -o app
```

That is the whole thing — the CLI runs the front-end, the AOT, and the C compiler it auto-detects (gcc/clang/cc/zig/cl). To do it by hand:

```bash
gcc -O2 app.c pyro/vm/pyro_runtime.c -I pyro/vm -lm -lws2_32 -o app
```

`-lws2_32` is Windows-only (the runtime uses sockets for `http_serve`).

## Exceptions across C frames

`try`/`catch`/`throw` are lowered with `setjmp`/`longjmp` over a global handler stack: `TRYPUSH` becomes a `setjmp`, and `throw` (or a failing `assert`) becomes a `longjmp` to the nearest handler, or `fatal` when there is none.

The subtlety is memory. The machine state — value stack, locals, frames — is **global** rather than held in C locals, because C locals are indeterminate after a `longjmp`. On catch, the runtime releases every value above the saved stack pointer and the locals of every frame above the saved frame pointer, so unwinding is leak-free and matches how the VM unwinds its own call stack.

## What you get

A single executable, typically a few hundred KB, that starts instantly and depends on nothing. Two things built this way in this repo: the [full-stack demo's server](#/fullstack), and the [self-hosted compiler](#/selfhost) itself.

> `burnout/tests/test_aot.py` builds nine feature-diverse programs and asserts each native binary's stdout **matches the VM's**. Where no C toolchain is present it checks generation only and skips the build.
