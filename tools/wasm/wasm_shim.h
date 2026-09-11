/* ============================================================
   Shim for building the Pyro C VM as WebAssembly.

   Force-included ahead of the runtime (-include), so pyro_runtime.c
   and main.c compile UNCHANGED. That is the point of this file: the
   runtime is shared by the C VM, the AOT translator and now the
   browser, and a web-only #ifdef inside it would be a fourth thing
   every future edit has to keep in mind.

   It is pure plumbing — nothing here changes what the VM DOES.
   Emscripten's headers gate the POSIX names the runtime uses behind
   _GNU_SOURCE, and the runtime reaches clock_gettime through
   whatever <time.h> the host happened to include for it.

   What does NOT need a shim, and is worth knowing: popen/pclose are
   declared and linked by emscripten, and fail at run time. So
   `exec()` in a browser reports a failed command rather than
   pretending to have run one — the same answer the sandbox gives
   (11.11), reached without a special case.
   ============================================================ */
#ifndef PYRO_WASM_SHIM_H
#define PYRO_WASM_SHIM_H

#ifndef _GNU_SOURCE
#define _GNU_SOURCE 1
#endif

#include <time.h>     /* clock_gettime, CLOCK_REALTIME */
#include <unistd.h>   /* usleep */
#include <stdio.h>    /* popen, pclose */

#endif /* PYRO_WASM_SHIM_H */
