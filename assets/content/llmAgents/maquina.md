---
title: "Machine access"
group: "LLM & Agents"
lead: "The Pyro layer exposes `pyro_*` builtins to touch the system — run commands, read the environment, write and open files."
---
> `pyro_*` builtins are available on the **go** backend.

## System builtins

| Builtin | Effect |
|---|---|
| `pyro_exec(cmd)` | runs a command and returns its output (`string`) |
| `pyro_env(n)` | reads environment variable `n` |
| `pyro_args()` | command-line arguments (`string[]`) |
| `pyro_time()` | current timestamp (`int`) |
| `pyro_read()` | reads a line from input |
| `pyro_write_file(path, content)` | writes a file; returns `bool` |
| `pyro_open(path)` | opens a file/URL in the OS default app; returns `bool` |
| `pyro_exit(code)` | ends the process with the given code |

## Example

```cryo
string output = pyro_exec("echo hello-from-the-machine");
int now    = pyro_time();
print(now > 0);
```

## An agent that creates and opens a page

`pyro_write_file` and `pyro_open` let an agent materialize a file and open it in the browser:

```cryo
tool fn save_page(string html, string path) -> bool ={
    return pyro_write_file(path, html);
}
tool fn open_page(string path) -> bool ={
    return pyro_open(path);   // start (Windows) / open (macOS) / xdg-open (Linux)
}
```

> `pyro_open` picks the command by `runtime.GOOS`: `cmd /c start` on Windows, `open` on macOS and `xdg-open` on Linux.

> **Caution:** `pyro_exec` runs arbitrary code on the machine. The [static audit](#/seguranca) flags sensitive uses; review programs from untrusted sources before running them.
