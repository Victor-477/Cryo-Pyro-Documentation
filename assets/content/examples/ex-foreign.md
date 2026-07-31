---
title: "Foreign blocks & per-backend"
group: "Examples"
lead: "Embedding Go, C or Node inside Cryo, pulling in real dependencies, and the backend-specific examples."
---
A `>Lang( ... )` block is only accepted when the language was enabled with `import >Lang<`, and `library >Lang pkg<` becomes a real dependency on the matching backend:

```cryo
import >Go<
library >Go net/http<

fn greet(string name) -> string ={ return "hello " + name; }

>Go(
    http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte(greet("world")))
    })
    http.ListenAndServe(":8077", nil)
)
```

Cryo functions keep their names in the generated code, so the block calls `greet(...)` directly. That is exactly how the [REST API example](#/api) is built.

## Structure parameters

A block can be wired to the rest of the program with a `<key = value>` tail, on any foreign language:

```cryo
>Java( callInto(); )<util = helper>
```

Each value must name a declaration that exists — otherwise the mistake would surface from *javac or gcc* instead of from Cryo. See [foreign blocks](#/estrangeiros).

## Per-backend examples

| Example | Backend | Shows |
|---|---|---|
| `example_foreign.cryo` | go / c | verified blocks + libraries |
| `example_go_http.cryo` | go | `net/http` through `library` |
| `example_node.cryo` | node | Cryo core in JS + `library >node os<` |
| `example_node_fs.cryo` | node | file I/O via `library >node fs<` |
| `example_v4.cryo` | c | switch, bitwise, literals, `>C(...)` |
| `example_asm.cryo` | asm | the integer subset |
| `example_struct.cryo` | asm | struct returned in registers |
