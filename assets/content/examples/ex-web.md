---
title: "Web: APIs, pages & full-stack"
group: "Examples"
lead: "A REST API compiled to a standalone executable, a web page written in Cryo, and the server+browser demo."
---
## A REST API as a standalone `.exe`

The resource, every payload and every rule are Cryo; a foreign block supplies only the HTTP transport:

```cryo
struct Task { int id; string title; bool done; }

fn task_json(int id, string title, bool done) -> string ={
    Task t = Task{ id: id, title: title, done: done };
    return json_encode(t);
}

// "" means acceptable; anything else is the reason for a 400.
fn validate_title(string raw) -> string ={
    string t = trim(raw);
    if (len(t) == 0)  { return "title is required"; }
    if (len(t) > 60)  { return "title must be 60 characters or fewer"; }
    return "";
}
```

```bash
python burnout/cryoc.py cryo/examples/api/server.cryo --backend go -o build/api/server.go
```

That writes `build/api/server.exe`. Open it and the API is live on `:8080` — no VM, no Python, no toolchain at runtime. Full walkthrough: [REST APIs](#/api).

## A web page in Cryo

```cryo
import >html<
import >javascript<
import >CSS<

fn styles()   ={ >CSS( body { background: #0b0b0d; color: #e8e8ea; } ) }
fn behavior() ={ >javascript( out.textContent = cryo.fib(20n).toString(); ) }

fn page() ={
    >html( <h1>Cryo</h1><p id="out">...</p> )<script = behavior, style = styles>
}
```

```bash
python burnout/cryoc.py app.cryo --backend frontend --emit html -o web/index.html
```

One self-contained file, or `--emit pyro` for an `.html` shell plus a WebAssembly binary. See [front-end pages](#/frontend).

## Full-stack: server + browser, both in Cryo

A client compiled to [WebAssembly](#/wasm), served by a Cryo program using `http_serve` — see the [full walkthrough](#/fullstack).

```cryo
// client.cryo  →  compile with --backend wasm, call from the page
fn fib(int n) -> int ={
    if (n < 2) { return n; }
    return fib(n - 1) + fib(n - 2);
}
```

```cryo
// server.cryo  →  a static web server
string[] a = args();
int port = 8080;
if (len(a) > 1) { port = to_int(a[1]); }
http_serve(port, a[0]);
```

```bash
python burnout/cryoc.py client.cryo --backend wasm -o public/app.wasm
python burnout/pyro.py build server.cryo -o server.exe   # standalone native server
```
