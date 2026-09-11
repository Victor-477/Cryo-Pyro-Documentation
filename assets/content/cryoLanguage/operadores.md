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

### What `==` compares

Numbers, `bool` and `string` compare **by value**; an `int` and a `number` are
promoted before comparing. Arrays and maps compare by **reference identity**:

```cryo
int[] a = [1];
int[] b = [1];
print(a == b);      // false — two different arrays
print(a == a);      // true
```

Two arrays with equal contents are not equal. This is deliberate and it is the
rule on every backend, not a VM detail: passing an array to a function shares
the same object, so identity is the question `==` can answer consistently.

### What can be `null`

`null` is equal only to `null`. A value of a type that has no null to be — `int`,
`number`, `bool`, a struct — is therefore never `null`, and a container is not
`null` either just for being empty:

```cryo
map<string,int> m = {"a": 1};
print(m == null);        // false
int[] e = [];
print(e == null);        // false, an empty array is still an array
string s = "";
print(s == null);        // false, so is an empty string
int? maybe = null;
print(maybe == null);    // true — an optional is the type that can be null
```

The comparison is folded to a constant on the backends whose host language
would otherwise answer differently: Go rejects `"" == nil` outright, and C folds
`0 == NULL` to **true**, which was the wrong answer in code that built cleanly.
See [Optionals](#/opcionais) for the type that does have a null.

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
