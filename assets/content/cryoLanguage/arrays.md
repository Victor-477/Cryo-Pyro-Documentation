---
title: "Arrays"
group: "The Cryo Language"
lead: "Homogeneous lists with literals, indexing, `push` and iteration."
---
## Literals and indexing

```cryo
int[] nums = [3, 1, 4, 1, 5, 9];
int first = nums[0];
nums[0] = 100;               // assignment by index
```

## len and push

```cryo
nums.push(10);               // append
int n = len(nums);           // current length
```

## Iteration

```cryo
int total = 0;
int max = 0;
for (int v in nums) {
    total += v;
    if (v > max) { max = v; }
}
```

## Slicing

`xs[a..b]` takes a **range of positions** instead of one, using the same `..` / `..=` you already use in a `for`:

```cryo
int[] xs = [10, 20, 30, 40, 50];

print(xs[1..3]);     // [20, 30]        end excluded
print(xs[1..=3]);    // [20, 30, 40]    end included
print(xs[2..]);      // [30, 40, 50]    to the end
print(xs[..2]);      // [10, 20]        from the start
```

Bounds are **clamped, never an error** — asking for more than exists gives you what exists:

```cryo
print(xs[3..99]);    // [40, 50]
print(xs[0..0]);     // []
```

A slice is a **copy**. Changing it never touches the original:

```cryo
int[] part = xs[0..2];
part[0] = 999;
print(part[0]);      // 999
print(xs[0]);        // 10   — untouched
```

The same syntax slices **strings**, where it yields a substring:

```cryo
string s = "hello world";
print(s[0..5]);      // hello
print(s[6..]);       // world
```

> An open-ended `xs[a..]` needs a plain variable on the left. The compiler has to use the value twice — once to slice, once for its length — so a call or a complex expression is rejected rather than silently evaluated twice. Assign it to a variable first.

## Ranges as values

Outside a `for`, `a..b` **is** the array of those integers:

```cryo
int[] r = 0..5;      // [0, 1, 2, 3, 4]
print(1..=4);        // [1, 2, 3, 4]
```

It is an ordinary value, so it composes like one:

```cryo
print(sum(0..5));    // 10
print((2..6)[1]);    // 3
print(len(0..100));  // 100
```

`..` binds looser than arithmetic, so `0..n+1` reads as `0..(n+1)`. Reversed or empty bounds give an empty array rather than an error:

```cryo
print(len(5..2));    // 0
print(len(0..0));    // 0
```

> **This costs nothing in a loop.** `for (int i in 0..n)` still compiles to a plain counted loop and allocates no array — only a range used *as a value* builds one.

## Arrays of any type

The element can be any type — including `struct` or `future<T>`:

```cryo
future<int>[] pending = [];
for (int id in ids) {
    pending.push(spawn task(id));
}
```

> **Bounds-checking:** on the Go backend, out-of-range access is guaranteed by the runtime itself; on the C backend, by the `cryo_runtime.c` runtime; on the Pyro VM, by the `INDEX`/`SETIDX` opcodes.
