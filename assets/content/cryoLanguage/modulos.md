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

## Namespaces and `pub`

`import "file.cryo" as name` puts the module behind a **namespace**, and then
only what the module marks `pub` can be reached through it:

```cryo
// counter.cryo
int _count = 0;                                   // module state: always private
fn _format(int n) -> string ={ return "hits=" + to_string(n); }

pub fn bump() ={ _count = _count + 1; }
pub fn total() -> int ={ return _count; }
pub fn report() -> string ={ return _format(_count); }   // pub may call private
```

```cryo
import "counter.cryo" as c;

c::bump();
print(c::total());     // 1
print(c::report());    // hits=1
```

Reaching a private item is a compile error, not a link error:

```text
[Module Error] '_format' is not pub in module 'c'
```

**Module state is private by design.** A `var` declaration has no `pub` form, so
state is reached through `pub` accessors — which is what makes `_count` above
survive between calls without being writable from outside.

> Privacy is **name resolution**, not deletion. Every declaration of an aliased
> module is emitted, `pub` or not, under a mangled name. That is the fix for a
> defect where private items were dropped from the output entirely: a `pub`
> function calling a private helper — or even a `pub` sibling — was calling
> something that no longer existed.

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
