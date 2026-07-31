---
title: "Keywords"
group: "Reference"
lead: "All of Cryo's reserved words, recognized by the lexer."
---
## Declaration & types

`fn` · `return` · `const` · `struct` · `enum` · `new` · `schema` · `tool` · `skill` · `library` · `import`

Types: `int` · `number` · `string` · `bool` · `void` · `map` · `future`

## Control flow

`if` · `else` · `for` · `while` · `do` · `in` · `switch` · `case` · `default` · `break` · `continue`

## Errors & safety

`try` · `catch` · `finally` · `assert` · `safe` · `unsafe`

## Concurrency

`spawn` · `await` · `future`

## Values & conversion

`true` · `false` · `null` · `as`

## Special tokens

| Token | Meaning |
|---|---|
| `={` | opens the body of `fn`/`tool`/`skill` |
| `->` | function return type |
| `=>` | [lambda](#/lambdas) body: `(params) => expr` |
| `fn(T,...)->R` | [function type](#/lambdas) (values, parameters, returns) |
| `??` | null-coalescing |
| `?` | optional type suffix (`T?`) and ternary |
| `!` | optional unwrap (`x!`) and logical negation |
| `import "file.cryo"` | imports a Cryo module (declarations) |
| `${expr}` | interpolation inside string literals |
| `${expr:.2f}` | interpolation with a [format spec](#/sintaxe) — width, fill, `,`, precision |
| `import >Lang<` | enables the foreign language `Lang` (required for blocks) |
| `>Lang( ... )` | foreign code block (requires `import >Lang<`) |
| `library >lang name<` | imports a library of language `lang` |
