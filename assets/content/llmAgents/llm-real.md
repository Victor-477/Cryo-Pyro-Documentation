---
title: "Connecting a real LLM"
group: "LLM & Agents"
lead: "The runtime speaks a simple contract. An included gateway translates that contract to the Chat Completions API (OpenAI-compatible)."
---
## The runtime contract

Cryo sends `POST {model, prompt|messages, tools?}` and expects back:

```json
{ "tool_call": { "name": "fetch_price", "arguments": { "sku": "SKU-1" } } }
```

or, to end:

```json
{ "content": "The discounted price is $17.91." }
```

The endpoint is configured with environment variables: `CRYO_LLM_URL` and `CRYO_LLM_KEY`.

## The included gateway

`burnout/scripts/llm_gateway.py` translates the Cryo contract to the Chat Completions API — compatible with OpenAI, Anthropic `/v1`, Groq, or local (Ollama/LM Studio):

```bash
# terminal 1 — the gateway (with your key)
set OPENAI_API_KEY=sk-...
set OPENAI_BASE_URL=https://api.openai.com/v1        # or another provider
python burnout/scripts/llm_gateway.py 8801
```

```bash
# terminal 2 — the Cryo agent pointing at the gateway
set CRYO_LLM_URL=http://127.0.0.1:8801
python burnout/cryoc.py cryo/examples/example_agent.cryo --backend go --run
```

## Without an endpoint

With no `CRYO_LLM_URL`, `llm(...)` and `agent(...)` return empty — but the program **compiles and runs** normally. This keeps builds and tests independent of the network.
