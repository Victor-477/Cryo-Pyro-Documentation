#!/usr/bin/env bash
# ============================================================
#  Build the in-browser Pyro engine for the docs playground.
#
#  Produces assets/wasm/pyrovm.{js,wasm}: the Pyro C VM compiled
#  to WebAssembly, with the SELF-HOSTED compiler's bytecode
#  embedded at /pyroc.pyro inside it.
#
#  That pairing is the whole idea. The browser compiles Cryo by
#  running pyroc.pyro on the VM, then runs the bytecode that
#  comes out — on the same VM. So the page executes the same C
#  VM and the same compiler as everywhere else, and the docs do
#  not become a fourth engine that has to be kept in parity with
#  the other six.
#
#  Needs emscripten (https://emscripten.org). On Windows install
#  emsdk at a SHORT path such as C:\emsdk — unzipping it inside a
#  deep directory hits the 260-character path limit and fails
#  midway with a WinError 206.
#
#  Usage, from the repository that contains both checkouts:
#      ./tools/wasm/build.sh
#  or with an explicit toolchain:
#      EMCC=/c/emsdk/upstream/emscripten/emcc.exe ./tools/wasm/build.sh
# ============================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS="$(cd "$HERE/../.." && pwd)"          # the documentation checkout
ROOT="$(cd "$DOCS/.." && pwd)"             # the parent holding Cryo/, Pyro/, Burnout/
OUT="$DOCS/assets/wasm"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

EMCC="${EMCC:-emcc}"
PYTHON="${PYTHON:-python}"

for p in "$ROOT/Pyro/vm/main.c" "$ROOT/Burnout/cryoc.py" "$ROOT/Cryo/selfhost/pyroc.cryo"; do
  [ -f "$p" ] || { echo "missing: $p"; echo "run this from a checkout beside Cryo/, Pyro/ and Burnout/"; exit 1; }
done
command -v "$EMCC" >/dev/null 2>&1 || [ -x "$EMCC" ] || { echo "emcc not found (set EMCC=...)"; exit 1; }

echo "1/2  compiling the self-hosted compiler to bytecode"
# Built fresh rather than committed: the engine must carry the compiler as it
# is in THIS tree, or the playground quietly runs an older language than the
# documentation around it describes.
"$PYTHON" "$ROOT/Burnout/cryoc.py" "$ROOT/Cryo/selfhost/pyroc.cryo" \
  --backend pyro -o "$WORK/pyroc.pyro" --no-banner --no-cache >/dev/null

echo "2/2  compiling the VM to WebAssembly"
mkdir -p "$OUT"
( cd "$WORK" && "$EMCC" -O2 -std=gnu11 \
    -include "$HERE/wasm_shim.h" \
    "$ROOT/Pyro/vm/main.c" \
    "$ROOT/Pyro/vm/pyro_runtime.c" \
    -o "$OUT/pyrovm.js" \
    -sMODULARIZE=1 -sEXPORT_NAME=PyroVM \
    -sINVOKE_RUN=0 -sEXIT_RUNTIME=1 \
    -sEXPORTED_RUNTIME_METHODS=FS,callMain \
    -sALLOW_MEMORY_GROWTH=1 -sFORCE_FILESYSTEM=1 \
    --embed-file pyroc.pyro@/pyroc.pyro )

echo
echo "built:"
ls -la "$OUT/pyrovm.js" "$OUT/pyrovm.wasm"
echo
echo "Commit both files — GitHub Pages serves them as-is, with no build step."
