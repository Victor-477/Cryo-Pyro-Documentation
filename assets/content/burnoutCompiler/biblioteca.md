---
title: "Burnout as a library"
group: "The Burnout Compiler"
lead: "Beyond the CLI, Burnout is an **importable Python package** — call the compiler straight from your projects."
---
## Installation

Install in editable mode from the `burnout` folder (inside the Cryo monorepo, with `../cryo` and `../pyro` alongside):

```bash
cd burnout
pip install -e .
```

This registers the `burnout` package and the `cryoc` console script.

## Compiling from code

```python
import burnout

# .cryo string -> target code (str for go/c/asm, bytes for pyro)
go_src = burnout.compile_source('print("ola");', backend="go")
bc     = burnout.compile_source('print(1 + 2);', backend="pyro")

# compile a file and (optionally) run it
burnout.compile_file("app.cryo", backend="pyro", run=True)
burnout.run("app.cryo", backend="go")   # shortcut for compile_file(run=True)
```

## Front-end and bytecode

```python
toks = burnout.tokenize(open("app.cryo").read())   # token list
ast  = burnout.parse_ast(open("app.cryo").read())  # AST (Program)

# disassemble a generated .pyro
print(burnout.disassemble(open("build/app.pyro", "rb").read()))
```

## Public API

| Symbol | Description |
|---|---|
| `compile_source(src, backend='go', safe=True, abi=None)` | compiles a string; returns str (go/c/asm) or bytes (pyro) |
| `compile_file(path, backend='go', run=False, ...)` | compiles a file; optionally builds/runs |
| `run(path, backend='go', **kw)` | shortcut for `compile_file(run=True)` |
| `parse_ast(src)` / `tokenize(src)` | CRYO front-end |
| `load_ast(src, base_dir)` | parse + module resolution |
| `select_backend(ast)` | recommended backend + reason (used by `backend="auto"`) |
| `semantic_check(ast)` | semantic analysis (raises `SemanticError`) |
| `disassemble(bytes)` | readable listing of a `.pyro` |
| `default_abi()` | platform default ABI (asm backend) |
| `BACKENDS` | `('go', 'pyro', 'c', 'asm', 'node')` |
| `__version__` | compiler version |

Exceptions: `LexerError`, `ParseError`, `SemanticError`, `ForeignError`, `ModuleError`, `CodeGenError`, `CodeGenGoError`, `CodeGenAsmError`, `CodeGenPyroError`, `CodeGenNodeError`.

## As an executable module

The same CLI as `cryoc.py`, via `-m`:

```bash
python -m burnout app.cryo --backend go --run
cryoc app.cryo --run        # console script installed by pip
```

> **Windows:** if `pip install -e .` fails writing `Scripts\cryoc.exe` (file in use), the package is still importable — use `python -m burnout`, or repeat the install with terminals closed.
