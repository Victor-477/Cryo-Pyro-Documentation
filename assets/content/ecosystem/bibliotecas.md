---
title: "Writing a library"
group: "Ecosystem"
lead: "A Cryo library is a module with a `pub` API, shipped as a package and tested with `cryoc test`. Written in plain Cryo, it runs on every backend unchanged."
---
## The shape of a library

A library is an ordinary `.cryo` file. What it marks `pub` is its API.
Everything else, helpers and module state included, stays private (see
[Modules](#/modulos)):

```cryo
// math.cryo
pub const number PI = 3.141592653589793

fn _fail(string msg) -> number ={
    throw("[my-math] " + msg);
}

pub fn sqrt(number x) -> number ={
    if (x < 0.0) { return _fail("sqrt: negative argument"); }
    if (x == 0.0) { return 0.0; }
    number g = x;
    for (int i = 0; i < 60; i++) {
        number next = 0.5 * (g + x / g);
        if (next == g) { break; }
        g = next;
    }
    return g;
}
```

```cryo
// app.cryo
import "math.cryo" as m;

print(m::sqrt(2.0));        // 1.414213562373095
print(m::PI);
```

Import it **with a namespace**. Behind `as m`, the library's `sqrt` is a
separate name from the builtin `sqrt`, so a library is free to use any name
without colliding with the program that imports it, or with a builtin.

`m::name` works anywhere an expression does, including inside `try`, `switch`,
`assert`, `match`, `unsafe { }`, `x!` and `expr?`.

## Errors a caller can handle

`throw` a string with a recognisable prefix, and the caller decides what to do
with it:

```cryo
import "math.cryo" as m;

try {
    print(m::sqrt(-4.0));
} catch (string e) {
    print(e);                // [my-math] sqrt: negative argument
}
```

Keep `throw` for bad arguments. What a library must **not** do is lean on the
fail-fast safety aborts: integer overflow, `to_int("abc")` and an
out-of-bounds index end the process, and no `catch` can stop that. Validate
first, or use the forms that return instead of aborting, such as `parse_int`,
`parse_number` and `checked_add` (see [Builtins](#/builtins)).

## Shipping it as a package

Put a `cryo.toml` next to the library:

```toml
[package]
name = "my_math"
version = "0.1.0"
```

and declare it from the project that uses it:

```toml
[dependencies]
my_math = "../my-math"
```

```cryo
import "@my_math/math.cryo" as m;
```

A dependency is a path on disk, and `cryo.lock` pins it by content. See
[Packages](#/pacotes) for the rules and the lock.

## Testing it

```cryo
// tests/math_test.cryo
import "../math.cryo" as m;

test fn sqrt_of_a_square() ={
    assert(m::sqrt(144.0) == 12.0, "sqrt(144)");
}
```

```bash
python burnout/cryoc.py test tests/                    # pyro
python burnout/cryoc.py test tests/ --backend node     # same suite, another engine
```

Running the suite on two or three backends is the cheapest way to prove the
library really is portable. See [Testing](#/testes).

## Staying portable

There are four ways to add a capability to Cryo. For a library, prefer them in
this order:

| How | Runs on | Cost |
|---|---|---|
| **Plain Cryo** in a module | every backend | none: no backend knows the library exists |
| A **front-end lowering** (how `lines`, `chars` and `title_case` are built) | every backend | one change, in the parser |
| A **native builtin** | the engines that implement it | one entry per engine, kept in step by hand |
| A **foreign block** (`>go( … )`, `library >go net/http<`) | one backend | free to write, but ties the library to it |

Reach for a native only for what Cryo cannot express by itself: I/O, the OS,
time and the network. Mathematics can be written in Cryo itself, as the example below shows.

## A real example: Cryo-Math

[Cryo-Math](https://github.com/Victor-477/Cryo-Math) is a math library written
this way. It has roughly 60 functions: trigonometric and hyperbolic functions
and their inverses, `exp`/`ln`/`log`, roots, combinatorics, primes and
statistics. It uses **no math builtin at all**: sine, logarithm and exponential
are series with range reduction, and square root is Newton's method. Results are
within about 1e-16 of the C library, and the same test suite passes on `pyro`,
`node` and `go`.

[Cryo Calculator](https://github.com/Victor-477/Cryo_Calculator) is built on top
of it: a scientific calculator with a recursive-descent parser, variables,
degree/radian mode and implicit multiplication (`2pi`, `3(4+1)`). It depends on
Cryo-Math through `cryo_math = "../Cryo-Math"` in its `cryo.toml`.

```bash
git clone https://github.com/Victor-477/Cryo-Math.git
git clone https://github.com/Victor-477/Cryo_Calculator.git
python burnout/cryoc.py Cryo_Calculator/main.cryo --backend pyro --run
```

## What is not there yet

- **No standard library to import by name.** A shared module is reached by a
  relative path or a `path` dependency. A built-in `@std/...` shipped with the
  compiler has been proposed in
  [`burnout/docs/BIBLIOTECAS.md`](https://github.com/Victor-477/Burnout/blob/main/docs/BIBLIOTECAS.md),
  together with git dependencies pinned to a commit.
- **`print` of a `number` is not identical on every backend.** For example,
  `1e10 + 1.0` prints `1.0000000001e+10` on pyro and go, `10000000001` on node
  and `1e+10` on c. If a library's output must be byte-identical, format it
  explicitly with `${x:.6f}`.
