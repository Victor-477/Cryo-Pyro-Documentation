---
title: "Semantic analysis"
group: "The Burnout Compiler"
lead: "Before generating code, the compiler runs a semantic pass that catches common errors early — and the same way on every backend."
---
The analysis runs after the parse and [module resolution](#/modulos), with the full AST (including imported declarations). It is **conservative**: it only flags what is unambiguous, so it never rejects a valid program.

## What is checked

| Error | Example |
|---|---|
| Undeclared variable | `print(y)` without `y` |
| Unknown function | `foo(1)` without `fn foo` nor a builtin |
| Wrong arity | `fn add(a,b)` called with 1 argument |
| Assignment to undeclared | `x = 5` without declaring `x` |
| `break`/`continue` outside a loop | — |
| Duplicate top-level declaration | two `fn f` in the same scope |

## Example output

Each problem is rendered against its own source line, with a caret under the
name it is about:

```text
$ python burnout/cryoc.py app.cryo
[Semantic Error] semantic analysis found 2 problems:

[Semantic Error] undeclared variable 'total'
  --> app.cryo:5:7
    |
  5 | print(total);
    |       ^^^^^

function 'add' expects 2 argument(s), got 1
  --> app.cryo:6:1
    |
  6 | print(add(1));
    | ^^^^^^^^^^^^^^
```

Where a close name exists it is offered — *did you mean `len`?* for `lenght`,
by edit distance, so a transposition is caught and not just a dropped letter.
The suggestion stays silent when nothing is close: a confident wrong one sends
you hunting in the wrong place.

Errors are **accumulated** and reported together, rather than stopping at the first.

## Syntax errors are batched too

The parser recovers at statement boundaries, so a file with three typos reports
three rather than costing three compiles:

```text
$ python burnout/cryoc.py app.cryo
[Syntax Error] the parser found 2 problems:

[Syntax Error] Unexpected token in expression: SEMICOLON (';')
  --> app.cryo:1:12
    |
  1 | int a = 1 +;
    |            ^

[Syntax Error] Unexpected token in expression: STAR ('*')
  --> app.cryo:3:9
    |
  3 | int c = * 3;
    |         ^
```

Recovery is contained **inside** the block that failed, which is what keeps the
extra errors real. A parser that unwinds too far resumes in the wrong place and
invents a cascade — an error inside an `if` used to report the perfectly valid
`} else {` as a second problem. Reporting is also capped: past ten the parse has
lost the thread, and the honest advice is to fix those and compile again. Type names (struct/enum/schema) and enum members (`Level_HIGH`) are recognized; functions may be called before they are declared (mutual recursion and forward references work).

> Available on the API: `burnout.semantic_check(ast)` raises `burnout.SemanticError`.
