/* ============================================================
   Playground — an editable Cryo code space inside the docs.

   HOW IT MOUNTS. A page asks for one by writing a fenced block
   whose language is `playground`; the markdown renderer turns
   that into an ordinary .code-block, and this replaces it with
   the editor, seeding it from the block's own contents. So the
   seed program lives in the markdown next to the prose that
   explains it, and a page with no such block costs nothing.

   HOW IT RUNS. It does NOT interpret Cryo. The docs site is
   static, and a JavaScript interpreter would be a fourth engine
   that has to agree with the two VMs and the four code
   generators — invariant 1 says a program means the same thing
   everywhere, and the surest way to break that is to add an
   engine nobody runs the parity suite against.

   Instead it POSTs to the real toolchain: the Express server in
   `cryo-playground/`, which shells out to `Burnout/cryoc.py`.
   Same compiler as the command line, so the output here is the
   output you get locally.

   WITHOUT THE SERVER the page still does its job: you can edit,
   switch examples, read highlighted source and copy it, and the
   status pill says exactly which command starts the backend.
   What it will not do is pretend to run anything.
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "cryo-docs-playground";
  var API_KEY = "cryo-docs-playground-api";
  var DEFAULT_API = "http://localhost:3020";

  function api() {
    try { return localStorage.getItem(API_KEY) || DEFAULT_API; }
    catch (e) { return DEFAULT_API; }
  }
  function setApi(v) {
    try { localStorage.setItem(API_KEY, v); } catch (e) {}
  }
  function saved(seed) {
    try { return localStorage.getItem(STORE_KEY) || seed; }
    catch (e) { return seed; }
  }
  function save(v) {
    try { localStorage.setItem(STORE_KEY, v); } catch (e) {}
  }

  // The compiler narrates what it is doing on stdout — which file it wrote,
  // which VM it picked, a banner before the program starts. In a terminal
  // that is useful; here it buries the two lines the reader pressed Run for.
  // Dropped by the same rule test_cli.py uses to tell program output from
  // toolchain chatter.
  var TOOLCHAIN_LINE = /^\s*(?:→|✓|──|⚠)/;

  // What a Cryo program prints when it stops early. The wording is the
  // runtime's contract (12.13) and identical on every engine, which is
  // what makes matching on it safe rather than a guess about one backend.
  var ABORT_MARKER = /\[Cryo (?:Security|Assert|Concurrency)\]/;

  function programOutput(stdout) {
    return (stdout || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .filter(function (l) { return !TOOLCHAIN_LINE.test(l); })
      .join("\n")
      .trim();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ── the examples offered in the picker ────────────────────
  //
  // Deliberately small and each one about a single idea: a
  // playground people actually press Run on is one where the
  // first example finishes in a line or two. The longer tours
  // live in the Examples section of the docs.
  var EXAMPLES = [
    {
      id: "hello",
      name: "Hello, Cryo",
      code:
        'string who = "world";\n' +
        'print("hello, " + who + "!");\n' +
        '\n' +
        'int a = 10;\n' +
        'int b = 32;\n' +
        'print("${a} + ${b} = ${a + b}");\n'
    },
    {
      id: "collections",
      name: "Arrays & maps",
      code:
        'int[] xs = [3, 1, 2];\n' +
        'print(sort(xs));\n' +
        'print(sum(xs));\n' +
        '\n' +
        'map<string,int> ages = {"ana": 31, "bo": 24};\n' +
        'print(ages);\n' +
        'print(keys(ages));\n' +
        '\n' +
        '// A map renders ordered by the key\'s own TEXT, so int\n' +
        '// keys come out 1, 10, 2. Every backend agrees on it.\n' +
        'map<int,string> n = {2: "two", 10: "ten", 1: "one"};\n' +
        'print(n);\n'
    },
    {
      id: "functions",
      name: "Functions & recursion",
      code:
        'fn fib(int n) -> int ={\n' +
        '    if (n < 2) { return n; }\n' +
        '    return fib(n - 1) + fib(n - 2);\n' +
        '}\n' +
        '\n' +
        'for (int i in 0..10) {\n' +
        '    print("fib(${i}) = ${fib(i)}");\n' +
        '}\n'
    },
    {
      id: "adt",
      name: "Enums & match",
      code:
        'enum Result { Ok(int), Err(string) }\n' +
        '\n' +
        'fn half(int n) -> Result ={\n' +
        '    if (n % 2 != 0) { return Err("${n} is odd"); }\n' +
        '    return Ok(n / 2);\n' +
        '}\n' +
        '\n' +
        'for (int n in 0..5) {\n' +
        '    match half(n) {\n' +
        '        Ok(v)  => { print("half: ${v}"); }\n' +
        '        Err(e) => { print("error: ${e}"); }\n' +
        '    }\n' +
        '}\n'
    },
    {
      id: "optionals",
      name: "Optionals & errors",
      code:
        'int? missing = null;\n' +
        'int? present = 7;\n' +
        '\n' +
        'print(missing ?? 0);\n' +
        'print(present!);\n' +
        'print(missing == null);\n' +
        '\n' +
        'try {\n' +
        '    throw("something went wrong");\n' +
        '} catch (string e) {\n' +
        '    print("caught: " + e);\n' +
        '}\n'
    },
    {
      id: "strings",
      name: "Strings",
      code:
        'string s = "  Hello, Cryo World  ";\n' +
        'print("[" + trim(s) + "]");\n' +
        'print(upper(trim(s)));\n' +
        'print(replace(trim(s), "Cryo", "❄"));\n' +
        'print(split("a,b,c", ","));\n' +
        'print(starts_with(trim(s), "Hello"));\n' +
        '\n' +
        '// An empty needle inserts at every boundary.\n' +
        'print(replace("abc", "", "-"));\n'
    }
  ];

  // ── the widget ────────────────────────────────────────────

  function mount(block) {
    var seed = decodeURIComponent(block.getAttribute("data-raw") || "").trim();
    if (!seed) seed = EXAMPLES[0].code;

    var root = el("div", "pg");

    // toolbar
    var bar = el("div", "pg-bar");

    var picker = el("select", "pg-select");
    picker.setAttribute("aria-label", "Load an example");
    var custom = el("option", null, "Your code");
    custom.value = "__custom";
    picker.appendChild(custom);
    EXAMPLES.forEach(function (ex) {
      var o = el("option", null, ex.name);
      o.value = ex.id;
      picker.appendChild(o);
    });

    var backend = el("select", "pg-select");
    backend.setAttribute("aria-label", "Backend");
    [["pyro", "pyro (in browser)"], ["node", "node"], ["go", "go"],
     ["c", "c"], ["csharp", "csharp"], ["cpp", "cpp"]].forEach(function (b) {
      var o = el("option", null, b[1]);
      o.value = b[0];
      backend.appendChild(o);
    });

    var runBtn = el("button", "pg-run");
    runBtn.type = "button";
    runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">'
      + '<path d="M7 4l13 8-13 8z" fill="currentColor"/></svg><span>Run</span>';

    var resetBtn = el("button", "pg-ghost", "Reset");
    resetBtn.type = "button";
    var copyBtn = el("button", "pg-ghost", "Copy");
    copyBtn.type = "button";

    var pill = el("span", "pg-pill pg-pill-wait", "checking server…");
    // Named for what it is. `pyro` runs in the browser and does not care
    // about this at all; the pill only speaks for the other backends, and
    // a bare "offline" beside a playground that had just run something
    // would read as a contradiction.
    pill.title = "The local server, needed only by the non-pyro backends";

    bar.appendChild(picker);
    bar.appendChild(backend);
    bar.appendChild(runBtn);
    bar.appendChild(resetBtn);
    bar.appendChild(copyBtn);
    bar.appendChild(pill);

    // editor: a plain textarea with a highlighted layer behind it.
    // A contenteditable would fight the browser over undo, IME and
    // selection; a textarea gets all three right for free.
    var wrap = el("div", "pg-edit");
    var pre = el("pre", "pg-hl");
    var code = el("code");
    pre.appendChild(code);
    var ta = el("textarea", "pg-ta");
    ta.spellcheck = false;
    ta.setAttribute("aria-label", "Cryo source code");
    ta.value = saved(seed);
    wrap.appendChild(pre);
    wrap.appendChild(ta);

    var out = el("div", "pg-out");
    var outHead = el("div", "pg-out-head");
    var outTitle = el("span", "pg-out-title", "Output");
    var outMeta = el("span", "pg-out-meta", "");
    outHead.appendChild(outTitle);
    outHead.appendChild(outMeta);
    var outBody = el("pre", "pg-out-body");
    out.appendChild(outHead);
    out.appendChild(outBody);

    // A notice, not a tooltip. Picking `go` from the list looks exactly like
    // picking `pyro`, and the two do different things: one RUNS your program,
    // the other SHOWS IT TRANSLATED. Leaving that to be discovered by pressing
    // Run would make the page look broken for every language but one — a
    // reader on this site cannot install a Go compiler, the .NET SDK or gcc
    // into their browser tab, and no amount of waiting will change that.
    var note = el("div", "pg-note");
    note.hidden = true;

    root.appendChild(bar);
    root.appendChild(note);
    root.appendChild(wrap);
    root.appendChild(out);
    block.parentNode.replaceChild(root, block);

    // ── highlighting + scroll sync ──
    function paint() {
      var src = ta.value;
      // A trailing newline collapses in the <pre> layer, so the
      // highlighted text would drift one line short of the caret.
      code.innerHTML = window.Highlight
        ? window.Highlight(src + "\n", "cryo")
        : src.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "\n";
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
    }
    ta.addEventListener("input", function () { paint(); save(ta.value); picker.value = "__custom"; });
    ta.addEventListener("scroll", function () { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; });

    // Tab indents instead of leaving the field. Shift+Tab outdents.
    // Escape first restores Tab's normal focus behaviour, so the
    // editor never becomes a keyboard trap for anyone tabbing
    // through the page.
    var trapTab = true;
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { trapTab = false; return; }
      if (e.key !== "Tab" || !trapTab) return;
      e.preventDefault();
      var s = ta.selectionStart, t = ta.selectionEnd, v = ta.value;
      if (e.shiftKey) {
        var ls = v.lastIndexOf("\n", s - 1) + 1;
        if (v.slice(ls, ls + 4) === "    ") {
          ta.value = v.slice(0, ls) + v.slice(ls + 4);
          ta.selectionStart = ta.selectionEnd = Math.max(ls, s - 4);
        }
      } else {
        ta.value = v.slice(0, s) + "    " + v.slice(t);
        ta.selectionStart = ta.selectionEnd = s + 4;
      }
      paint(); save(ta.value);
    });
    ta.addEventListener("focus", function () { trapTab = true; });

    picker.addEventListener("change", function () {
      if (picker.value === "__custom") return;
      var ex = EXAMPLES.filter(function (x) { return x.id === picker.value; })[0];
      if (!ex) return;
      ta.value = ex.code;
      paint(); save(ta.value);
      outBody.textContent = "";
      outMeta.textContent = "";
    });

    resetBtn.addEventListener("click", function () {
      ta.value = seed;
      paint(); save(ta.value);
      picker.value = "__custom";
      outBody.textContent = "";
      outMeta.textContent = "";
    });

    copyBtn.addEventListener("click", function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(ta.value).then(function () {
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      });
    });

    // ── backend ──
    var online = false;

    // What each non-pyro language would need on the machine running it. Named
    // specifically rather than as "a toolchain": "needs the .NET SDK" tells a
    // reader why a web page cannot do it, where "unsupported" only tells them
    // to be disappointed.
    // The file extension each backend writes, so the command the page offers
    // is the one that actually works when it is pasted.
    var EXT = {
      node: ".js", go: ".go", c: ".c", csharp: ".cs", cpp: ".cpp"
    };

    var NEEDS = {
      node: "Node.js",
      go: "a Go compiler",
      c: "a C compiler (gcc/clang)",
      csharp: "the .NET SDK",
      cpp: "a C++ compiler (g++/clang++)"
    };

    // `pyro` is the only language this page can EXECUTE: the Pyro C VM is
    // compiled to WebAssembly and shipped with the site. Everything else is
    // shown as a translation of your program into that language.
    function isRunnable() {
      return backend.value === "pyro";
    }

    function syncMode() {
      var b = backend.value;
      runBtn.querySelector("span").textContent = isRunnable() ? "Run" : "Convert";
      if (isRunnable()) {
        note.hidden = true;
        note.textContent = "";
        outTitle.textContent = "Output";
        return;
      }
      note.hidden = false;
      outTitle.textContent = b + " source";
      note.innerHTML =
        '<strong>' + b + ' is shown, not run.</strong> Running it needs '
        + (NEEDS[b] || "its own toolchain")
        + ' on the machine, and a web page cannot install one — so for '
        + '<code>' + b + '</code> the playground shows <strong>the conversion'
        + '</strong>: the ' + b + ' source your Cryo compiles to. '
        + 'Switch back to <code>pyro</code> to run the program here in the '
        + 'browser.';
    }

    function setPill(state, text, title) {
      pill.className = "pg-pill pg-pill-" + state;
      pill.textContent = text;
      if (title) pill.title = title;
    }

    // The conversion is produced by the code generators in Burnout, which are
    // Python and are not in your browser — so it needs the local server, for
    // the same reason running does. Saying that outright is the point: the
    // alternative is a Convert button that fails and does not explain itself.
    function offlineHelp() {
      var b = backend.value;
      outBody.className = "pg-out-body pg-err";
      outBody.textContent =
        "Converting to " + b + " needs the local server, and none is\n" +
        "reachable at " + api() + ".\n\n" +
        "The " + b + " code generator lives in Burnout (Python), not in this\n" +
        "page — the only engine shipped with the site is the Pyro VM, which\n" +
        "is why `pyro` runs here and nothing else does.\n\n" +
        "Two ways on from here. Press Copy, then either\n\n" +
        "    python Burnout/cryoc.py main.cryo --backend " + b + " -o out"
            + (EXT[b] || "") + "\n\n" +
        "to get the " + b + " source, or add --run to compile and run it. Or\n" +
        "start the server and this page converts (and runs) for you:\n\n" +
        "    cd cryo-playground\n" +
        "    npm install\n" +
        "    npm start\n";
      outMeta.textContent = "not converted";
    }

    // The in-flight health check, so a Run pressed during it waits for the
    // answer instead of being told there is no backend. Without this, the
    // first click after a page load reported "offline" for a server that was
    // about to say ready — the wrong answer, and the one most likely to be
    // seen, since the check runs exactly when the page appears.
    var pinging = null;

    function ping() {
      setPill("wait", "checking server…");
      var done = false;
      var t = setTimeout(function () {
        if (!done) { done = true; online = false; setPill("off", "no server", "No server at " + api() + " — `pyro` still runs in the browser"); }
      }, 2500);
      pinging = fetch(api() + "/api/health", { method: "GET" })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (j) {
          if (done) return;
          done = true; clearTimeout(t); online = true;
          setPill("on", "server ready", (j && j.engine) ? j.engine : "backend ready");
        })
        .catch(function () {
          if (done) return;
          done = true; clearTimeout(t); online = false;
          setPill("off", "no server", "No server at " + api() + " — `pyro` still runs in the browser");
        })
        // Cleared once settled, so only a Run pressed DURING a check waits
        // on one; every later Run reads `online` directly.
        .then(function () { pinging = null; });
    }

    // `pyro` runs HERE, in WebAssembly, with no server — which is what makes
    // the playground work on GitHub Pages. The other backends are whole
    // toolchains (a Go compiler, the .NET SDK, gcc) that cannot be shipped to
    // a browser, so they still go to the local server.
    function runInBrowser() {
      runBtn.disabled = true;
      outMeta.textContent = window.PyroEngine.ready() ? "running…" : "loading engine…";
      outBody.textContent = "";
      outBody.className = "pg-out-body";
      window.PyroEngine.run(ta.value).then(function (r) {
        var text = r.out.replace(/\r\n/g, "\n").trim();
        var aborted = ABORT_MARKER.test(text);
        outBody.textContent = text || "(no output)";
        outBody.className = "pg-out-body" + (r.ok && !aborted ? "" : " pg-err");
        outMeta.textContent =
          (aborted ? "aborted"
            : r.ok ? "ok"
            : (r.stage === "compile" ? "did not compile" : "exit ≠ 0"))
          + " · " + r.ms + " ms · in browser";
      }).catch(function (e) {
        outBody.className = "pg-out-body pg-err";
        outBody.textContent =
          "The in-browser engine could not be loaded.\n\n"
          + (e && e.message ? e.message : e)
          + "\n\nassets/wasm/pyrovm.js and pyrovm.wasm are built by\n"
          + "tools/wasm/build.sh and have to be committed beside the site.";
        outMeta.textContent = "engine unavailable";
      }).then(function () { runBtn.disabled = false; });
    }
    // Show the program translated into the selected language. The server's
    // /api/compile returns the generated source in `code`; nothing is
    // executed, which is what the notice above the editor promises.
    function doConvert() {
      if (!online) { offlineHelp(); ping(); return; }
      var b = backend.value;
      runBtn.disabled = true;
      // Named length, because this is slow: the server shells out to the
      // Python toolchain, and a silent "converting…" for fifteen seconds
      // reads as a hang.
      outMeta.textContent = "converting… (a few seconds)";
      outBody.textContent = "";
      outBody.className = "pg-out-body";
      fetch(api() + "/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: ta.value, backend: b })
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var code = (j && j.code) || "";
          // A refusal is the useful answer here, not an empty pane: a backend
          // that does not cover some construct says so, and that message is
          // what the reader needs to see.
          if (!j || !j.success || !code.trim()) {
            var why = ((j && j.stderr) || "") + "\n" + ((j && j.stdout) || "");
            why = why.replace(/\r\n/g, "\n").trim();
            outBody.className = "pg-out-body pg-err";
            // With no diagnostic at all, the compiler did not refuse
            // anything — the server gave up on it. Its /api/compile spawns
            // several Python processes with an 8 s cap each, and the first
            // request after a cold start can exceed that. Reporting it as
            // "the backend produced nothing for this program" blames the
            // program for the server's clock, which is the wrong place to
            // send someone looking.
            outBody.textContent = why ||
              ("The server returned no " + b + " source and no error.\n\n"
               + "That is usually its own timeout rather than anything about\n"
               + "this program — the first conversion after starting the\n"
               + "server is the slow one. Press Convert again.");
            outMeta.textContent = why ? "did not compile" : "no answer";
            return;
          }
          outBody.className = "pg-out-body";
          outBody.textContent = code.replace(/\r\n/g, "\n").replace(/\s+$/, "");
          outMeta.textContent =
            "converted to " + b + " · "
            + code.replace(/\s+$/, "").split("\n").length + " lines · not run";
        })
        .catch(function () {
          online = false;
          setPill("off", "no server", "No server at " + api() + " — `pyro` still runs in the browser");
          offlineHelp();
        })
        .then(function () { runBtn.disabled = false; });
    }

    function doRun() {
      if (backend.value === "pyro" && window.PyroEngine) { runInBrowser(); return; }
      if (!isRunnable()) { doConvert(); return; }
      if (!online) { offlineHelp(); ping(); return; }
      runBtn.disabled = true;
      outMeta.textContent = "running…";
      outBody.textContent = "";
      fetch(api() + "/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: ta.value, backend: backend.value })
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          // stdout and stderr are both shown, and stderr is not
          // treated as failure on its own: a Cryo program that
          // aborts writes its message there, and that message IS
          // the result you came to see.
          var text = programOutput(j.stdout);
          if (j.stderr) text += (text ? "\n" : "")
            + j.stderr.replace(/\r\n/g, "\n").trim();
          // `success` is the TOOLCHAIN's exit code, and `cryoc --run`
          // returns 0 once it has compiled and launched — so a program that
          // aborts at run time comes back "successful" with its abort text in
          // the output. Reporting that as ok would be the most misleading
          // thing on the page, so the abort marker decides instead.
          var aborted = ABORT_MARKER.test(text);
          outBody.textContent = text || "(no output)";
          outBody.className = "pg-out-body" + (j.success && !aborted ? "" : " pg-err");
          outMeta.textContent = (aborted ? "aborted" : (j.success ? "ok" : "exit ≠ 0"))
            + (j.executionTimeMs != null ? " · " + j.executionTimeMs + " ms" : "");
        })
        .catch(function (e) {
          online = false;
          setPill("off", "no server", "No server at " + api() + " — `pyro` still runs in the browser");
          offlineHelp();
        })
        .then(function () { runBtn.disabled = false; });
    }

    runBtn.addEventListener("click", function () {
      // The in-browser engine needs no server, so it never waits on the
      // health check — that would make the one path that always works feel
      // as slow as the one that might not.
      if (backend.value === "pyro" && window.PyroEngine) { runInBrowser(); return; }
      // Still checking? Let the check finish and then run, rather than
      // answering from a state that has not settled.
      if (pinging) {
        runBtn.disabled = true;
        outMeta.textContent = "checking backend…";
        pinging.then(function () { runBtn.disabled = false; doRun(); });
        return;
      }
      doRun();
    });

    // Ctrl/Cmd+Enter runs, which is what every other code box does.
    ta.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runBtn.click();
      }
    });

    // Let a reader point the page at a backend somewhere else
    // (a container, another port) without editing any file.
    pill.addEventListener("dblclick", function () {
      var v = window.prompt("Playground backend URL", api());
      if (v) { setApi(v.replace(/\/+$/, "")); ping(); }
    });

    // Changing language changes what Run means, so the previous pane is
    // cleared: leaving program output under a "go source" heading, or Go
    // source under "Output", is the kind of stale pane a reader believes.
    backend.addEventListener("change", function () {
      outBody.textContent = "";
      outBody.className = "pg-out-body";
      outMeta.textContent = "";
      syncMode();
    });

    syncMode();
    paint();
    ping();
  }

  function scan() {
    var blocks = document.querySelectorAll("#doc .code-block");
    Array.prototype.forEach.call(blocks, function (b) {
      var lang = b.querySelector(".code-lang");
      if (lang && lang.textContent.trim() === "playground") mount(b);
    });
  }

  // The docs app re-renders #doc on every hash change, so the scan
  // has to run again each time rather than once at startup.
  document.addEventListener("cryo:page-rendered", scan);
  if (document.readyState !== "loading") scan();
  else document.addEventListener("DOMContentLoaded", scan);
})();
