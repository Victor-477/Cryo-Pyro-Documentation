---
title: "Formatter (cryoc fmt)"
group: "Ecosystem"
lead: "A canonical formatter that reindents Cryo code safely — it only touches whitespace, never the program's meaning."
---
## Usage

```bash
python burnout/cryoc.py fmt app.cryo            # prints the formatted code to stdout
python burnout/cryoc.py fmt --write app.cryo    # rewrites the file in place
python burnout/cryoc.py fmt --check app.cryo    # exits 1 if not already formatted (CI)
```

## What it does

- **Reindents to 4 spaces** by brace/bracket/paren depth, ignoring strings and comments.
- Handles the `={` function-body opener as one level of depth.
- Leaves **foreign blocks** (`>Lang( ... )`) and **block comments** verbatim.
- Strips trailing whitespace, collapses multiple blank lines and ensures a single final newline.

```cryo
// before                          // after (cryoc fmt)
fn f(int n)->int ={                fn f(int n)->int ={
if(n<1){                               if(n<1){
return 1;                                  return 1;
}                                      }
return n*f(n-1);                       return n*f(n-1);
}                                  }
```

## Safety guarantee

The formatter **only changes whitespace**. After formatting, it checks that the token stream is identical to the original; if it is not (some unforeseen case, or invalid syntax), it returns the original text unchanged — so `cryoc fmt` can never alter a program's meaning.

> It is idempotent: `fmt(fmt(x)) == fmt(x)`. Part of the [Phase 6](#/roadmap) tooling.
