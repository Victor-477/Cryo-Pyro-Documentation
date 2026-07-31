---
title: "REST APIs"
group: "Native & Full-Stack"
lead: "Write the API in Cryo, compile it to a single native executable. Open the file and the API is live — no VM, no Python, no toolchain at runtime."
---
## Build and run

```bash
python burnout/cryoc.py cryo/examples/api/server.cryo --backend go -o build/api/server.go
```

That writes `build/api/server.exe` (~8.8 MB). Open it:

```text
cryo-api listening on http://localhost:8080
  GET  /api/health
  GET  /api/stats
  GET  /api/tasks
  GET  /api/tasks/{id}
  POST /api/tasks       body: {"title":"..."}
```

`PORT=9000 server.exe` serves somewhere else.

| Method | Path | Response |
|---|---|---|
| GET | `/api/health` | `{"status":"ok","service":"cryo-api","version":"1.1.0","tasks":3}` |
| GET | `/api/tasks` | the full list |
| GET | `/api/tasks/{id}` | one task, or `404 {"error":"no task with that id"}` |
| GET | `/api/stats` | `{"total":3,"done":1,"pending":2,"percent_done":33}` |
| POST | `/api/tasks` | `201` with the created task, or `400` with the reason |

## Cryo owns the behaviour

The resource, every payload, and every rule are Cryo:

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

fn percent_done(int total, int done) -> int ={
    if (total == 0) { return 0; }
    return (done * 100) / total;
}
```

## The Go block owns only transport

Routing, methods and status codes live in a [foreign block](#/estrangeiros); it never decides *what* to say, only how to put it on the wire. Cryo functions keep their names in the generated Go, so the block calls them directly:

```cryo
import >Go<
library >Go net/http<

>Go(
    http.HandleFunc("/api/tasks", func(w http.ResponseWriter, r *http.Request) {
        if reason := validate_title(in.Title); reason != "" {
            writeJSON(w, 400, error_json(reason))
            return
        }
        writeJSON(w, 201, task_json(rec.id, rec.title, rec.done))
    })
    http.ListenAndServe(":"+port, nil)
)
```

Each `library >Go pkg<` pulls a real dependency into the generated program's import block.

## Why not `http_serve`?

[`http_serve(port, dir)`](#/fullstack) is a **static file server**. It has no per-request handler, so it cannot express routing, methods, request bodies or computed responses. A dynamic API needs the runtime to call back into Cryo code on every request, which that builtin does not do.

Foreign blocks are the language's designed escape hatch for exactly this, and they keep the API's logic in Cryo while borrowing a mature HTTP stack.

> **A known gap, stated plainly.** A native `http_api(port, handler)` taking a Cryo function value would remove the need for the block entirely. The pieces exist — function values landed on the VM in [10.6](#/lambdas) — but the callback has to be threaded through the Go VM, the C VM and the AOT route together to keep Pyro parity, so it is a feature in its own right rather than a tweak.

## Tests

```bash
python burnout/tests/test_api.py
```

29 assertions: it builds the executable, launches **only that file** on an OS-assigned free port, and checks every endpoint, status code and payload — deliberately targeting what *Cryo* decides (the field order `json_encode` emits, the whitespace trimming, the inclusive 60-character boundary, the truncating integer percentage) rather than what Go does. Skips cleanly when the Go toolchain is absent.
