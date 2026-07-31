---
title: "Core language & stdlib"
group: "Examples"
lead: "Math, strings, conversions and control flow — the part that runs unchanged on every executable backend."
---
## Data, math and strings

The core language plus the standard library — runs on the Pyro VM, and unchanged on `go` and `node`.

```cryo
enum State { PENDING, ACTIVE, CLOSED }

fn hypotenuse(number a, number b) -> number ={
    return sqrt(pow(a, 2.0) + pow(b, 2.0));
}

fn slug(string title) -> string ={
    return lower(replace(trim(title), " ", "-"));
}

print(hypotenuse(3.0, 4.0));           // 5
print(slug("  Cryo compiles to Pyro  "));  // cryo-compiles-to-pyro

int[] nums = [3, 1, 2];
nums.push(4);
int total = 0;
for (int v in nums) { total += v; }
print("sum = ${total}");             // sum = 10

map<string, number> prices = { "coffee": 5.5, "tea": 4.0 };
print("coffee costs ${prices[\"coffee\"]}");
```

```bash
python burnout/cryoc.py demo.cryo --backend pyro --run
```

```bash
python burnout/cryoc.py demo.cryo --backend pyro --run
```
