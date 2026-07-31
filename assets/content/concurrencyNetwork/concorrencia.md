---
title: "Concurrency"
group: "Concurrency & Network"
lead: "`spawn` fires off concurrent work and returns a `future<T>`; `await` collects the result. On the Go backend they lower to goroutines + channels."
---
> Concurrency is available on the **go** backend.

## spawn / await

```cryo
fn task(int id) -> int ={
    sleep(30);
    return id * id;
}

future<int> a = spawn task(6);   // fire off
future<int> b = spawn task(7);
int ra = await a;                   // collect
int rb = await b;
print(ra + rb);                     // 36 + 49 = 85
```

## Fan-out: N tasks in parallel

The classic pattern of concurrent calls (e.g. several LLM calls at once):

```cryo
int[] ids = [1, 2, 3, 4, 5];
future<int>[] pending = [];
for (int id in ids) {
    pending.push(spawn task(id));   // fire all at once
}
int sum = 0;
for (future<int> f in pending) {
    sum += await f;                    // collect the results
}
```

## sleep

`sleep(ms)` pauses execution for the given number of milliseconds — useful to simulate I/O and for *backoff*.
