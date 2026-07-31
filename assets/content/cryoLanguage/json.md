---
title: "Native JSON"
group: "The Cryo Language"
lead: "Typed serialization and deserialization between structs and JSON — the foundation for APIs and LLM responses."
---
> Native JSON is available on the **go**, **node** and **pyro** backends. On Pyro, structs are maps in the VM — so `json_decode(s) as T` decodes to a dynamic value and field access works by indexing; invalid JSON aborts (fail-fast).

## json_encode

Turns structs (and values) into a JSON string:

```cryo
struct Product { string sku; string name; number price; bool active; }

Product p = new Product { sku: "SKU-2", name: "Pro Plan", price: 49.90, active: true };
string payload = json_encode(p);
```

## json_decode ... as T

Rebuilds a typed struct from JSON — the typical case of an API or LLM response:

```cryo
struct APIResponse { bool ok; string message; int total; }

string input_data = "{\"ok\": true, \"message\": \"created\", \"total\": 4}";
APIResponse r = json_decode(input_data) as APIResponse;

print(r.ok);         // true
print(r.message);   // created
```

## Relation to LLM

The `llm("model", prompt) as Type` form uses the same typed-deserialization mechanism behind **structured output**. See [schema & structured output](#/schema).
