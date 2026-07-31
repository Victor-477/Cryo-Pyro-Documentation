---
title: "Pyro: the .pyro format"
group: "Pyro — Bytecode & VM"
lead: "The `.pyro` is the custom target language: a binary bytecode with an ISA invented here — it is not x86, nor Go, nor C."
---
The execution model is a **stack machine**: operands live on a stack and each function has its own frame of local variables.

## File layout (little-endian)

```text
magic     4    "PYRO"
version   1    0x02
flags     1    bit0 = encoded code (XOR) · bit1 = debug section · bit2 = sandbox
nconsts   u16
consts    nconsts × [ tag(1) + payload ]
              tag 1 int64   → 8 bytes
              tag 2 float64 → 8 bytes
              tag 3 string  → u16 len + UTF-8 bytes
              tag 4 bool    → 1 byte
nfuncs    u16
funcs     nfuncs × [ nameidx u16, entry u32, nparams u8, nlocals u16 ]
entryfn   u16    index of the 'main' function
codelen   u32
code      codelen bytes   (decoded on load if flags bit0)
ndebug    u32            (only if flags bit1)
debug     ndebug × [ pc u32, line u32 ]   pc → source-line table
```

Constants are deduplicated; each function's `nameidx` references a string in the pool. Pool strings are in the clear — **only the `code` section is encoded**.

> **v2 format (Phase 5):** jumps (`JMP`/`JMPF`/`JMPT` and `TRYPUSH`) use **`i32`** — no ±32 KB per-function limit. The **debug section** (pc → line) feeds readable *stack traces*: on abort, the VM prints each active function with its source line.

```text
[Pyro VM] [Cryo Security] DivByZero: integer division
  stack trace (most recent first):
    at divide (line 2)
    at calculate (line 5)
    at main (line 8)
```

## Code section encoding (flags bit0)

A light obfuscation (**not** strong encryption) via rolling XOR: initial key `0x5A`, updated per byte by `k = (k·31 + 7 + b) & 0xFF`, where `b` is the clear byte. The VM applies the inverse on load.

It makes the `.pyro` opaque to casual reading and compact for distribution; for real secrecy, encrypt the artifact separately.

## Why a custom bytecode?

- **Runs on the machine** via the Pyro VM (portable: a single Go binary).
- **Compact and opaque** by nature — good for distribution.
- **Native to the system** — well-defined instructions, great as training data for AI agents.
- **Custom**, not derived from x86/Go/C.
