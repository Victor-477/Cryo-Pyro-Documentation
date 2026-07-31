---
title: "Installation"
group: "Getting Started"
lead: "The Cryo compiler is written in Python. Extra dependencies depend only on the backend you use."
---
## Requirements

| You want to... | You need |
|---|---|
| Compile `.cryo` (any target) | **Python 3.10+** |
| Run the **go** target (default) | **Go 1.18+** |
| Run the **pyro** target (bytecode + VM) | **Go 1.18+** *or* **gcc** (either VM works) |
| Run the **node** target (JavaScript) | **Node.js** |
| Run the **c** / **asm** targets | **gcc** on `PATH` (MinGW on Windows) |
| Build [standalone native binaries](#/nativo) (`pyro build`) | **gcc** (or clang/zig/MSVC) |
| Run the **wasm** target | any browser, or **Node.js** |
| Compile **without Python** ([self-hosted](#/selfhost)) | a built VM + `build/pyroc.pyro` |

> The Python compiler **always** generates the source file (`.go`, `.pyro`, `.c`, `.s` or `.wasm`). The toolchain is only needed to build/run the binary.

A C compiler is the one that unlocks the most: it builds the C VM, the AOT native route and `pyro build`. On Windows, MinGW or MSVC both work.

## Getting the project

```bash
git clone https://github.com/Victor-477/Cryo.git      # the language front-end
git clone https://github.com/Victor-477/Burnout.git   # the compiler
git clone https://github.com/Victor-477/pyro.git      # the VM / bytecode
```

The entry point is `burnout/cryoc.py`. Run it from the project root.

## Verifying

```bash
# run the smoke-test suite (validates the code generators)
python burnout/tests/test_smoke.py
```

If you have Go installed, compile and run a core example:

```bash
python burnout/cryoc.py cryo/examples/example_bytecode.cryo --backend pyro --run
```

## Windows: full setup

A complete Windows install, from nothing to native binaries. Only **Python** is strictly required; add the rest for the targets you want.

### 1. Python (required)

Install **Python 3.10+** from [python.org](https://www.python.org/downloads/windows/) and tick *"Add python.exe to PATH"* in the installer. Verify in a new terminal:

```powershell
python --version
```

### 2. A C compiler — the one that unlocks the most

A C compiler builds the C VM, the [AOT native route](#/nativo) and `pyro build`. Two options on Windows:

- **MinGW-w64** (recommended, lightweight). Install [MSYS2](https://www.msys2.org/) then, in its shell, `pacman -S mingw-w64-x86_64-gcc`; or use a standalone [WinLibs](https://winlibs.com/) build. Add the folder that contains `gcc.exe` (e.g. `C:\mingw64\bin`) to your `PATH`.
- **MSVC** — install the *Build Tools for Visual Studio* with the C++ workload, and compile from a *Developer Command Prompt*.

```powershell
gcc --version    # MinGW
```

> A 64-bit toolchain is preferable. On a 32-bit MinGW everything still runs, but pointers are 32-bit — fine for trying things out, not for shipping.

### 3. Go (optional — default backend & VM bootstrap)

Install **Go 1.18+** from [go.dev/dl](https://go.dev/dl/). It powers the `go` backend and can build the Pyro VM. If you have a C compiler you can build the C VM instead and skip Go entirely.

### 4. Node.js (optional — `node` and `wasm` targets)

Install **Node.js** from [nodejs.org](https://nodejs.org/) to run the `node` backend and to test [WebAssembly](#/wasm) modules outside a browser.

### Putting it together

From the project root in PowerShell:

```powershell
# 1. sanity-check the compiler (no toolchain needed)
python Burnout\tests\test_smoke.py

# 2. build the Pyro VM once — Go...
go build -o build\pyrovm.exe Pyro\vm\main.go
# ...or C (needs -lws2_32 on Windows, for http_serve's sockets)
gcc -O2 -std=c11 -o build\pyrovm.exe Pyro\vm\main.c Pyro\vm\pyro_runtime.c -lm -lws2_32

# 3. compile and run a program on the VM
python Burnout\cryoc.py Cryo\examples\example_stdlib.cryo --backend pyro --run

# 4. build a standalone native .exe (no VM, no Python at runtime)
python Burnout\pyro.py build Cryo\examples\example_stdlib.cryo -o build\demo.exe
build\demo.exe
```

### Ready-made build script (c/asm backends)

For the native c/asm backends there is also a helper that locates gcc (including common MSYS2/TDM/WinLibs installs), generates the Win64 assembly and builds the `.exe`:

```bat
burnout\scripts\build_win64.bat cryo\examples\example_asm.cryo --run
```

If gcc is not on `PATH`, the script prints install instructions and exits.
