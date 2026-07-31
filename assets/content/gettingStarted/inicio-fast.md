---
title: "Quick start"
group: "Getting Started"
lead: "Write, compile and run a Cryo program in a few commands."
---
## 1. Write a `.cryo`

Create `hello.cryo`:

```cryo
fn greeting(string name) -> string ={
    return "Hello, " + name + "!";
}

int[] numbers = [1, 2, 3, 4, 5];
int sum = 0;
for (int i = 0; i < len(numbers); i++) {
    sum += numbers[i];
}

print(greeting("Cryo"));
print("sum:");
print(sum);
```

> **Note the `={`** — a function body opens with the `={` token (not `{`). It is Cryo's body syntax.

## 2. Compile and run

```bash
# go target (default) — only needs Go installed
python burnout/cryoc.py hello.cryo --run

# or the Pyro target (custom bytecode + VM)
python burnout/cryoc.py hello.cryo --backend pyro --run
```

`--run` compiles and executes. Without it, only the artifact is generated under `build/`.

## 3. Explore

```bash
python burnout/cryoc.py hello.cryo --tokens     # print the tokens
python burnout/cryoc.py hello.cryo --ast        # print the AST
python burnout/cryoc.py hello.cryo --audit      # security audit
python burnout/cryoc.py hello.cryo --backend pyro --dis   # disassemble the bytecode
```

Done — from here, dive into the [language syntax](#/sintaxe) or jump straight to [AI agents](#/agent).
