---
title: "Basic syntax"
group: "The Cryo Language"
lead: "Variables, comments, `print` and the general rules of the language."
---
## Variable declaration

Cryo is **statically typed**. Every variable declares its type before the name:

```cryo
int    age   = 30;
number price   = 19.90;
string name    = "Ana";
bool   active   = true;
```

The semicolon ends a statement. Whitespace and line breaks are free.

## Constants

Use `const` for immutable values (typically at the top of the file):

```cryo
const number PI     = 3.14159265
const string VERSAO = "0.9.0"
const int    MASK   = 0xFF
```

## Comments

```cryo
// line comment

/* block
   comment */
```

## Output

`print(v)` prints any value according to its type — ints, numbers, strings, bools, arrays, maps and structs:

```cryo
print("text");
print(42);
print(3.14);
print(true);
print([1, 2, 3]);
```

## String interpolation

Use `${expr}` inside a string literal — any expression works, and the conversion to text is automatic:

```cryo
int n = 3;
print("n is ${n}, double is ${n * 2}");
print("area = ${circleArea(2.5)}");
```

The compiler desugars it to concatenation with `to_string(...)` — works on the pyro, go and node backends. `${` without a closing `}`, an empty `${}`, or a fragment that is not a single complete expression (`${x y}`) are syntax errors.

### Format specs

An interpolation can carry a **format spec** after a colon. It is a subset of the format mini-language used by Python and Rust — a convention worth reusing rather than reinventing:

```
${ expr : [[fill]align] [0] [width] [,] [.precision] [type] }
```

| Part | Meaning |
|---|---|
| `fill` | any single character, written **before** the align character |
| `align` | `<` left · `^` centre · `>` right |
| `0` | pad with zeros, inserted **after** any minus sign |
| `width` | minimum width; a longer value is never truncated |
| `,` | group the integer digits in threes |
| `.precision` | decimals for `f`/`%`, or characters to keep for `s` |
| `type` | `f` fixed-point · `d` integer · `s` string · `%` percent |

```cryo
number pi = 3.14159265;
print("${pi:.2f}");            // 3.14
print("${pi:.0f}");            // 3        — no decimal point
print("${0.5:.3f}");           // 0.500    — trailing zeros kept
print("${1234567.891:,.2f}");  // 1,234,567.89
print("${1000000:,d}");        // 1,000,000
print("${0.4567:.1%}");        // 45.7%
print("[${42:05d}]");          // [00042]
print("[${0 - 42:05d}]");      // [-0042]  — the sign stays in front
print("[${\"cryo\":^10}]");     // [   cryo   ]
print("[${\"cryo\":.>10}]");    // [......cryo]
print("${\"cryogenic\":.4s}");  // cryo
```

The motivating case is an aligned table, which previously needed a manual `pad_start`/`pad_end` on every cell:

```cryo
print("${name:<18}${qty:>7,d}${price:>12,.2f}${total:>14,.2f}");
```

See [`example_format.cryo`](https://github.com/victorscosta/Pyro_Cryo/blob/main/Cryo/examples/example_format.cryo) for the full set.

**Things worth knowing.**

- **Rounding is half-away-from-zero**, so `${0.125:.2f}` is `0.13` and `${0.0 - 0.125:.2f}` is `-0.13`. That matches `round()` as both VMs implement it (C's `round`, Go's `math.Round`) rather than Python's banker's rounding. The digits come from integer arithmetic after a single `round()`, not from float formatting — float formatting is precisely where backends disagree, and the point of desugaring is that they cannot.
- **A colon is not always a spec.** `${n > 3 ? 10 : 2}` stays a ternary: a spec is only recognised when the text before the colon is a complete expression *and* the text after it is a valid spec. A namespaced `${geo::area(r)}` is likewise untouched.
- **A malformed spec is a compile error**, never a spec that quietly disappears. `${x:>4q}` reports an unsupported spec, and `${x:.2}` asks you to say whether you meant `.2f` (two decimals) or `.2s` (two characters) — with no types at parse time it cannot guess, and guessing wrong would turn `${pi:.2}` into `3.` silently.
- **Without a type, alignment defaults to left**, because the parser has no type information; `${n:5}` left-aligns even for an integer. Write `${n:5d}` or `${n:>5}` for the other one.
- **Backends.** pyro, go and node are byte-identical. A spec with a **width** needs `repeat`/`pad_start`/`starts_with`, which the C backend does not implement for any program, so it refuses with the usual `--backend go, node or pyro`; precision and grouping avoid those three deliberately and do work on C. The [self-hosted compiler](#/selfhost) does not implement specs and refuses them explicitly rather than dropping them.

## Input

`input(prompt)` reads one line from the terminal and returns a `string`:

```cryo
string name = input("Your name: ");
print("Hello, " + name);
```

> `input()` is flagged as `untrusted-input` (LOW) by the [static audit](#/seguranca).

## The `={` body

A Cryo quirk: the body of functions, `tool` and `skill` opens with **`={`** (the lexer treats `={` as a single token). The rest of the language uses `{ }` normally (in `if`, `for`, structs, etc.).

```cryo
fn double(int x) -> int ={    // body opens with ={
    return x * 2;
}
```
