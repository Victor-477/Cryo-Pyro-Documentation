---
title: "Debugging & Profiling"
group: "Pyro — Bytecode & VM"
lead: "Breakpoints and single-step over the `.pyro` debug section, plus a sampling profiler that reports time per Cryo function."
---
Both are options of the Pyro VM, and both read the **debug section** the compiler already writes (`flags` bit 1, a `pc → line` table). Nothing about the file format changes, so a `.pyro` built before either existed can still be debugged and profiled.

Options come **before** the program; everything after it belongs to the program (the `args()` native), so a script that takes its own `--debug` is never intercepted.

## Debugger

```bash
python Burnout/pyro.py debug program.cryo
```

Or against a `.pyro` directly — `--source` lets it show you the lines, since the container records line *numbers*, not the text:

```bash
Pyro/vm/pyrovm_go.exe --debug --source=program.cryo program.pyro
```

| Command | |
|---|---|
| `break <line>` / `break <function>` | stop there |
| `delete <line>` / `delete all` | remove breakpoints |
| `step` / `next` | one source line, into or over calls |
| `stepi` | one bytecode instruction |
| `finish` | run until the current function returns |
| `continue` | run to the next breakpoint |
| `backtrace` | the call stack, with lines |
| `list` | source around the stop |
| `info locals` / `info break` | inspect |

```
(pyro) break fast
breakpoint at line 10 (fast)
(pyro) continue

breakpoint hit — app.cryo:10  in fast
   10 |     return n * n;
(pyro) backtrace
-> #0  fast (line 10)
   #1  driver (line 15)
   #2  main (line 20)
```

### Where a breakpoint is allowed to be

Not at any `pc`. The debug section holds one entry per **statement boundary** — that is what the code generator emits — so those are the places where stopping shows the program in a state you recognise. Stopping between the two halves of an expression would show a half-built operand stack and a line number that has already moved on.

So `break 12` on a line that begins no statement is **refused**, and names the nearest line that does work, rather than arming a breakpoint that can never fire.

`break <function>` resolves to the function's **first statement**, not its entry `pc` — the entry is prologue, and searching backwards from it (the way stack traces do) reports the line of whatever came *before* the function.

### `next` and `finish`

Both are defined against the **frame depth** captured when you issued the command, not against a function's identity: a recursive call into the function you are standing in is a deeper frame and must be stepped over like any other.

A breakpoint inside a call still fires while `next` steps over it. Being silently skipped is the one thing a breakpoint must never do.

### Locals are shown by slot

```
(pyro) info locals
  [0] param = 7
  [1] local = 42
```

The debug section holds `pc → line` and nothing else, so the **names are not in the file** to show. Parameters come first, in declaration order. Recording names would be a container change; `help` says so rather than leaving you to wonder why your variables are numbered.

## Sampling profiler

```bash
python Burnout/pyro.py profile program.cryo --hz 5000
```

```
=== Pyro profile — 30.8 ms, 51 samples at 5000 Hz ===
   samples     self    self ms  function
        51  100.00%       30.8  slow
```

| Option | |
|---|---|
| `--profile` | sample and report on stderr |
| `--profile-hz=N` | sampling rate, default 1000 |
| `--profile-out=FILE` | write the report to a file instead |

**Sampling, not counting.** A function called twice can dominate a run and one called a million times can be free; counts answer the wrong question. What a profile has to report is where the *time* went.

It reports **self** time — the function on top of the stack when the sample was taken. Time inside natives (`sleep`, `http_get`, file reads) is charged to the Cryo function that called them, which is usually what you want to know, but it means a slow `http_get` shows up as a slow *caller*.

A program that finishes inside one sampling period is told so, with the option to raise `--hz`, rather than being shown an empty table that reads as "your program spends no time anywhere".

## What it costs when you are not using it

Nothing measurable. The debugger is one test of a boolean at the top of the dispatch loop, and `continue` with no breakpoints set turns even that back off — so a debugged program returns to full speed once it is past the part you were looking at.

The profiler adds nothing to the loop at all: a separate goroutine reads one atomic word, which the interpreter writes only when the active function *changes*, on call and return.

Both claims are measured rather than asserted — see [BENCHMARKS.md](https://github.com/Victor-477/Pyro), where the per-instruction check is timed against an A/A control that establishes the noise floor first.

## The C VM

The C VM has neither. Use the Go VM (`pyrovm_go`) for debugging and profiling.
