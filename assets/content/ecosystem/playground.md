---
title: "Playground"
group: "Ecosystem"
lead: "An editable Cryo code space in the docs — pick an example, change it, and run it against the real compiler."
---
## Try it

Edit the program below and press **Run** (or `Ctrl`/`Cmd` + `Enter`). The
picker swaps in a different example; **Reset** puts back the one this page
shipped with. Your edits are kept in the browser, so the page remembers where
you were.

```playground
// Change anything here and press Run.
string who = "world";
print("hello, " + who + "!");

int[] xs = [3, 1, 2];
print(sort(xs));

fn fib(int n) -> int ={
    if (n < 2) { return n; }
    return fib(n - 1) + fib(n - 2);
}
print("fib(20) = ${fib(20)}");
```

## It runs the real compiler, not an imitation

Pressing Run sends the program to a local server that shells out to
`Burnout/cryoc.py` — the same compiler the command line uses, with the backend
the dropdown names. What you see here is what you get in a terminal.

That is a deliberate choice over the easier one. A JavaScript interpreter
embedded in this page would be a **fourth engine**, and
[invariant 1](#/backends) says a program means the same thing on every backend.
An engine that no parity suite ever runs is the surest way to break that rule
quietly: it would drift, and the docs would be the last place anyone looked for
the disagreement.

So the playground either runs the real thing or admits it cannot.

## Starting the backend

The status pill on the right of the toolbar says whether one is reachable.
While it reads **offline** you can still edit, switch examples, read the
highlighted source and copy it — Run will then print the instructions instead
of pretending.

```bash
cd cryo-playground
npm install
npm start
```

That serves `http://localhost:3020`, which is where this page looks by default.
**Double-click the status pill** to point it somewhere else — a container, a
different port, a machine on your network — and the choice is remembered.

> The server compiles in a temporary directory and deletes it afterwards, with
> a timeout on every run. It is a development tool: it executes whatever it is
> sent, so run it on your own machine rather than exposing it to a network you
> do not control.

## Without any server at all

Every program here is an ordinary `.cryo` file. Copy it out and run it
directly — this needs nothing but the repository:

```bash
python Burnout/cryoc.py main.cryo --backend pyro --run
```

Swap `pyro` for `go`, `node`, `c`, `csharp` or `cpp` to run the same source on
a different backend; that is the whole point of the dropdown, and comparing two
of them by hand is exactly how most of the parity bugs in this project were
found.

## What the dropdown's backends need

| Backend | Needs | Notes |
|---|---|---|
| `pyro` | nothing (the VM ships built) | the reference engine — start here |
| `node` | Node.js | |
| `go` | a Go toolchain | |
| `c` | a C compiler | a subset of the language; see [Backends](#/backends) |
| `csharp` | the .NET SDK | |
| `cpp` | a C++ compiler | |

A backend that refuses a program says so in its own terms and names one that
supports it, so an unsupported construct reads as a message rather than as a
crash.
