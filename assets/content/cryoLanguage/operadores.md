---
title: "Operators"
group: "The Cryo Language"
lead: "Arithmetic, comparison, logical, bitwise and compound assignment."
---
## Arithmetic

`+`  `-`  `*`  `/`  `%` — plus `++` and `--`. In safe mode, `+ - *` go through overflow checks and `/ %` abort on division by zero (see [Security](#/seguranca)).

## Comparison and logical

| Comparison | Logical |
|---|---|
| `==` `!=` `<` `>` `<=` `>=` | `&&` `||` `!` |

## Bitwise

```cryo
int packed = (0x12 << 8) | 0x34;   // -> 0x1234
bool par = (n & 1) == 0;
int inverse = ~mask;
```

Operators: `&` (and), `|` (or), `^` (xor), `~` (not), `<<` (shift left), `>>` (shift right).

## Compound assignment

Each binary operator has its compound form:

```cryo
x += 1;   x -= 1;   x *= 2;   x /= 2;   x %= 3;
x &= m;   x |= m;   x ^= m;   x <<= 2;  x >>= 2;
```

## Null-coalescing

`??` returns the left side if it is not `null`, otherwise the right:

```cryo
string reading = null;
string result = reading ?? "no reading";   // "no reading"
```

See also the `x!` unwrap in [Optionals](#/opcionais).
