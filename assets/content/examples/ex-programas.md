---
title: "Interactive programs"
group: "Examples"
lead: "Whole terminal applications rather than snippets — input, loops, redraw and timing, which is where a language starts to feel like a language."
---
The examples elsewhere show one feature each. These are complete programs, and they are the quickest way to judge whether writing something real in Cryo is pleasant.

## Reading input

`input()` is a VM native, so an interactive program runs on the `pyro` backend with no toolchain at all:

```cryo
fn main_loop() ={
    while (true) {
        string line = input("calc> ");
        if (line == "quit") { return; }
        print(evaluate(line));
    }
}
```

`cryo/examples/example_calc.cryo` is the full calculator: it parses an expression, evaluates it and loops until you quit.

## Redrawing a screen

`example_chart.cryo` renders a bar chart that updates in place, and `example_winupdate.cryo` simulates a progress screen. Both lean on the same two pieces:

```cryo
string bar = repeat("#", value);        // build the row
print(pad_end(label, 12, " ") + bar);   // align the columns
sleep(100);                             // pace the redraw
```

`repeat` and `pad_start`/`pad_end` exist precisely so column layout does not need a loop, and `sleep` is a native so timing behaves the same on the VM and on `go`.

```bash
python burnout/cryoc.py cryo/examples/example_chart.cryo --backend pyro --run
```

> These run on `pyro` and `go`. They are not in the `c`/`asm`/`wasm` columns because those targets cover numeric or non-interactive subsets — see the [coverage matrix](#/backends).
