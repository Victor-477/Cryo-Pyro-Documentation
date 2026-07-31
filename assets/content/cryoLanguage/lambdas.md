---
title: "First-class functions & lambdas"
group: "The Cryo Language"
lead: "Functions are values: pass them as arguments, return them, store them in variables, and write anonymous **lambdas** — including **closures** that capture their environment."
---
> Available on **go**, **node** and — since Phase 10.6 — the **pyro** backend (and therefore the [native AOT route](#/nativo) too). Pyro supports named functions as values and **non-capturing** lambdas; a lambda that closes over an enclosing variable is reported with a clear error, since the VM has no closure cells yet. Use go/node for true closures.


## Function types

A function type is written `fn(T1, T2, ...) -> R` (the `-> R` is optional; it defaults to `void`). Use it for variables, parameters and return types:

```cryo
fn(int) -> int        oneParameter;
fn(int, int) -> number  two;
fn(string) -> void    effect;
```

## Lambdas

An anonymous function is `(params) => expr` (implicit return) or `(params) => { ...statements... }`:

```cryo
fn(int)->int inc  = (int x) => x + 1;      // expression body
fn(int)->int factN = (int n) => {           // block body
    int acc = 1;
    for (int i = 2; i <= n; i++) { acc *= i; }
    return acc;
};
print(inc(41));       // 42
print(factN(5));       // 120
```

## Functions as arguments

A named function is itself a value — pass it where a `fn(...)->...` is expected:

```cryo
fn double(int n) -> int ={ return n * 2; }

fn apply(fn(int)->int f, int x) -> int ={
    return f(x);
}

print(apply(double, 21));               // 42
print(apply((int x) => x + 100, 1));   // 101 (lambda inline)
```

## Returning functions & closures

A function can return a function. A lambda **captures** the variables in scope where it is created — that is a *closure*:

```cryo
fn adder(int base) -> fn(int)->int ={
    return (int x) => x + base;      // captures `base`
}

fn(int)->int sum10 = adder(10);
print(sum10(5));    // 15
```

## A `map` over an array

First-class functions make higher-order helpers natural:

```cryo
fn map_array(int[] xs, fn(int)->int f) -> int[] ={
    int[] out = [];
    for (int v in xs) { out.push(f(v)); }
    return out;
}

int[] triples = map_array([1, 2, 3, 4], (int x) => x * 3);   // [3, 6, 9, 12]
```

See the full program in [`example_lambdas.cryo`](#/exemplos).

## How it works on the Pyro VM

Two opcodes back function values: `PUSHFN` pushes a function value (the function's table index), and `CALL_VALUE` calls the function value sitting beneath the arguments. Both VMs add a matching value kind (`kFunc` / `VAL_FUNC`), and the AOT lowers `CALL_VALUE` to a dispatch through a C **function-pointer table** — so a natively compiled binary gets the same semantics.

```cryo
fn dbl(int x) -> int ={ return x * 2; }
fn apply(fn(int)->int f, int v) -> int ={ return f(v); }

print(apply(dbl, 21));                 // 42 — a named function as a value
print(apply((int x) => x + 1, 41));    // 42 — a non-capturing lambda

fn(int)->int g = dbl;                  // stored in a variable
print(g(50));                          // 100
```

A **non-capturing** lambda becomes a synthetic top-level function, so it costs nothing extra at runtime. A **capturing** lambda (a true closure) turns its free variables into the callee's leading locals, bundled at creation time by `CLOSURE`.

```cryo
fn adder(int base) -> fn(int)->int ={
    return (int x) => x + base;      // captures `base`
}
fn(int)->int add10 = adder(10);
print(add10(5));                    // 15
```

> Capture is **by value**, so a captured variable must be *effectively final* — never reassigned in the enclosing function. That is deliberate: go and node capture by reference, so allowing a later write would make the same program print different things per backend. The compiler reports the rule (and the fix: copy into a new variable) instead of silently diverging.

**Chained calls** work too — you can call the function a call returns, without going through a variable:

```cryo
fn pick(bool b) -> fn(int)->int ={ if (b) { return dbl; } return inc; }
print(pick(true)(10));    // 20
```

See `example_funcvalues.cryo` in [Examples](#/exemplos).
