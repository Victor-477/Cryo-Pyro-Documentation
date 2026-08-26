---
title: "Foreign blocks & libraries"
group: "The Burnout Compiler"
lead: "Embed native code (Go/C/Node) and import libraries — in a **verified** way: a block only compiles if its language was imported into the program."
---
## The rule: import before use

Each foreign language must be enabled with `import >Lang<`. A `>Lang( ... )` block is only accepted if `Lang` was imported — otherwise the compiler rejects it with `[Foreign Error]`, **before** generating any code.

```cryo
import >C<               // enables C blocks and libraries

>C(
    printf("hello from C\n");
)
```

Without `import >C<`, the same program fails:

```text
[Foreign Error] foreign block >C( ... ) used without importing the
language. Add 'import >C<' before using C blocks.
```

> The check is **semantic and backend-independent**: it runs after the parse and before code generation, both from the CLI and from the `import burnout` API.

## One block per language, per backend

Each backend emits **only the blocks of its own language**; the others are omitted with a comment. This keeps a single `.cryo` portable across targets:

```cryo
import >Go<
import >C<

>Go(   fmt.Println("[go] here") )    // emitted on the go backend
>Node( console.log("[node] here") ) // emitted on the node backend
>C(    printf("[c] here\n");   )    // emitted on the c backend
>C#(   Console.WriteLine("[c#] here"); )   // emitted on --backend csharp
>C++(  std::cout << "[c++] here" << std::endl; )  // emitted on --backend cpp
```

| Backend | `>Go(...)` | `>Node(...)` | `>C(...)` | `>C#(...)` | `>C++(...)` |
|---|:---:|:---:|:---:|:---:|:---:|
| `go` | emitted | omitted | omitted | omitted | omitted |
| `node` | omitted | emitted | omitted | omitted | omitted |
| `c` | omitted | omitted | emitted | omitted | omitted |
| `csharp` | omitted | omitted | omitted | emitted | omitted |
| `cpp` | omitted | omitted | omitted | omitted | emitted |
| `asm` / `pyro` | error | error | error | error | error |

A block's language is matched loosely, so `>C#(`, `>cs(`, `>csharp(` and
`>dotnet(` name one language, as do `>C++(`, `>cpp(` and `>cxx(`.

### A block can call back into the program

A foreign block is not a sealed box: it is emitted into the generated file
beside everything else, so it can call the program's own functions.

```cryo
import >C#<

fn helper() -> int ={ return 7; }

fn native() ={
  >C#( Console.WriteLine("from C#: " + helper()); )
}
```

The same holds for `>C++(`, where the block sees the forward declarations the
backend emits for every Cryo function.

## Structure parameters `< ... >`

A block often needs something that lives *outside* it. Add a `<key = value>` tail to wire it up:

```cryo
import >Java<

fn helper() ={ int q = 1; }

>Java( callInto(); )<util = helper>
```

Each value must name a **function, variable or constant declared in the program**. A typo is caught in Cryo's own terms:

```text
[Foreign Error] >Java( ... )<util = helpr> refers to 'helpr', which is not
declared in this program. A structure parameter must name a function,
variable or constant that exists. Did you mean: helper?
```

> That check is the whole point of doing it here. Without it the typo would surface from **javac or gcc** instead — long after Cryo could have explained it, and in a language you may not read.

The empty form `<>` is legal and simply declares a (currently empty) parameter list:

```cryo
>Java( standalone(); )<>
```

The mechanism is **not HTML-specific** — it works on every foreign language. Its most developed use is [front-end pages](#/frontend), where `>html( ... )<script = ..., style = ...>` composes JavaScript and CSS blocks into a document.

> For a foreign block doing real work, see [REST APIs](#/api): the HTTP routing lives in a `>Go( ... )` block while every payload and rule stays in Cryo.

## Libraries

A `library` belongs to an imported language and becomes a **real dependency** on the matching backend:

| Declaration | Becomes | On backend |
|---|---|---|
| `library >go fmt<` | `import "fmt"` | go |
| `library >go net/http<` | `import "net/http"` | go |
| `library >node fs<` | `const fs = require("fs")` | node |
| `library >c math<` | `#include <math.h>` | c |

### Ways to write it

```cryo
library >go fmt<      // qualified by space
library >go:fmt<      // qualified by colon
library >math<        // unqualified: infers the language
```

The **unqualified** form (`library >name<`) infers the language when exactly one is imported. With two or more imported languages it is ambiguous and the compiler asks for the qualification:

```text
[Foreign Error] library >math< is ambiguous: multiple imported
languages (c, go). Qualify it with 'library >LANG math<'.
```

## Complete, portable example

```cryo
import >Go<
import >C<
library >go fmt<     // go backend  ->  import "fmt"
library >c math<     // c backend   ->  #include <math.h>

number side = 4.0;
print("area (Cryo):");
print(side * side);

>Go(
    fmt.Println("[go] fmt came from the library")
)
>C(
    printf("[c] sqrt(2) = %.5f\n", sqrt(2.0));
)
```

```bash
python burnout/cryoc.py cryo/examples/example_foreign.cryo --backend go --run
python burnout/cryoc.py cryo/examples/example_foreign.cryo --backend c  --run
```

See [`example_foreign.cryo`](#/exemplos) in the examples list.

## Verification from the library too

The programmatic API applies the same rule and exposes the exception:

```python
import burnout

try:
    burnout.compile_source('>Go( fmt.Println(1) )', backend='go')
except burnout.ForeignError as e:
    print('rejected:', e)

burnout.collect_imports(burnout.parse_ast('import >go<'))  # {'go'}
```

## Security

> The check guarantees the **language was declared** — not that the embedded code is safe. Foreign blocks remain code not verified by the compiler; the [audit](#/seguranca) (`--audit`) classifies them as **HIGH**. Treat foreign code (and libraries) as trusted dependencies and review them.
