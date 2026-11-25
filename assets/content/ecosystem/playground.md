---
title: "Playground"
group: "Ecosystem"
lead: "An editable Cryo code space that compiles and runs in your browser — no install, no server, no account."
---
## Try it

Edit the program and press **Run** (or `Ctrl`/`Cmd` + `Enter`). The picker swaps
in another example; **Reset** restores the one this page shipped with. Your
edits are kept in the browser, so the page remembers where you were.

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

## What is actually running

Not a JavaScript imitation of Cryo. The page loads **the Pyro C VM compiled to
WebAssembly**, carrying the [self-hosted compiler](#/selfhost)'s bytecode inside
it. Pressing Run is two turns of that one VM:

1. the VM runs `pyroc.pyro`, which reads your source and writes bytecode;
2. the VM runs the bytecode that came out.

Which is exactly what `pyrovm pyroc.pyro in.cryo out.pyro` followed by
`pyrovm out.pyro` does at a command line. Same VM, same compiler — so the
playground cannot drift from the language the rest of these pages describe.

That mattered more than it sounds. A JavaScript interpreter written for this
page would have been a **fourth engine**, and [invariant 1](#/backends) says a
program means the same thing on every backend. An engine no parity suite runs
is the surest way to break that quietly. Phase 9 built a compiler written in
Cryo precisely so this was possible without one.

> **It found a real bug the day it was built.** `for (i in 0..n)` compiled
> cleanly under the self-hosted compiler and then iterated *nothing* — the
> lexer had always produced the range tokens and the code generator never
> consumed them, so a range reached the loop as an ordinary value. On a
> terminal that aborts; in the browser it printed nothing at all. Fixed, and
> the reason this page can show a counted loop at all.

## The other languages: shown, not run

The dropdown also offers `node`, `go`, `c`, `csharp` and `cpp`. Picking one
does **not** run your program — it shows you **the conversion**: the source
your Cryo compiles to in that language. The button changes from **Run** to
**Convert**, and a notice above the editor says so before you press anything.

The reason is the same one that made `pyro` work here. Those five are whole
toolchains — Node.js, a Go compiler, gcc, the .NET SDK, g++ — and a web page
cannot install one into your browser, nor reach the files this site is served
from. The Pyro VM could be shipped to the browser because it is one small C
program; a Go compiler cannot.

> **Converting needs the toolchain too.** The `go` and `csharp` code
> generators live in Burnout, which is Python, and Python is not in your
> browser either. So on this site the Convert button explains that and hands
> you the one command instead. With the local server running, it converts for
> you.

```bash
cd cryo-playground
npm install
npm start
```

That serves `http://localhost:3020`, which is where this page looks. The status
pill reports it; **double-click the pill** to point somewhere else and the
choice is remembered. `pyro` ignores all of this and keeps running in the
browser either way.

Without any server at all, Copy takes the program and one command gives you the
same conversion:

```bash
python Burnout/cryoc.py main.cryo --backend go -o out.go
```

Add `--run` to that and it compiles and runs it as well.

> The server executes whatever it is sent. It is a development tool for your
> own machine, not something to expose to a network you do not control.

## Limits worth knowing

- **The self-hosted compiler is a subset** of what `Burnout/cryoc.py` accepts.
  It covers the language these pages teach — types, functions, control flow,
  arrays, maps, structs, enums with `match`, optionals, `try`/`catch`, string
  interpolation — but a program the reference compiler takes may still be
  refused here. When that happens the message says so.
- **No network, no filesystem, no clock-dependent behaviour.** A browser tab
  has no subprocesses, so `exec()` reports a failed command rather than
  pretending; the sandbox rules (11.11) reach the same answer.
- **Each run starts clean.** Nothing carries over between runs, which is what
  you want from a playground and also what the VM's exit semantics give.

## Without any of this

Every program here is an ordinary `.cryo` file. Copy it out and run it with
nothing but the repository:

```bash
python Burnout/cryoc.py main.cryo --backend pyro --run
```

Swap `pyro` for another backend to run the same source elsewhere — comparing
two of them by hand is how most of the parity bugs in this project were found.

## Rebuilding the engine

`assets/wasm/pyrovm.{js,wasm}` are build artefacts, committed so GitHub Pages
can serve them with no build step. Regenerate them after changing the VM, the
runtime or the self-hosted compiler:

```bash
./tools/wasm/build.sh
```

It needs [emscripten](https://emscripten.org). On Windows install emsdk at a
short path such as `C:\emsdk` — unzipping it inside a deep directory hits the
260-character path limit and fails halfway through.
