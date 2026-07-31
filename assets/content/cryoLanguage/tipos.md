---
title: "Types"
group: "The Cryo Language"
lead: "Cryo's primitive, composite and optional types."
---
## Primitives

| Type | Description | Example |
|---|---|---|
| `int` | Signed 64-bit integer | `42`, `0xFF`, `1_000` |
| `number` | Floating point (double) | `3.14`, `19.90` |
| `string` | Dynamic UTF-8 text | `"Ola"` |
| `bool` | Boolean | `true`, `false` |
| `void` | Absence of value (function return) | — |

## Numeric literals

The lexer accepts base prefixes and `_` thousands separators:

```cryo
int hex   = 0xFF;        // hexadecimal  -> 255
int bin   = 0b1010;      // binary       -> 10
int oct   = 0o17;        // octal        -> 15
int grand = 1_000_000;   // underscore as separator
number f  = 3.14;
```

## Composites

| Type | Description | Page |
|---|---|---|
| `T[]` | Array of `T` | [Arrays](#/arrays) |
| `map<K, V>` | Map from `K` to `V` | [Maps](#/mapas) |
| `struct` | Record of named fields | [Structs & Enums](#/structs-enums) |
| `enum` | Set of named constants | [Structs & Enums](#/structs-enums) |
| `T?` | Optional (may be `null`) | [Optionals](#/opcionais) |
| `future<T>` | Pending result of `spawn` | [Concurrency](#/concorrencia) |

## Conversions

Builtins convert between primitive types:

```cryo
string s = to_string(42);      // "42"
int    i = to_int("7");        // 7
number n = to_number("3.14");  // 3.14
```

## Mixed int/number arithmetic

When mixing `int` and `number`, the integer is promoted to floating point before the operation — the result is `number`:

```cryo
int    qty   = 2;
number freight = 12.50 + qty * 6.00;   // qty becomes float -> 24.50
```
