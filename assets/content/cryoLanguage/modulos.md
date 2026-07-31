---
title: "Modules"
group: "The Cryo Language"
lead: "Split the program across files with `import \"file.cryo\"` — the compiler resolves, deduplicates and detects cycles."
---
## Importing a module

```cryo
// lib_geometry.cryo — the module
const number GEO_PI = 3.14159265
struct Circle { number radius; }
fn circleArea(number radius) -> number ={
    return GEO_PI * radius * radius;
}
```

```cryo
// app.cryo — the entry program
import "lib_geometry.cryo"

Circle c = new Circle { radius: 2.5 };
print("area = ${circleArea(c.radius)}");
```

The path is **relative to the importing file**. It works on any backend — resolution happens before code generation.

## What a module exports

A module contributes its **declarations**: `fn`, `struct`, `enum`, `const`, `schema`, `tool`, `skill`, and also `import >Lang<` / `library >...<`. Executable statements at the top of an imported module **do not run** — only the entry program executes.

## Rules

| Situation | Behavior |
|---|---|
| Same file imported twice (directly or indirectly) | included **once** (dedup by absolute path) |
| Nested imports (module imports module) | resolved recursively, relative to each module |
| Import cycle (`a -> b -> a`) | `[Module Error] import cycle detected: ...` |
| Name clash between files | `[Module Error] duplicate declaration '...': defined in X and in Y` |
| Missing file | `[Module Error] module not found` |

## Via the API

```python
import burnout
burnout.compile_source(src, backend="pyro", base_dir="path/to/project")
ast = burnout.load_ast(src, base_dir)   # parse + module resolution
```

> Both forms of `import` coexist: `import "file.cryo"` (Cryo module) and `import >Lang<` ([foreign language](#/estrangeiros)).
