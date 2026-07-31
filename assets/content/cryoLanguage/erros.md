---
title: "Error handling"
group: "The Cryo Language"
lead: "`try` / `catch` / `finally`, `throw` and `assert`."
---
## try / catch / finally

```cryo
string estado = "ok";
try {
    if (sum > 100) {
        throw("sum too large");
    }
} catch (string err) {
    estado = "caught: " + err;
} finally {
    print("always runs");
}
```

> `try/catch/finally` works on the **go**, **node** and **pyro** backends. On Go it is `func(){ defer/recover }()` and `throw` becomes `panic`; on the Pyro VM there are dedicated instructions (`TRYPUSH`/`THROW`) with a handler stack. Low-level safety aborts (division by zero, out-of-bounds index) are fail-fast on the Pyro VM — on Go they are catchable via recover.

## assert

`assert` aborts execution if the condition is false — part of [safe mode](#/seguranca):

```cryo
assert(factorial(10) == 3628800, "factorial incorrect");
assert(packed == 0x1234);   // message is optional
```

## Always-on safety

Even without `try`, safe mode protects against integer overflow and division by zero. See [Code security](#/seguranca).

## Error propagation with `?`

For the `Result` pattern (a sum type with an `Ok` variant), the postfix `?` operator removes the boilerplate of checking every call. `expr?` evaluates to the payload of `Ok(v)`; if it is any other variant (e.g. `Err(e)`), the enclosing function **returns early** with that value:

```cryo
enum Result { Ok(int), Err(string) }

fn parse(string s) -> Result ={
    if (s == "42") { return Ok(42); }
    return Err("invalid: " + s);
}

fn sum(string a, string b) -> Result ={
    int x = parse(a)?;        // if Err, sum() returns that Err right here
    int y = parse(b)?;
    return Ok(x + y);
}
```

This is the concise equivalent of matching each call and returning the error by hand. The enclosing function must return the **same** `Result` enum so the propagated `Err` fits.

> Works on the **go**, **node** and **pyro** backends (c/asm report a clear error). `?` is allowed at the level of an assignment, declaration (`T x = expr?;`), `return`, or expression-statement — not nested inside a larger expression. It is disambiguated from the ternary `a ? b : c` by look-ahead. See [`example_try.cryo`](#/exemplos).

## How errors are reported

A compiler error names the line, prints it, and puts a caret under what went wrong:

```text
[Semantic Error] unknown function 'lenght'
  --> app.cryo:6:13
    |
  6 | int total = lenght(items);
    |             ^^^^^^
    = did you mean `len`?
```

**Every problem in a pass is reported at once**, not the first one — fixing a file should not cost one recompile per mistake:

```text
[Semantic Error] semantic analysis found 3 problems:
```

**Did-you-mean** is offered when a close name exists. It is edit-distance based, so a transposition (`lenght` → `length`) and a dropped character (`totl` → `total`) are both caught, and the candidates are drawn from exactly what would have been accepted at that point — a suggestion never names something you could not have written there.

> When nothing is close, no suggestion is offered. A confident wrong one sends you hunting in the wrong place, which is worse than none at all.

Syntax errors are shown the same way, with the caret under the token that stopped the parse:

```text
[Syntax Error] Unexpected token in expression: SEMICOLON (';')
  --> app.cryo:2:15
    |
  2 |     return n *;
    |               ^
```

## Guarded match cases

`?` handles the errors you do not want to deal with here. Once you *do* have the value, a **guard** attaches a condition to a pattern, so one constructor can take several branches:

```cryo
match r {
    Ok(v) if v > 100 => print("huge   ${v}");
    Ok(v) if v > 10  => print("big    ${v}");
    Ok(v)            => print("small  ${v}");
    Err(e)           => print("failed: ${e}");
}
```

Cases are tried top to bottom and the first whose pattern *and* guard hold wins. Without guards the same logic needs a nested `if` inside the `Ok` arm, which puts the interesting condition a level away from the pattern it belongs to.

A guard is an ordinary expression: it can call functions, read module state, use `&&`/`||`, and be wrapped in parentheses.

```cryo
int threshold = 10;

match r {
    Ok(v) if (v > threshold) && even(v) => print("big and even");
    Ok(v) if v > threshold             => print("big and odd");
    Ok(v)                              => print("small");
    Err(e)                             => print("error: ${e}");
}
```

**Falling through.** If no guard for a constructor holds and there is no unguarded case for it, control reaches the `_` case:

```cryo
match r {
    Ok(v) if v < 0  => print("negative");
    Ok(v) if v == 0 => print("zero");
    _               => print("everything else");   // Ok(9) lands here
}
```

With no `_` case, a constructor whose guards all fail simply does nothing — it never falls into a *different* constructor's arm.

**Two things the compiler refuses**, because guards are lowered by collapsing the cases that share a constructor, and both would otherwise change the meaning of the match:

```cryo
match r {
    Ok(v) => print("y");
    Ok(v) if v > 1 => print("x");   // ⛔ unreachable: the case above
}                                    //    already matches everything

match r {
    Ok(a) if a > 1 => print("x");
    Ok(b) => print("y");            // ⛔ must bind the same name as the
}                                    //    first Ok case — use `a`
```

The second is a real restriction: renaming the body for you would mean silently rewriting your identifiers, so the compiler asks instead. Guards are lowered in the **front end** — the cases sharing a constructor become one case holding an `if`/`else` chain — so no code generator knows guards exist, and **pyro, go and node produce identical output** with no backend-specific behaviour to keep in step. The subject is still evaluated exactly once.

See [`example_match_guards.cryo`](https://github.com/victorscosta/Pyro_Cryo/blob/main/Cryo/examples/example_match_guards.cryo).
