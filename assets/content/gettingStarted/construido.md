---
title: "What was actually built"
group: "Getting Started"
lead: "A precise account of what was written for this project, what is reused, and how to verify either — because \"I made a language\" can mean very different things."
---
The phrase *"I built a programming language"* covers everything from a syntax-highlighting file to a self-hosting compiler. This page says exactly where this project sits, and points at the files so you can check.

## Written for this project

| Component | What it is | Where |
|---|---|---|
| Lexer | Hand-written tokenizer — numeric bases, string interpolation, foreign-block scanning | `cryo/lexer.py` |
| Parser | Recursive descent with explicit precedence. **No parser generator**, no grammar file, no yacc/ANTLR | `cryo/parser.py` |
| Semantic analyzer | Scope, arity, types, exhaustive `match`, control-flow rules | `cryo/semantic.py` |
| Compile-time passes | Monomorphization for generics, trait lowering, module resolution | `cryo/generics.py`, `traits.py`, `modules.py` |
| Security audit | Taint analysis (source→sink) and secret detection over the AST | `cryo/security.py` |
| Eight code generators | Pyro bytecode, Go, C, x86-64 assembly, JavaScript, WebAssembly, C#, C++ | `burnout/codegen_*.py` |
| Bytecode format | An original instruction set and binary container, versioned | `pyro/PYRO_BYTECODE.md` |
| Bytecode optimizer | Peephole: constant folding, dead code, jump threading | `burnout/codegen_pyro.py` |
| Virtual machine ×2 | Two independent implementations, Go and C, held to byte-identical output | `pyro/vm/main.go`, `pyro/vm/main.c` |
| Runtime | Value model, reference counting, containers, 52 native builtins | `pyro/vm/pyro_runtime.c` |
| AOT compiler | `.pyro` → C → standalone native binary, no VM at runtime | `burnout/aot_pyro.py` |
| Self-hosted compiler | The Cryo→Pyro compiler, written in Cryo | `cryo/selfhost/` |
| Tooling | Language server, formatter, disassembler, CLI | `burnout/lsp.py`, `cryo/format.py`, `burnout/disasm_pyro.py` |

Roughly **22,000 lines** across the front end, the compiler, the two VMs, the self-hosted compiler and the test suites — with **no third-party runtime dependencies**. The reference compiler runs on the Python standard library alone; the VMs use only the Go and C standard libraries.

## What is reused, and why that is not cheating

Being precise about the boundary matters more than claiming purity:

| Reused | Where it applies | Why |
|---|---|---|
| The Go compiler and `gcc` | Only the `go` and `c` backends, and the AOT step | These backends emit **source text**, then hand it to an existing assembler. The generated Go or C is the artifact; compiling it is the last mile. |
| Go and C standard libraries | Inside the two VMs | Sockets, file I/O and maps. The instruction set, value model and execution loop are original. |
| Foreign libraries you ask for | `library >Go net/http<` and friends | Deliberate: [foreign blocks](#/estrangeiros) exist so you can borrow a mature stack on purpose, with the dependency declared. |
| Python | Host of the reference compiler | A convenience for the front end, not a runtime. Nothing Python reaches the produced program — and the [self-hosted compiler](#/selfhost) removes even that. |

The `pyro` route touches none of the above: `.cryo` → `.pyro` → VM involves no external toolchain at any point.

## How to verify it yourself

Three checks, in increasing order of how hard they are to fake.

**1. Read the bytecode.** Compile anything and disassemble it. The instructions are the project's own:

```bash
python burnout/cryoc.py demo.cryo --backend pyro -o demo.pyro --dis
```

**2. Run the parity suite.** Two independently written VMs must produce byte-identical output for the same `.pyro`. A wrapper around an existing runtime has nothing to compare:

```bash
python burnout/tests/test_c_vm.py
```

**3. Check the fixed point.** This is the one that cannot be faked. The compiler is written in Cryo, compiled by the Python front end, then used to compile *itself* — and the two outputs must be byte-identical:

```bash
python burnout/tests/test_bootstrap.py
```

> A compiler that reproduces itself byte-for-byte has to implement the language correctly enough to build its own source. It is the strongest single piece of evidence that the language is real and complete, which is why it is a project invariant rather than a milestone.

## What it is not

Being honest about the edges is part of the answer:

- **Not a production runtime.** The VM is a straightforward switch dispatch; it is not competing with V8 or the JVM on speed.
- **Not feature-complete on every backend.** The [coverage matrix](#/backends) is explicit about which target supports what — `asm` and `wasm` cover numeric subsets on purpose.
- **Not a package ecosystem.** There is a module system and foreign libraries, but no registry.

The [roadmap](#/roadmap) tracks what is done and what is not, phase by phase.
