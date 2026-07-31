---
title: "Collections, slices & ranges"
group: "Examples"
lead: "Arrays and maps, the non-mutating collection operations, and `a..b` both as a loop and as a value."
---
Arrays, maps and the collection builtins. Everything here runs on `pyro`, `go` and `node`.

## Slices and ranges

The same `..` / `..=` works in a loop, as a slice, and as a value:

```cryo
int[] xs = [10, 20, 30, 40, 50];

// slicing — on arrays and strings alike, bounds always clamp
print(xs[1..3]);        // [20, 30]      end excluded
print(xs[1..=3]);       // [20, 30, 40]  end included
print(xs[2..]);         // [30, 40, 50]  to the end
print(xs[..2]);         // [10, 20]      from the start
print(xs[3..99]);       // [40, 50]      clamped, not an error
print("hello world"[0..5]);   // hello

// a range OUTSIDE a for loop is the array itself
int[] r = 0..5;         // [0, 1, 2, 3, 4]
print(sum(0..5));       // 10
print((2..6)[1]);       // 3

// ...but inside one it is still a counted loop, allocating nothing
for (int i in 0..3) { print(i); }   // 0 1 2
```

A slice is a **copy**: mutating it leaves the source untouched.

## Collection operations

All non-mutating — each returns a fresh array:

```cryo
int[] nums = [3, 1, 4, 1, 5];

print(sort(nums));          // [1, 1, 3, 4, 5]
print(reverse(nums));       // [5, 1, 4, 1, 3]
print(index_of(nums, 4));   // 2
print(count(nums, 1));      // 2
print(sum(nums));           // 14
print(concat(nums, [9]));   // [3, 1, 4, 1, 5, 9]
print(nums);                // [3, 1, 4, 1, 5] — untouched
```

## Maps

```cryo
map<string, number> prices = { "coffee": 5.5, "tea": 4.0 };
prices["juice"] = 6.0;

if (has(prices, "tea")) { print(prices["tea"]); }
for (string k in keys(prices)) { print("${k} = ${prices[k]}"); }
```

```bash
python burnout/cryoc.py demo.cryo --backend pyro --run
```
