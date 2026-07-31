---
title: "HTTP"
group: "Concurrency & Network"
lead: "Built-in HTTP client to talk to APIs — from SaaS services to LLM providers."
---
> HTTP is available on the **go** and **pyro** backends (`http_get`/`http_post`/`sleep`).

## http_get and http_post

```cryo
string body = http_get("http://example.com");
string resp  = http_post("https://api.example.com/v1/items", payload);
```

Both return the response body as a `string`. With no network available, they return `""` — the program keeps compiling and running.

## Combining with concurrency

Fire several requests in parallel with [spawn/await](#/concorrencia):

```cryo
fn download(string url) -> string ={
    return http_get(url);
}

future<string> f1 = spawn download("https://a.example.com");
future<string> f2 = spawn download("https://b.example.com");
string r1 = await f1;
string r2 = await f2;
```

To call a real LLM through an HTTP gateway, see [Connecting a real LLM](#/llm-real).
