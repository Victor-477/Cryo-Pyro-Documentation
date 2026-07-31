---
title: "Front-end pages"
group: "Native & Full-Stack"
lead: "A `.cryo` file can *be* a web page: HTML, JavaScript and CSS blocks composed by name, emitted either as one vanilla file or as an HTML shell plus a binary."
---
## Naming a block

Wrap a foreign block in a function. That is what gives the block a **name** — and names are what the composition syntax refers to. No new declaration form was needed, because functions already exist:

```cryo
import >html<
import >javascript<
import >CSS<

fn styles() ={
    >CSS( body { background: #0b0b0d; color: #e8e8ea; } )
}

fn behavior() ={
    >javascript( document.getElementById("out").textContent = "ready"; )
}
```

## Composing the page

The `html` block pulls the others in through [structure parameters](#/estrangeiros):

```cryo
fn page() ={
    >html( <h1>Cryo</h1><p id="out">...</p> )<script = behavior, style = styles>
}
```

| Key | Must name a | Becomes |
|---|---|---|
| `script` | `>javascript(` or `>js(` block | a `<script>` in the document |
| `style` | `>CSS(` block | a `<style>` in the head |

Slots are checked against the block's **language**, not merely its existence:

```text
[Frontend Error] >html( ... )<script = styles> expects a javascript or js
block, but 'styles' is a css block. Swapping `script` and `style` is the
usual cause.
```

> The alternative to that check is a page that renders blank in a browser — the worst place to debug a Cryo mistake.

A function holding a block **plus other statements** is ordinary Cryo, not a named block. Accepting it would mean silently dropping the rest of its body.

## Two outputs

Both modes produce the same document *structure*, so `--emit` changes how the logic **arrives**, never how the page looks.

```bash
python burnout/cryoc.py app.cryo --backend frontend --emit html -o web/index.html
```

| `--emit` | Produces | Use when |
|---|---|---|
| `html` | one self-contained `.html` | you want a file that just opens — CSS and JS inlined, **zero** subresource requests, works from `file://` |
| `pyro` | `index.html` **+** `app.wasm` | you want real Cryo logic in the browser |

## Running Cryo in the browser

Under `--emit pyro`, the Cryo functions in the file are compiled to a binary the browser executes. The page exposes them as `cryo`, and your JavaScript block is deferred until the module is ready:

```cryo
fn fib(int n) -> int ={
    if (n < 2) { return n; }
    return fib(n - 1) + fib(n - 2);
}

fn behavior() ={
    >javascript( out.textContent = cryo.fib(20n).toString(); )
}
```

Two things to know:

- `int` is 64-bit, so it crosses into JavaScript as **BigInt** — hence `20n`, and `.toString()` to print it.
- Serve it over HTTP. `fetch` cannot read `file://`, so this mode needs a server ([`http_serve`](#/fullstack) will do).

The front-end declarations are stripped before the logic is compiled — they describe the document, not the program. A page with **no** Cryo logic is refused under `--emit pyro`, rather than emitting a shell that fetches a file which will never exist.

> The browser binary comes from the [WebAssembly backend](#/wasm), which covers the numeric subset. If your logic reaches past it, the compiler says so and points you at `--emit html`.

## Full example

`cryo/examples/frontend/app.cryo` is the page shown above, end to end. Verified in a real browser: CSS applied, module loaded, `fib(20)` → `6765`, clean console.
