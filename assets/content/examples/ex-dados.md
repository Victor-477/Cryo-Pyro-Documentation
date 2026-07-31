---
title: "JSON & error handling"
group: "Examples"
lead: "Typed JSON round-trips, and the ways Cryo reports failure."
---
## Native JSON

`json_encode`/`json_decode` work on the Pyro VM too (structs are maps there, so field access survives the round-trip).

```cryo
struct Order {
    string customer;
    number total;
    bool   paid;
}

Order o = new Order { customer: "Ana", total: 284.30, paid: false };
print(json_encode(o));

string input = "{\"customer\": \"Bruno\", \"total\": 99.9, \"paid\": true}";
Order q = json_decode(input) as Order;
print("decoded: ${q.customer} owes ${q.total}");
```

## Error handling

`try`/`catch`/`finally` and `throw` run on every executable backend, including the Pyro VM.

```cryo
fn risky(int n) -> int ={
    if (n < 0) { throw("negative: " + to_string(n)); }
    return n * 2;
}

try {
    print(risky(5));       // 10
    print(risky(-3));      // throws
} catch (string e) {
    print("caught: " + e); // caught: negative: -3
} finally {
    print("done");
}
```

```bash
python burnout/cryoc.py demo.cryo --backend pyro --run
```
