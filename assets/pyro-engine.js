/* ============================================================
   The in-browser Pyro engine.

   Runs Cryo with no server: assets/wasm/pyrovm.js is the Pyro C VM
   compiled to WebAssembly, carrying the self-hosted compiler's
   bytecode at /pyroc.pyro inside it.

   A run is therefore two turns of the SAME VM:

     1. callMain(['/pyroc.pyro', '/main.cryo', '/out.pyro'])
        — the VM runs the compiler, which reads the source and
          writes bytecode, both through emscripten's in-memory FS.
     2. callMain(['/out.pyro'])
        — the VM runs what came out.

   Which is exactly what `pyrovm pyroc.pyro in.cryo out.pyro` then
   `pyrovm out.pyro` does at a command line. No Cryo semantics are
   implemented here; this file only moves bytes and collects output.

   A FRESH MODULE PER TURN. The VM ends through exit(), and an
   emscripten module whose runtime has exited cannot be called
   again — so each turn instantiates its own. That also means a
   program cannot leave state behind for the next run, which is the
   behaviour you want from a playground anyway.
   ============================================================ */
(function () {
  "use strict";

  var LOADER = "assets/wasm/pyrovm.js";
  var factory = null;      // the emscripten module factory, once loaded
  var loading = null;      // in-flight load, so two Runs share one fetch

  function load() {
    if (factory) return Promise.resolve(factory);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = LOADER;
      s.onload = function () {
        // MODULARIZE puts the factory on window under EXPORT_NAME.
        if (typeof window.PyroVM !== "function") {
          reject(new Error("pyrovm.js loaded but PyroVM is not a function"));
          return;
        }
        factory = window.PyroVM;
        resolve(factory);
      };
      s.onerror = function () {
        reject(new Error("could not load " + LOADER));
      };
      document.head.appendChild(s);
    });
    return loading;
  }

  /* One turn of the VM. `files` is written into its filesystem before
     main runs; `reads` names files to hand back afterwards. */
  function turn(args, files, reads) {
    return load().then(function (make) {
      var out = "";
      return make({
        noInitialRun: true,
        // Both streams go to one buffer, in the order they were written:
        // a Cryo program that aborts prints its message to stderr, and
        // that message is part of the result, not a separate channel.
        print: function (t) { out += t + "\n"; },
        printErr: function (t) { out += t + "\n"; }
      }).then(function (M) {
        Object.keys(files || {}).forEach(function (path) {
          M.FS.writeFile(path, files[path]);
        });
        var code = 0;
        try {
          code = M.callMain(args);
        } catch (e) {
          // exit() unwinds as an ExitStatus rather than an error.
          if (e && typeof e.status === "number") code = e.status;
          else throw e;
        }
        var got = {};
        (reads || []).forEach(function (path) {
          try { got[path] = M.FS.readFile(path); } catch (e) { got[path] = null; }
        });
        return { code: code || 0, out: out, files: got };
      });
    });
  }

  /* Compile and run one Cryo program. Resolves with
     {ok, out, stage} — `stage` is "compile" or "run", so a caller can
     say WHERE it failed rather than only that it did. */
  function run(source) {
    var enc = new TextEncoder();
    var t0 = (window.performance || Date).now();
    return turn(["/pyroc.pyro", "/main.cryo", "/out.pyro"],
                { "/main.cryo": enc.encode(source) },
                ["/out.pyro"])
      .then(function (c) {
        var bytes = c.files["/out.pyro"];
        // The compiler reports a refusal on its own output and exits
        // non-zero; with no bytecode there is nothing to run either way.
        if (c.code !== 0 || !bytes || !bytes.length) {
          return { ok: false, stage: "compile", out: c.out,
                   ms: Math.round((window.performance || Date).now() - t0) };
        }
        return turn(["/out.pyro"], { "/out.pyro": bytes }, []).then(function (r) {
          return { ok: r.code === 0, stage: "run", out: r.out,
                   ms: Math.round((window.performance || Date).now() - t0) };
        });
      });
  }

  window.PyroEngine = {
    run: run,
    // Lets the page show "loading engine…" and report a missing build
    // honestly instead of a Run that silently never returns.
    preload: load,
    ready: function () { return factory !== null; }
  };
})();
