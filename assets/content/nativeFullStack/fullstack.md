---
title: "Full-stack Cryo"
group: "Native & Full-Stack"
lead: "One language on both ends: a server through the `http_serve` builtin, and a browser client compiled to WebAssembly."
---
The demo lives in `cryo/examples/fullstack/` and is deliberately small — it exists to prove the two halves meet.

## The server

`http_serve(port, dir)` makes a Cryo program a static web server. It blocks, sends `.wasm` as `application/wasm` (so browsers can stream-compile), answers missing paths with 404 and rejects path traversal with 403.

```cryo
string[] a = args();
string dir = "cryo/examples/fullstack/public";
int port = 8080;
if (len(a) > 0) { dir = a[0]; }
if (len(a) > 1) { port = to_int(a[1]); }
http_serve(port, dir);
```

## The client

Ordinary Cryo functions, compiled to [WebAssembly](#/wasm) and called from the page:

```cryo
fn fib(int n) -> int ={
    if (n < 2) { return n; }
    return fib(n - 1) + fib(n - 2);
}
fn sum_to(int n) -> int ={
    int s = 0;
    for (int i = 1; i <= n; i++) { s += i; }
    return s;
}
```

## Running it

```bash
python burnout/cryoc.py cryo/examples/fullstack/client.cryo --backend wasm -o cryo/examples/fullstack/public/app.wasm
```

```bash
build/pyrovm build/pyroc.pyro cryo/examples/fullstack/server.cryo build/server.pyro
```

```bash
build/pyrovm build/server.pyro cryo/examples/fullstack/public 8080
```

Then open `http://localhost:8080`. Note the middle step: the server is compiled by the [self-hosted compiler](#/selfhost), so no Python is involved in building it.

## The same server, three ways

The server program is just a `.pyro`, so it runs unchanged on the Go VM, on the C VM, or as a [standalone native binary](#/nativo):

```bash
python burnout/pyro.py build cryo/examples/fullstack/server.cryo -o cryoserve
```

All three serve byte-identical responses — `burnout/tests/test_c_vm.py` compares them directly, and `test_fullstack.py` checks the WASM exports in Node and the served assets end to end.
