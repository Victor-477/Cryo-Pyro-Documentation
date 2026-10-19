---
title: "Testing (cryoc test)"
group: "Ecosystem"
lead: "Write tests in Cryo with `test fn`, run them with `cryoc test`, and get one exit code CI can read."
---
## A test is a function

```cryo
// lib_test.cryo
import "lib.cryo" as m;

test fn squares() ={
    assert(m::sq(7) == 49, "7*7");
}

test fn zero() ={
    assert(m::sq(0) == 0, "0*0");
}
```

```bash
python burnout/cryoc.py test lib_test.cryo
```

```text
[cryoc test] lib_test.cryo — 2 test(s) on --backend pyro

  ok   squares
  ok   zero

2 passed, 0 failed
```

A test is an ordinary function with `test` in front of `fn`. It takes no
parameters and fails by failing an `assert`. Everything else in the file
(imports, helpers, structs, module state) is ordinary Cryo.

`test` is a keyword **only directly before `fn`**. Everywhere else it is still an
identifier, so `int test = 0;` keeps working in the same file.

## One failure does not hide the rest

Each test runs inside its own `try`/`catch`, so a failing assert ends that test
and the run moves on to the next one:

```text
  ok   squares
  FAIL deliberate_failure
       [Cryo Assert] 2*2 should be 4
  ok   still_runs

2 passed, 1 failed
```

The process exits **non-zero** when anything failed and **zero** when
everything passed, which is the only part CI reads. A file with no `test fn` at
all is also a failure, not a silent pass, so a suite that stopped being picked up
does not go unnoticed.

## Imports

A test file resolves imports exactly like a normal compile:

- `import "lib.cryo"`, flat or `as ns`, relative to the test file;
- `import "@dep/file.cryo"` through the project's [cryo.toml](#/pacotes).

`pub` is still enforced, so a test cannot reach a module's private helpers
through its namespace. Only the **entry file's** tests run: a `test fn` inside an
imported module belongs to that module's suite, not to every file that imports
it.

## Options

| Option | Effect |
|---|---|
| `--backend pyro` | The default. Builds the Pyro VM on first use if it is not built yet |
| `--backend go` / `node` / `c` / `cpp` / `csharp` | Runs the same suite on that backend |
| `--list` | Prints each test and its `file:line` without running anything |
| `--unsafe` | Turns off safety instrumentation, as in a normal compile |

Pass several files, or a directory, to run every `.cryo` under it:

```bash
python burnout/cryoc.py test tests/
python burnout/cryoc.py test tests/ --backend go
```

## Why the same suite runs everywhere

The runner is not a feature of any code generator. `cryoc test` builds it in the
**front end** as ordinary Cryo (a counter, `try`/`catch`, `print`, `assert`) and
appends it to your program. Every backend then compiles one plain program, so
a suite that passes on `pyro` and fails on `go` is a real difference between the
two engines, and never a difference in how they run tests.
