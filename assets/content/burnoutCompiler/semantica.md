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

```text
$ python burnout/cryoc.py app.cryo
[Semantic Error] semantic analysis found 2 problem(s):
  - Line 4: undeclared variable 'total'
  - Line 7: function 'add' expects 2 argument(s), got 1
```

Errors are **accumulated** and reported together (with the line), rather than stopping at the first. Type names (struct/enum/schema) and enum members (`Level_HIGH`) are recognized; functions may be called before they are declared (mutual recursion and forward references work).

> Available on the API: `burnout.semantic_check(ast)` raises `burnout.SemanticError`.
