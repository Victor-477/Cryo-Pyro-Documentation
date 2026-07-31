---
title: "Self-hosting"
group: "Native & Full-Stack"
lead: "The Cryo→Pyro compiler is **written in Cryo**. It runs on the Pyro VM, compiles its own source, and reaches a fixed point."
---
A language is self-hosting when its compiler is written in itself. Cryo's lives in `cryo/selfhost/`:

| File | Role |
|---|---|
| `lexer.cryo` | tokenizer — produces a token stream byte-identical to `cryo/lexer.py` |
| `parser.cryo` | recursive-descent parser |
| `codegen.cryo` | single-pass generator emitting a valid PYRO v2 binary |
| `pyroc.cryo` | the CLI entry point: `read_file` + `args` + `write_bytes` |

## Compiling without Python

Bootstrap once with the reference front-end, then never again:

```bash
python burnout/compiler.py cryo/selfhost/pyroc.cryo --backend pyro -o build/pyroc.pyro
```

From then on the compiler compiles Cryo by itself, running on the VM:

```bash
build/pyrovm build/pyroc.pyro app.cryo app.pyro
```

It can also be compiled [ahead of time](#/nativo) into `pyroc` — a native Cryo compiler with no VM and no Python:

```bash
python burnout/pyro.py build build/pyroc.pyro -o build/pyroc
```

## The fixed point

Self-hosting is only meaningful if it is **stable**. The test is a fixed point: take the self-hosted codegen, and build it two ways —

1. **A** — compiled by the reference Python compiler;
2. **B** — compiled by the self-hosted compiler itself.

Then use each to compile the same program. If the two `.pyro` outputs are byte-identical (`sha256(P_A) == sha256(P_B)`), the compiler is a genuine fixed point rather than something that merely happens to run. `burnout/tests/test_bootstrap.py` asserts exactly this on a program exercising recursion, enums + `match`, ternaries, loops, `break`/`continue`, containers, interpolation and bitwise operators.

All **three** routes agree byte-for-byte: the Python front-end, the self-hosted compiler on the VM, and the self-hosted compiler as a native binary — including when compiling its own 23 KB `codegen.cryo`.

> Why it matters beyond the milestone: the self-hosted compiler is the most demanding Cryo program that exists, so it exercises the VM far harder than any test. Several latent runtime bugs were found precisely because its output stopped being byte-identical.
