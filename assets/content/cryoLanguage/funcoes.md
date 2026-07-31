---
title: "Functions"
group: "The Cryo Language"
lead: "Typed functions, recursion and the return type with `->`."
---
## Declaration

The general form is `fn name(params) -> returnType ={ ... }`:

```cryo
fn circleArea(number radius) -> number ={
    return 3.14159 * radius * radius;
}

fn isEven(int n) -> bool ={
    return (n & 1) == 0;
}
```

- Each parameter is `type name`, comma-separated.
- The return type comes after `->`.
- The body opens with **`={`** (see [Basic syntax](#/sintaxe)).

## Recursion

Functions can call themselves:

```cryo
fn factorial(int n) -> int ={
    if (n <= 1) { return 1; }
    return n * factorial(n - 1);
}

fn fib(int n) -> int ={
    if (n < 2) { return n; }
    return fib(n - 1) + fib(n - 2);
}
```

## Returning composites

Functions can return arrays, maps, structs and optionals:

```cryo
struct Product { string name; number price; }

fn search(string sku) -> Product ={
    if (sku == "SKU-1") { return new Product { name: "Headphones", price: 129.90 }; }
    return new Product { name: "Unknown", price: 0.0 };
}

// optional return: may return null
fn price(map<string, number> tab, string k) -> number? ={
    if (has(tab, k)) { return tab[k]; }
    return null;
}
```
