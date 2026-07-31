---
title: "The agent loop"
group: "LLM & Agents"
lead: "`agent(...)` runs the tool-calling cycle: the model asks for a tool, the runtime **runs the real function** and returns the result, repeating until the final answer."
---
## How it works

The endpoint contract is simple:

```text
POST {model, messages, tools}
   -> {"tool_call":  {"name": "...", "arguments": {...}}}    (one tool)
   -> {"tool_calls": [{"name": "...", "arguments": ...}, …]}  (several, run together)
   -> {"content": "final answer"}                            (ends)
```

On each request the runtime unpacks the arguments, calls the matching `tool fn`, serializes the return and gives it back to the model — until a `content` arrives. `arguments` may be an object or a JSON-encoded string; both are accepted, since providers differ.

**Several tools in one step run in parallel.** The model chose them without seeing any of their results, so they cannot depend on each other, and running them one after another only adds latency. Nothing to enable.

## When a tool fails

A tool that fails does not end the run. Three cases, all handed back to the model as a value it can read and correct:

| What went wrong | What the model receives |
|---|---|
| the tool does not exist | `{"error": "unknown tool: nope"}` |
| the arguments will not parse | `{"error": "could not read the arguments for add: …"}` |
| the tool aborts (÷0, index out of range) | `{"error": "tool \"divide\" failed: … DivByZero …"}` |

That last one matters most: a `tool fn` is ordinary Cryo code and can abort, and before 11.20 it took the entire program with it — discarding everything the run had achieved over one bad argument.

## Outcomes: `agent_try`

`agent(...)` returns `""` when anything goes wrong — including running out of steps, which is indistinguishable from an agent that simply had nothing to say. `agent_try` gives the outcome as a value, using the same type as [`llm_try`](#/schema):

```cryo
match agent_try("gpt-4o-mini", task, {
    "steps": 6,
    "tools": ["add", "divide"],
    "max_context": 32000
}) {
    LlmOk(answer) => print(answer);
    LlmFailed(kind, why) if kind == "step_budget" => escalate(why);
    LlmFailed(kind, why) => print("[${kind}] ${why}");
}
```

`kind` is `step_budget` when the rounds run out, or any of the [transport kinds](#/schema) — `timeout`, `rate_limited`, `refused` and the rest — when the provider itself fails mid-loop.

| Option | Meaning |
|---|---|
| `steps` | how many tool rounds before giving up (default 8) |
| `tools` | an array of tool names to expose; omit for all of them |
| `max_context` | conversation budget in bytes (default 24000) |

**Long runs stay inside the window.** Tool results accumulate, and eventually exceed what the model accepts. When `max_context` is reached the **oldest tool exchanges** are dropped — never the first message, because losing the task leaves the model working on a question it can no longer see.

See [`example_agent_loop.cryo`](https://github.com/victorscosta/Pyro_Cryo/blob/main/Cryo/examples/example_agent_loop.cryo).

## Simple form

```cryo
tool fn fetch_price(string sku) -> number ={ /* ... */ }
tool fn apply_discount(number price, number pct) -> number ={
    return price - (price * pct / 100.0);
}

string response = agent("gpt-x", "What is the price of SKU-1 with a 10% discount?");
print(response);
```

The model chains `fetch_price` → `apply_discount` → final answer on its own.

## Configurable agent

`agent` optionally takes a **tool subset** (array of names) and a **step limit**:

```cryo
// agent(model, prompt, [tools...], maxSteps)
string r = agent("gpt-x",
    "Create a landing page and save it to build/landpage.html.",
    ["build_html", "save_page", "open_page"], 5);
```

- **Tool subset** — restricts what the agent may call on that invocation.
- **maxSteps** — cap on loop iterations (default: 8; any value ≤ 0 reverts to 8).

## Realistic example: e-commerce with 6 tools

```cryo
struct Product { string name; number price; }

tool fn fetch_customer(string email) -> string ={ /* ... */ }
tool fn fetch_product(string sku) -> Product ={ /* ... */ }
tool fn check_stock(string sku) -> int ={ /* ... */ }
tool fn calculate_freight(string zipcode, int qty) -> number ={ return 12.50 + qty * 6.00; }
tool fn apply_coupon(number total, string coupon) -> number ={
    if (coupon == "PROMO10") { return total * 0.90; }
    return total;
}
tool fn create_order(string customer, number total) -> string ={ return "PED-1007"; }

string response = agent("gpt-x",
    "Place an order for ana@shop.com: 2 units of SKU-1, coupon PROMO10.");
```

> The loop was validated end-to-end over the OpenAI protocol (multi-step tool-calling). See how to plug a real provider in [Connecting a real LLM](#/llm-real).
