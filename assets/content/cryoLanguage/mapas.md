---
title: "Maps"
group: "The Cryo Language"
lead: "`map<K, V>` — dictionaries with `{k: v}` literals, `m[k]` access and the `has`, `keys`, `remove` builtins."
---
> Maps are available on the **go**, **node** and **pyro** backends. See the [backend matrix](#/backends).

## Literals and access

```cryo
map<string, number> prices = {
    "SKU-1": 19.90,
    "SKU-2": 49.90,
    "SKU-3": 5.00
};
prices["SKU-4"] = 99.90;      // insert/update
number p = prices["SKU-2"];
```

## has, keys, remove

| Builtin | Effect |
|---|---|
| `has(m, k)` | `true` if the key exists |
| `keys(m)` | array of keys |
| `remove(m, k)` | removes the key |

```cryo
number sum = 0.0;
for (string k in keys(prices)) {
    sum += prices[k];
}
bool has_item = has(prices, "SKU-1");
```

## Safe lookup with an optional

Combine maps with [optionals](#/opcionais) to avoid errors on missing keys:

```cryo
fn buscarPreco(map<string, number> table, string sku) -> number? ={
    if (has(table, sku)) { return table[sku]; }
    return null;
}

number? found = buscarPreco(prices, "SKU-2");
number final = found ?? 0.0;    // fallback if missing
```
