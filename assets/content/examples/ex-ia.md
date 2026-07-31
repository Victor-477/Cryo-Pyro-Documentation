---
title: "AI agents & skills"
group: "Examples"
lead: "Structured output, tools and the agent loop — on the `go` backend."
---
## AI agents (go backend)

Typed structured output and a tool-calling loop, built into the language.

```cryo
schema Invoice { string customer; number total; string[] items; }
tool fn fetch_price(string sku) -> number ={ return 19.90; }

// the model fills a validated Invoice
Invoice inv = llm("gpt-x", "Extract the invoice: " + text) as Invoice;

// the model asks for tools; the runtime runs them and loops
string answer = agent("gpt-x", "Price of SKU-1 with 10% off?");
```

```bash
python burnout/cryoc.py demo.cryo --backend go --run
```
