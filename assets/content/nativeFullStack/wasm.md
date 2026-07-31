---
title: "WebAssembly"
group: "Native & Full-Stack"
lead: "The `wasm` backend emits a `.wasm` binary module **directly** — no `wat2wasm`, no Emscripten, no external toolchain."
---
```bash
python burnout/cryoc.py client.cryo --backend wasm -o app.wasm
```

`burnout/codegen_wasm.py` writes the module by hand: LEB128 integers, and the type / import / function / export / code sections. The output is a valid module that any browser or Node runtime can instantiate.

## The subset

This backend targets a **numeric subset**, which is what makes it useful for shipping computation to the browser:

| Supported | Not supported |
|---|---|
| `int` and `bool` (both as `i64`) | strings, arrays, maps, structs |
| all arithmetic, bitwise and comparison operators | floats |
| `if` / `while` / `for`, `break`, `continue` | `try`/`catch`, optionals, JSON |
| functions, recursion | enums, `match` |

Anything outside the subset is **rejected at compile time** with a clear error — the backend never silently mis-compiles a construct it cannot represent.

Control flow maps onto WebAssembly's *structured* blocks (`block`/`loop`/`if`) with `br` targets computed as relative depths, so a `break` inside nested loops jumps to the right place.

## Calling it from JavaScript

**Every** function is exported, and `print` is routed to an `env.log` host import you supply:

```js
const { instance } = await WebAssembly.instantiate(bytes, {
  env: { log: (x) => console.log(x.toString()) }
});
console.log(instance.exports.fib(30n));   // i64 → BigInt in JS
```

Because values are `i64`, they cross into JavaScript as **BigInt** — pass `10n`, not `10`, and call `.toString()` before putting a result in the DOM.

> `burnout/tests/test_wasm.py` instantiates each module in Node and asserts its output matches the Pyro VM's for the same program — the browser and the VM must agree.
