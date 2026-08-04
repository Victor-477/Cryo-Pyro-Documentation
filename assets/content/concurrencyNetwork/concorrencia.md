---
title: "Concurrency"
group: "Concurrency & Network"
lead: "`spawn` fires off concurrent work and returns a `future<T>`; `await` collects the result. Go lowers them to goroutines; the Pyro VM runs them on its own scheduler."
---
> Concurrency runs on the **go** and **pyro** backends. `node` and `c` refuse it with a message rather than miscompiling.

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

## How it runs on each backend

| Backend | How |
| --- | --- |
| `go` | one goroutine per `spawn`; the future is a buffered channel. Real OS-level parallelism |
| `pyro` | one task per `spawn` on the VM's own **cooperative, single-threaded** scheduler |
| `node`, `c` | refused at compile time — `use --backend go or pyro` |

### What the Pyro scheduler does and does not give you

Tasks share the heap and the globals, exactly as goroutines do, but no two are
ever mid-instruction at the same moment. Two things follow:

- **The output is deterministic.** Tasks start in `spawn` order and switch only
  at defined points, so a program prints the same thing on every run.
- **There is no CPU parallelism.** Two tasks that only compute take as long as
  running them one after the other.

The win is on *waiting*, not on computing. `sleep` is a yield point: a task that
sleeps lets the others run, so a fan-out of five 200ms sleeps costs about 200ms
rather than a second.

```cryo
fn t(int n) -> int ={ sleep(200); return n * n; }

int[] ids = [1, 2, 3, 4, 5];
future<int>[] pending = [];
for (int id in ids) { pending.push(spawn t(id)); }
int sum = 0;
for (future<int> f in pending) { sum += await f; }
print(sum);          // 55, after ~200ms and not ~1000ms
```

### `spawn` binds tightly

`spawn` takes a *unary* expression, so `spawn base * 2` means `(spawn base) * 2`
on every backend. Parenthesise anything that is not a plain call:

```cryo
future<int> f = spawn (base * 2);   // what you meant
future<int> g = spawn work(base);   // the common form
```

Variables used inside a `spawn` are captured **by value** on the pyro backend.
A variable that is reassigned later in the enclosing function is refused rather
than captured, because pyro would see the old value and go the new one.

### Deadlock

A cycle of `await`s is reported and the tasks named, rather than hanging:

```
[Cryo Concurrency] deadlock: no task can make progress
  task 0 is awaiting task 3, which has not finished
  task 3 is awaiting task 4, which has not finished
```

### Two places the backends disagree

- **Awaiting the same future twice** returns the value again on pyro, but
  deadlocks a go binary — there the future is a channel and the second receive
  blocks forever. Await a future once.
- **The order of interleaved output** between tasks is fixed on pyro and a race
  on go. A program whose output depends on that ordering has no stable meaning
  on the go backend.
