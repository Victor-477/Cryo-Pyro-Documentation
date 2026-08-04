---
title: "Packages (cryo.toml)"
group: "Ecosystem"
lead: "Depend on another Cryo package by path, with a lockfile that pins exactly what was built — by content, not by a version number."
---
## What this is, and what it is not

It is a way for one Cryo package to depend on another, and to record exactly
which sources went into a build.

It is **not a registry**. There is no server, no `publish`, no version solving
and no network. A dependency is a path you already have on disk.

Saying so plainly matters more than the feature. "Package manager" usually
promises all of that, and a half-registry that quietly resolves something
different tomorrow is worse than no registry at all. That is also why there is
no `install`, `add` or `update` command: nothing is fetched, so there would be
nothing for them to do.

## The manifest

```bash
python burnout/cryoc.py pkg init            # writes cryo.toml here
python burnout/cryoc.py pkg init --name app
```

```toml
[package]
name = "app"
version = "0.1.0"

[dependencies]
geometry = "../geometry"
```

Both spellings of a dependency mean the same thing:

```toml
geometry = "../geometry"
geometry = { path = "../geometry" }
```

There is no third form — anything else is refused with a message saying there
is no registry to fetch a version from.

## Importing from a dependency

```cryo
import "@geometry/shapes.cryo";   // from the dependency `geometry`
import "./local.cryo";            // as always, relative to this file
```

The `@` sigil is deliberate. Without it, `import "geometry/shapes.cryo"` would
mean a local directory to a reader and a dependency to the compiler — or the
other way round — and which one you got would change as files appeared and
disappeared on disk.

Because only `@name/...` is claimed, **adding a `cryo.toml` to an existing
project cannot change what any of its existing imports mean.** A project with no
`@` import never reads a manifest at all.

Resolution happens in the front end, so `@` imports work identically on every
backend — `pyro`, `go`, `node` and `c`.

### What is refused

| Written | Why it fails |
| --- | --- |
| `@geometry/../../secret.cryo` | the path escapes the dependency it names — a dependency is not a way to read arbitrary files |
| `@sneaky/x.cryo` | `sneaky` is not declared in `[dependencies]`; a directory being on disk is not what makes it a dependency |
| `@geometry/missing.cryo` | no such file inside the dependency |
| `@geometry` | not a file — the form is `@package/file.cryo` |
| `@geometry/shapes.cryo` with no `cryo.toml` | there is no manifest to resolve it against; the error says to run `cryoc pkg init` |

## The lock

```bash
python burnout/cryoc.py pkg list    # what is declared, and where it points
python burnout/cryoc.py pkg lock    # write cryo.lock
python burnout/cryoc.py pkg check   # exit 1 if the tree no longer matches
```

`cryo.lock` records a **digest of the dependency's sources** — every `.cryo`
under it, hashed by content, with paths sorted and slash-normalised so the same
tree hashes the same on Windows and Linux.

```toml
[[package]]
name = "geometry"
path = "../geometry"
files = 1
hash = "sha256:…"
```

### Why content and not a version number

Reproducible builds already guarantee that the same sources produce a
byte-identical `.pyro`. A lockfile pinning a *version* would add a second,
weaker notion of "the same build" alongside that one — and the two would
eventually disagree, the first time someone edits a dependency in place without
touching its version.

So the lock reuses the existing guarantee rather than duplicating it. Same lock
means the same bytes went in. In practice this is what it buys you:

```bash
# edit one number inside ../geometry/shapes.cryo — same file count,
# same version string in its cryo.toml
python burnout/cryoc.py pkg check
#   'geometry' has changed since it was locked (1 file(s) locked, 1 now)
#   run `cryoc pkg lock` if the change was intended
```

A version pin reports that build as unchanged. `pkg check` is the command meant
for CI: it exits 1 on drift and names the dependency that moved.
