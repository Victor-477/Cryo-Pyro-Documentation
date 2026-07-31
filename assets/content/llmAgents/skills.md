---
title: "Native skills"
group: "LLM & Agents"
lead: "LLM skills are a language construct, **compiled into the binary** (no `.md` files), introspectable in a compact way."
---
> Skills are available on the **go** backend.

## Declaring skills

```cryo
skill summarize {
    desc:        "Summarize a text into objective bullets";
    model:       "gpt-x";
    temperature: 0.2;
    max_tokens:  512;
    tools:       ["count_words"];
}

skill translate {
    desc:  "Translate text between languages";
    model: "gpt-x-mini";
    tools: [];
}
```

## Introspection

| Builtin | Returns |
|---|---|
| `skills()` | names of all skills |
| `skill_get(n)` | the `Skill` object (fields `desc`, `model`, `config[...]`) |
| `skill_has(n)` | `true` if the skill exists |
| `skills_json()` | catalog in JSON (no markdown) |

```cryo
string[] names = skills();
Skill s = skill_get("summarize");
print(s.desc);
print(s.model);
print(s.config["temperature"]);
print(skills_json());
```

Since skills live in the binary, there are no loose files to version or sync — the catalog is always consistent with the compiled code.
