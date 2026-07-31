---
title: "Functions, lambdas & closures"
group: "Examples"
lead: "Functions as values — passed, stored, returned and capturing — including on the Pyro VM itself."
---
## Passing and returning functions

```cryo
fn twice(fn(int)->int f, int x) -> int ={ return f(f(x)); }

fn inc(int n) -> int ={ return n + 1; }

print(twice(inc, 10));                  // 12

// a lambda, and a function returned from a function
fn adder(int by) -> fn(int)->int ={
    return (int x) => x + by;           // `by` is captured
}

fn(int)->int add5 = adder(5);
print(add5(10));                        // 15
print(adder(2)(40));                    // 42 — chained call
```

> **Capture is by value**, and a captured variable must be *effectively final*. That rule is what keeps the `pyro` backend identical to `go` and `node` (which capture by reference) instead of quietly disagreeing — the compiler explains the rule rather than miscompiling. See [first-class functions](#/lambdas).

```bash
python burnout/cryoc.py demo.cryo --backend pyro --run
```
