---
title: "Schema & structured output"
group: "LLM & Agents"
lead: "Declare a `schema` and get **typed, validated** LLM responses with `llm(...) as T`."
---
> LLM features are available on the **go** backend. Complete SaaS/LLM roadmap (Phase 3).

## Declaring a schema

A `schema` is a struct whose **JSON Schema** is generated natively at compile time:

```cryo
schema Invoice {
    string   customer;
    number   total;
    string[] items;
    bool     paid;
}
```

## schema_of(T)

Get the JSON Schema of a type — ready to send to a model:

```cryo
print(schema_of(Invoice));
```

## llm(...) as T — structured output

The `llm("model", prompt) as Type` call asks the model for a response in the schema's shape, **deserializes and validates** it (with retry):

```cryo
string text = "Customer Ana, total 149.90, items: pro plan";
Invoice f = llm("gpt-x", "Extract the invoice: " + text) as Invoice;
print(f.customer);
print(f.total);
```

## Raw call (no schema)

Without `as T`, `llm` returns the *completion* text:

```cryo
string response = llm("gpt-x", "Summarize in one sentence: Cryo compiles to Pyro");
```

> The endpoint is pluggable via `CRYO_LLM_URL` / `CRYO_LLM_KEY`. With no endpoint, `llm(...)` returns empty — the program compiles and runs. See [Connecting a real LLM](#/llm-real).

## Generation controls

A third argument tunes the request. It is a map literal, and the option names are **checked when you compile**:

```cryo
string answer = llm("gpt-4o-mini", "Name the capital of France.", {
    "temperature": 0.0,
    "seed": 42,
    "max_tokens": 20
});
```

| Option | Type | Meaning |
|---|---|---|
| `temperature` | number `0.0`–`2.0` | randomness of the sampling |
| `top_p` | number `0.0`–`1.0` | nucleus sampling |
| `max_tokens` | int | cap on the reply length |
| `stop` | string, or array of strings | sequences that end generation |
| `seed` | int | same seed and same input → same output |
| `timeout` | int (milliseconds) | how long *you* will wait |

**`temperature: 0.0` with a fixed `seed` is what makes a program that calls a model testable** — without them the same input can produce a different answer on every run, and there is nothing to assert against.

**`timeout` is yours, not the provider's.** It is not sent in the payload; it bounds the HTTP client, so a model that stalls cannot hang your program. A call that times out returns the empty string rather than aborting.

Option values need not be literals — a seed held in a variable is the usual case:

```cryo
int run_seed = 1234;
string r = llm("gpt-4o-mini", "Pick a colour.", {
    "temperature": 0.0,
    "seed": run_seed
});
```

Controls compose with structured output — the schema and the options travel in the same request:

```cryo
Person p = llm("gpt-4o-mini", "Invent a person as JSON.", {
    "temperature": 0.0,
    "seed": 7
}) as Person;
```

**Mistakes are compile errors, not silent no-ops.** An unrecognised option reaching an HTTP API is ignored or rejected far from the line that wrote it, and a `temprature` typo that quietly yields default-temperature output is a failure the program cannot notice:

```cryo
llm("m", "p", { "temprature": 0.2 });    // ⛔ unknown option 'temprature'
llm("m", "p", { temperature: 0.2 });      // ⛔ names are map keys — quote them
llm("m", "p", { "max_tokens": 1.5 });     // ⛔ takes an int
llm("m", "p", { "seed": 1, "seed": 2 });  // ⛔ set twice
```

The second one matters more than it looks: a bare key in Cryo is a *variable reference*, so without this check it would surface much later as `undeclared variable 'temperature'`, which says nothing about the real mistake.

A call with no third argument behaves exactly as before. See [`example_llm_options.cryo`](https://github.com/victorscosta/Pyro_Cryo/blob/main/Cryo/examples/example_llm_options.cryo).

## When the call fails

`llm(...)` returns `""` when the request fails — which is also what an empty completion returns, so a program can neither tell them apart nor react. **`llm_try`** hands back the outcome as a value you can `match` on:

```cryo
match llm_try("gpt-4o-mini", question, { "retries": 3, "timeout": 10000 }) {
    LlmOk(text) => print(text);
    LlmFailed(kind, why) if kind == "rate_limited" => backOff();
    LlmFailed(kind, why) => print("failed [${kind}]: ${why}");
}
```

| `kind` | Meaning | Retried? |
|---|---|---|
| `no_endpoint` | `CRYO_LLM_URL` is not set | no |
| `transport` | the connection failed | **yes** |
| `timeout` | the `timeout` budget ran out, or HTTP 408 | **yes** |
| `rate_limited` | HTTP 429 — `Retry-After` honoured when present | **yes** |
| `server_error` | HTTP 5xx | **yes** |
| `refused` | HTTP 4xx — a bad key, a bad model name | no |

**Nothing aborts.** A failure is an ordinary value, so an alternative is ordinary control flow rather than an exception handler:

```cryo
fn ask(string q) -> string ={
    match llm_try("big-model", q, { "retries": 1 }) {
        LlmOk(text) => { return text; }
        LlmFailed(kind, why) => { print("falling back (${kind})"); }
    }
    match llm_try("small-model", q, { "retries": 2 }) {
        LlmOk(text) => { return text; }
        LlmFailed(kind, why) => { return "unavailable: ${kind}"; }
    }
    return "";
}
```

### Retries and backoff

Only failures that can improve are retried, and the pause doubles each time — 200ms, 400ms, 800ms, capped at 8s. Answering a rate limit immediately just earns a second rate limit.

**A 4xx is never retried.** A wrong API key or a misspelled model name cannot be fixed by asking again, and each pointless retry costs real time; those return on the first attempt.

```cryo
llm_try("m", q, { "retries": 5 })   // patient: a batch job
llm_try("m", q, { "retries": 0 })   // one attempt: an interactive path
```

> The variants are `LlmOk`/`LlmFailed` rather than `Ok`/`Err` on purpose. Enum members share a namespace with the ones your program declares, and a project with `enum Result { Ok(int), … }` is likely — a silent clash would be much worse than a longer name. The trade is that [`?`](#/erros) does not apply to `LlmOutcome`, which keys on a variant called `Ok`; matching is the intended door here.

See [`example_llm_resilience.cryo`](https://github.com/victorscosta/Pyro_Cryo/blob/main/Cryo/examples/example_llm_resilience.cryo).

## Validation and repair

`as T` asks the model for JSON shaped like `T`. What comes back is not always that shape — and until 11.18 a reply that did not fit was **silently turned into a zero-valued `T`**:

| The model replied | You got |
|---|---|
| `{"name": "Ada"}` (no age) | `name=Ada age=0` |
| `{"name": "Ada", "age": "thirty-six"}` | `name=Ada age=0` |
| `Sure! Ada is 36.` | `name= age=0` |
| ` ```json {"name":"Ada","age":36} ``` ` | `name= age=0` |

`age=0` is indistinguishable from a person who really is 0, so the program could not tell a good answer from a discarded one.

**The reply is now checked against the schema**, and if it does not fit the model is asked again with the problem named:

```
<your original prompt>

Your previous reply could not be used: age is missing.
Reply with JSON only — no prose, no code fences — matching this schema exactly:
{"type":"object","properties":{…},"required":["name","age"]}
```

Nested shapes are checked all the way down, so the problem is specific — `items[0].qty should be an integer, got two` — which gives the model something it can actually act on.

### The `repair` budget

How many times to re-ask is an ordinary [generation option](#/schema):

```cryo
Person p = llm("gpt-4o-mini", "Invent a person as JSON.", {
    "temperature": 0.0,
    "seed": 7,
    "repair": 3        // default 2; 0 asks exactly once
}) as Person;
```

A fixed `seed` and `temperature: 0.0` make the retry reproducible too, which is what lets a model-calling program be tested at all. Like `timeout`, `repair` is consumed by the caller and never sent to the provider.

**Nothing aborts.** If the reply still does not fit after the budget, the value is left as it parsed and the reason goes to stderr — the program keeps running, and is never quietly handed a fabricated zero.

### Replies that need no repair

Code fences and surrounding prose are the commonest "bad" replies, and they are not really bad — the JSON is right there. It is extracted **before** validation, so these cost no extra round trip:

```
```json                       Here you go:
{"name": "Ada", "age": 36}    {"name": "Ada", "age": 36}
```                           Hope that helps!
```

See [`example_llm_repair.cryo`](https://github.com/victorscosta/Pyro_Cryo/blob/main/Cryo/examples/example_llm_repair.cryo).

## Streaming

`llm(...)` returns once the whole completion is ready. `llm_stream(...)` hands you each token as it arrives — a ten-second wait with a blank screen is the difference between a demo and something people will use:

```cryo
for (string token in llm_stream("gpt-4o-mini", "Write a haiku.", {
        "temperature": 0.7,
        "max_tokens": 60
    })) {
    print(token);
}
```

The same [generation controls](#/schema) apply. The request carries `"stream": true`, and the reply is read as **Server-Sent Events**: each `data:` line is JSON whose `content` (or `delta`) is the token, and `data: [DONE]` ends the stream. A provider that simply writes one line per token works too.

### The calls underneath

The loop is sugar over three builtins, which you can use directly when something has to happen between tokens:

| Call | Returns | Meaning |
|---|---|---|
| `llm_stream(model, prompt[, opts])` | `int` | open a stream; the value is a handle |
| `llm_next(h)` | `bool` | wait for the next token; `false` when the stream ends |
| `llm_token(h)` | `string` | the token `llm_next` just advanced to |
| `llm_close(h)` | `bool` | release a stream you are abandoning |

```cryo
int h = llm_stream("gpt-4o-mini", "Count to twenty.", { "timeout": 10000 });
int seen = 0;
while (llm_next(h)) {
    print(llm_token(h));
    seen = seen + 1;
    if (seen >= 5) {
        llm_close(h);   // stopping early: say so
        break;
    }
}
```

> **Close a stream you abandon.** The request runs concurrently and feeds a buffered channel; if you `break` without closing, that producer stays blocked until the process ends. In a script that costs nothing — in a server it is one stuck request each time. The `for` form reads to the end, so it needs no close.

**Why not the [`iter()` protocol](#/controle-de-fluxo)?** Because `iter()` returns a finished collection, and waiting for every token before the loop body runs once is precisely what streaming exists to avoid. The stream is consumed lazily instead, which is why it has its own two-call shape.

Streaming is **go-only**, like the rest of the LLM layer; `--backend node` and `--backend pyro` say so and name the backend to use. With no `CRYO_LLM_URL` set, the stream is empty and the loop body simply does not run.

See [`example_llm_stream.cryo`](https://github.com/victorscosta/Pyro_Cryo/blob/main/Cryo/examples/example_llm_stream.cryo).
