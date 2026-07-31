---
title: "Structs, enums, generics & traits"
group: "Examples"
lead: "Model your domain: algebraic data types with exhaustive matching, plus compile-time generics and traits."
---
## Structs, enums and pattern matching

Algebraic data types model a result that is either a value or an error — no `null`, and the `match` is checked for exhaustiveness at compile time.

```cryo
enum Result { Ok(number), Err(string) }

fn divide(number a, number b) -> Result ={
    if (b == 0.0) { return Err("division by zero"); }
    return Ok(a / b);
}

fn show(Result r) -> string ={
    match r {
        Ok(v)  => { return "= " + to_string(v); }
        Err(e) => { return "error: " + e; }
    }
    return "?";
}

print(show(divide(10.0, 4.0)));   // = 2.5
print(show(divide(1.0, 0.0)));    // error: division by zero
```

## Generics

Resolved by **monomorphization** at compile time, so every backend gets them. The type argument is written explicitly at the call site:

```cryo
fn max_of<T>(T a, T b) -> T ={
    if (a > b) { return a; }
    return b;
}

print(max_of<int>(3, 7));             // 7
print(max_of<string>("abc", "abd"));  // abd
```

## Traits

A contract plus an implementation, dispatched statically at compile time:

```cryo
struct Person { string name; int age; }

trait Printable { fn to_str() -> string; }

impl Printable for Person {
    fn to_str() -> string ={ return this.name + " (" + to_string(this.age) + ")"; }
}

Person p = Person{ name: "Ada", age: 36 };
print(p.to_str());            // Ada (36)
```

```bash
python burnout/cryoc.py demo.cryo --backend pyro --run
```
