---
title: "Control flow"
group: "The Cryo Language"
lead: "`if`/`else`, `while`, `do/while`, the classic `for`, for-each, ranges, `switch` and `break`/`continue`."
---
## if / else

```cryo
if (n < 0) {
    print("negative");
} else if (n == 0) {
    print("zero");
} else {
    print("positive");
}
```

## while and do/while

```cryo
int i = 0;
while (i < 10) { i++; }

do {
    i--;
} while (i > 0);
```

## classic for

```cryo
int sum = 0;
for (int i = 0; i < 5; i++) {
    sum += i;
}
```

## for-each

Iterates over arrays, strings and `keys(map)`:

```cryo
int[] values = [10, 20, 30];
for (int v in values) {
    print(v);
}

map<string, int> estoque = {"apple": 10, "pear": 5};
for (string k, int v in estoque) {   // key and value together
    print("${k}: ${v}");
}

for (string c in "abc") { print(c); }   // iterate characters
```

## ranges

Loop over a range of integers without a manual counter — the `0..n` idiom from Python, Rust, Kotlin and Swift. `..` is **exclusive**, `..=` is **inclusive**:

```cryo
for (int i in 0..5)  { print(i); }   // 0 1 2 3 4
for (int i in 1..=5) { print(i); }   // 1 2 3 4 5

int n = 3;
for (int i in 0..n) { print(i); }    // bound can be any int expression
```

A range lowers to an ordinary counted loop at parse time (`i < b` / `i <= b`), so it costs nothing at runtime and works on **every backend** — including [wasm](#/wasm) and the [native route](#/nativo). The loop variable must be `int`; an empty range (`4..4`) simply does not iterate.

## Iterating maps, and your own types

**Two loop variables mean key and value.** A map is iterated directly:

```cryo
map<string,int> stock = {"bolts": 40, "nuts": 12};

for (string item, int qty in stock) {
    print("${item:<10}${qty:>4}");
}
```

`pairs(m)` means exactly the same thing and reads well when you want to be explicit. Keys need not be strings, `break`/`continue` behave as in any loop, and an empty map simply does not iterate.

For an **array**, one variable gives the elements and `enumerate` adds the index:

```cryo
for (string step in queue) { print(step); }
for (int i, string step in enumerate(queue)) { print("${i}: ${step}"); }
```

> The two-variable form *means* a map. The parser has no type information at that point, so it cannot tell a map from an array — which is why an array needs `enumerate`. Passing an array to the two-variable form fails in `keys()`, which says so.

### Making your own type iterable

Implement a trait method named **`iter()`** returning a collection, and `for (x in obj)` works on your type — it becomes `for (x in obj.iter())`:

```cryo
trait Iterable {
    fn iter() -> int[];
}

struct Countdown { int n; }

impl Iterable for Countdown {
    fn iter() -> int[] ={
        int[] out = [];
        for (int i = this.n; i > 0; i = i - 1) { out.push(i); }
        return out;
    }
}

Countdown c = Countdown { n: 3 };
for (int x in c) { print("tick ${x}"); }   // 3, 2, 1
```

It applies wherever the receiver's declared type is known — a variable, a function parameter, or a struct literal written in place. The rewrite happens at compile time in the traits pass (the parser has no types), so it costs nothing at run time, and calling `.iter()` yourself is always equivalent.

The rewrite is intentionally conservative: only an identifier with a declared type or a struct literal is rewritten, so ordinary arrays and maps in the same program are untouched. If it ever guessed wrong the result would be a compile error — `iter()` called on an array — rather than a loop that quietly did something else.

See [`example_iteration.cryo`](https://github.com/victorscosta/Pyro_Cryo/blob/main/Cryo/examples/example_iteration.cryo).

## switch / case / default

A `case` without `break`/`return` falls through to the next one — handy for grouping:

```cryo
fn dayName(int d) -> string ={
    switch (d) {
        case 0:
        case 6:
            return "weekend";
        case 1: return "monday";
        default:
            return "weekday";
    }
}
```

## break / continue

```cryo
for (int i = 2; i < n; i++) {
    if (n % i != 0) { continue; }   // skip to the next iteration
    return i;                        // first divisor
}
```

## Ternary operator

```cryo
bool large = sum > 100 ? true : false;
```
