---
title: "Optionals & null-safety"
group: "The Cryo Language"
lead: "The `T?` type models absence of value safely: `??`, the `x!` unwrap and the `x == null` comparison."
---
> Optionals are available on the **go**, **node** and **pyro** backends (`??`, `x!` and `== null`).

## Declaring optionals

Append `?` to the type to allow `null`:

```cryo
number? found = null;
string? reading = obterLeitura();
```

## Providing a default with ??

```cryo
number final = found ?? 0.0;       // use 0.0 if found is null
string txt   = reading ?? "empty";
```

## Comparing with null

```cryo
if (found == null) {
    print("not found");
}
```

## Unwrap with !

`x!` extracts the value of an optional you know is not null:

```cryo
number value = found!;   // assumes found != null
```

> Prefer `??` or the `== null` check when in doubt — the unwrap assumes the value exists (it aborts on null in the Pyro VM).
