---
title: "Self-hosting"
group: "Native & Full-Stack"
lead: "The Cryo→Pyro compiler is **written in Cryo**. It runs on the Pyro VM, compiles its own source, and reaches a fixed point."
---
A language is self-hosting when its compiler is written in itself. Cryo's lives in `cryo/selfhost/`:

| File | Role |
|---|---|
| `lexer.cryo` | tokenizer — produces a token stream byte-identical to `cryo/lexer.py` |
| `parser.cryo` | recursive-descent parser — its AST is checked against the reference parser's, statement by statement |
| `semantic.cryo` | the analyser: undeclared names, unknown functions, argument counts, `break` outside a loop |
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

## How the parser is checked

The reference parser (`cryo/parser.py`) is the **oracle**. Both parsers read the
same source, each AST is serialized to the same S-expression, and the two
strings must be equal — statement by statement.

This matters more than it sounds. "It did not crash" is otherwise the only thing
a parser can be checked for, and a parser that quietly drops a clause still
produces output. Comparing against an oracle catches the failures that *look*
like success:

- **Stacked `case` labels are one case, not two.** `case 1: case 2: body` is a
  single case with two values in the reference. Emitting two cases parses the
  same source into a different tree and still runs.
- **`as` binds looser than `||`.** `a || b as int` casts the whole disjunction.
  A cast level placed anywhere else in the precedence chain still parses.

The self-hosted parser covers statements, the full precedence chain, postfix and
slices, string interpolation, `try`/`catch`/`finally`, `switch`, lambdas, map
literals, casts, imports, traits, `spawn`/`await`, and generics — type
parameters with bounds (`fn m<T: Ord>`) and explicit type arguments at a call
site (`id<int>(42)`).

Two of those need a lookahead rather than a leading token, and both have tests
for exactly that reason: `(x) => …` is a lambda but `(a + b)` is grouping, and
`id<int>(…)` takes type arguments but `a < b` is a comparison. In each case only
the token after the matching bracket decides, and the wrong choice still
parses.

Three behaviours are **desugarings** rather than shapes, and are reproduced
rather than parsed literally, because the reference lowers them too: a range
for-loop becomes a C-style `for`, an interpolated string becomes a
concatenation, and a lambda's `=> expr` becomes a body of `return expr`.

## Errors, not just successes

A self-hosted compiler is only finished when it agrees with the reference on
what is an **error**. Until roadmap 13.2 this one had no analyser at all, so it
emitted bytecode for anything it could parse:

```cryo
print(x);        // x is undeclared
```

The reference rejects that. The self-hosted compiler used to compile it, run it,
and print `0` — and for an unknown function it emitted a call to function index
65535, which killed the VM outright. A compiler that turns a typo into a silent
`0` is worse than one that cannot compile the file, because nothing tells you to
look.

The checks are deliberately the *reference's*, not better ones. The reference
accepts `int a = "hi"` — there is no type check at a declaration — so the
self-hosted analyser accepts it too. Agreeing means matching its answers,
including the lenient ones.
