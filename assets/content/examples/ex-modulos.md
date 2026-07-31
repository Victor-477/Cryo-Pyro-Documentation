---
title: "Modules & namespaces"
group: "Examples"
lead: "Splitting a program across files, exporting a deliberate surface with `pub`, and calling into it through a namespace."
---
A single file stops scaling quickly. Cryo has two levels: a plain import that merges declarations, and a **namespaced** import that keeps them behind a prefix.

## A library file

`pub` marks what leaves the file. Anything unmarked stays private to it, so a helper cannot be depended on by accident:

```cryo
// geo.cryo
pub fn area(int w, int h) -> int ={ return w * h; }

fn internal_scale(int v) -> int ={ return v * 2; }   // not exported
```

## Importing it

```cryo
import "geo.cryo" as geo;

print(geo::area(3, 4));      // 12
```

The `ns::name` form is what makes large programs safe from collisions: two libraries can both export `area` and neither has to rename anything.

## What the resolver guarantees

- Paths are resolved **relative to the importing file**, so a library can be moved without rewriting its own imports.
- The same file imported twice is included **once** — diamond imports do not duplicate declarations.
- **Import cycles are detected** and reported as `[Module Error]` rather than looping forever.
- A name clash between an import and a local declaration is a compile error, not a silent shadow.

See `example_modules.cryo`, `example_geo.cryo` and `lib_geometria.cryo`, and the [Modules](#/modulos) reference for the full rules.
