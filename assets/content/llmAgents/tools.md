---
title: "Tools"
group: "LLM & Agents"
lead: "A `tool fn` is a function exposed to the model. The parameter schema is derived from the signature automatically."
---
## Declaring a tool

Prefix `fn` with `tool`. The body is a normal Cryo function:

```cryo
tool fn fetch_price(string sku) -> number ={
    if (sku == "SKU-1") { return 19.90; }
    if (sku == "SKU-2") { return 49.90; }
    return 0.0;
}

tool fn register_payment(string customer, number value) -> bool ={
    return true;
}
```

## Introspection: tools() and tools_json()

| Builtin | Returns |
|---|---|
| `tools()` | array of tool names |
| `tools_json()` | catalog of tools in JSON (name + parameter schema) |
| `tool_get(name)` | metadata for a specific tool |

```cryo
print(tools());        // ["fetch_price", "register_payment"]
print(tools_json());   // JSON catalog to send to the model
```

## Tools that return structs

A tool can return a `struct` — the runtime serializes it to JSON when handing the result back to the model:

```cryo
struct Product { string name; number price; }

tool fn fetch_product(string sku) -> Product ={
    if (sku == "SKU-1") { return new Product { name: "Headphones", price: 129.90 }; }
    return new Product { name: "Unknown", price: 0.0 };
}
```

Tools come to life in the [agent loop](#/agent), where the model decides which to call.
