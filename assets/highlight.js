/* ============================================================
   Realçador de sintaxe leve, sem dependências.
   Suporta: cryo, bash, go, c, json, text.
   Estratégia: tokeniza o código bruto; cada token tem seu texto
   escapado para HTML e envolvido numa <span> com a classe do tipo.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var CRYO_KW = new Set([
    "fn", "return", "import", "library", "if", "else", "for", "while",
    "null", "struct", "enum", "const", "new", "try", "catch", "finally",
    "break", "continue", "switch", "case", "default", "assert", "safe",
    "unsafe", "do", "in", "map", "as", "skill", "spawn", "await", "future",
    "schema", "tool", "true", "false"
  ]);
  var CRYO_TYPE = new Set(["int", "number", "string", "bool", "void", "Skill", "Tool"]);
  var CRYO_BUILTIN = new Set([
    "print", "input", "len", "assert", "sqrt", "pow", "abs", "min", "max",
    "floor", "ceil", "round", "to_string", "to_int", "to_number",
    "json_encode", "json_decode", "has", "keys", "remove", "sleep",
    "http_get", "http_post", "schema_of", "llm", "tools", "tools_json",
    "tool_get", "agent", "skills", "skill_get", "skill_has", "skills_json",
    "throw", "push",
    "pyro_exec", "pyro_env", "pyro_args", "pyro_time", "pyro_read",
    "pyro_write", "pyro_write_file", "pyro_open", "pyro_exit"
  ]);

  var GO_KW = new Set(["package","import","func","var","const","type","struct","interface","map","chan","go","defer","return","if","else","for","range","switch","case","default","break","continue","select","fallthrough","goto","nil","true","false"]);
  var C_KW = new Set(["int","char","void","long","short","unsigned","signed","float","double","struct","union","enum","typedef","const","static","extern","return","if","else","for","while","do","switch","case","default","break","continue","sizeof","goto"]);

  // Tokenizador genérico para linguagens estilo C.
  function cLike(code, opts) {
    var kw = opts.kw, types = opts.types || new Set(), builtins = opts.builtins || new Set();
    var out = "", i = 0, n = code.length;
    var lineComment = opts.lineComment !== false;   // "//"
    while (i < n) {
      var c = code[i];
      // comentário de linha
      if (lineComment && c === "/" && code[i + 1] === "/") {
        var j = code.indexOf("\n", i); if (j < 0) j = n;
        out += span("comment", code.slice(i, j)); i = j; continue;
      }
      // comentário de bloco
      if (c === "/" && code[i + 1] === "*") {
        var k = code.indexOf("*/", i + 2); k = k < 0 ? n : k + 2;
        out += span("comment", code.slice(i, k)); i = k; continue;
      }
      // strings " ' `
      if (c === '"' || c === "'" || c === "`") {
        var q = c, s = c; i++;
        while (i < n) {
          if (code[i] === "\\" && q !== "`") { s += code[i] + (code[i + 1] || ""); i += 2; continue; }
          s += code[i];
          if (code[i] === q) { i++; break; }
          i++;
        }
        out += span("string", s); continue;
      }
      // número
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(code[i + 1] || ""))) {
        var m = /^(0[xXbBoO][0-9a-fA-F_]+|[0-9][0-9_]*\.?[0-9_]*([eE][+-]?[0-9]+)?)/.exec(code.slice(i));
        var t = m ? m[0] : c;
        out += span("number", t); i += t.length; continue;
      }
      // identificador / palavra-chave
      if (/[A-Za-z_]/.test(c)) {
        var mm = /^[A-Za-z_][A-Za-z0-9_]*/.exec(code.slice(i));
        var w = mm[0]; i += w.length;
        // olha à frente para "(" => função
        var rest = code.slice(i);
        var isCall = /^\s*\(/.test(rest);
        var cls;
        if (kw.has(w)) cls = "keyword";
        else if (types.has(w) || (/^[A-Z]/.test(w) && !isCall)) cls = "type";
        else if (builtins.has(w)) cls = "builtin";
        else if (isCall) cls = "func";
        else cls = null;
        out += cls ? span(cls, w) : esc(w);
        continue;
      }
      // operadores
      if (/[-+*/%=<>!&|^~?:]/.test(c)) {
        var mo = /^[-+*/%=<>!&|^~?:]+/.exec(code.slice(i));
        out += span("op", mo[0]); i += mo[0].length; continue;
      }
      // pontuação
      if (/[{}()\[\];,.]/.test(c)) { out += span("punct", c); i++; continue; }
      out += esc(c); i++;
    }
    return out;
  }

  function span(cls, text) { return '<span class="tok-' + cls + '">' + esc(text) + "</span>"; }

  function bash(code) {
    var lines = code.split("\n");
    return lines.map(function (ln) {
      // comentário
      var ci = ln.indexOf("#");
      var codePart = ci >= 0 ? ln.slice(0, ci) : ln;
      var comPart = ci >= 0 ? ln.slice(ci) : "";
      // realça strings e variáveis / flags no codePart
      var h = "";
      var re = /("[^"]*"|'[^']*'|\$[A-Za-z_][A-Za-z0-9_]*|\s-{1,2}[A-Za-z][\w-]*|^[A-Za-z_][A-Za-z0-9_]*(?==))/g;
      var last = 0, m;
      while ((m = re.exec(codePart)) !== null) {
        h += esc(codePart.slice(last, m.index));
        var tk = m[0];
        if (tk[0] === '"' || tk[0] === "'") h += span("string", tk);
        else if (tk.trim()[0] === "$") h += esc(tk.replace(tk.trim(), "")) + span("meta", tk.trim());
        else if (tk.trim()[0] === "-") h += esc(tk.slice(0, tk.length - tk.trim().length)) + span("builtin", tk.trim());
        else h += span("type", tk);
        last = m.index + tk.length;
      }
      h += esc(codePart.slice(last));
      return h + (comPart ? span("comment", comPart) : "");
    }).join("\n");
  }

  function json(code) {
    var out = "", i = 0, n = code.length;
    while (i < n) {
      var c = code[i];
      if (c === '"') {
        var s = '"'; i++;
        while (i < n) { if (code[i] === "\\") { s += code[i] + (code[i + 1] || ""); i += 2; continue; } s += code[i]; if (code[i] === '"') { i++; break; } i++; }
        // chave se seguida de :
        var isKey = /^\s*:/.test(code.slice(i));
        out += span(isKey ? "func" : "string", s); continue;
      }
      if (/[0-9-]/.test(c)) { var m = /^-?[0-9.eE+]+/.exec(code.slice(i)); out += span("number", m[0]); i += m[0].length; continue; }
      if (/[a-z]/.test(c)) { var mm = /^[a-z]+/.exec(code.slice(i)); var w = mm[0]; out += (w === "true" || w === "false" || w === "null") ? span("keyword", w) : esc(w); i += w.length; continue; }
      if (/[{}\[\]:,]/.test(c)) { out += span("punct", c); i++; continue; }
      out += esc(c); i++;
    }
    return out;
  }

  window.Highlight = function (code, lang) {
    try {
      switch ((lang || "").toLowerCase()) {
        case "cryo": return cLike(code, { kw: CRYO_KW, types: CRYO_TYPE, builtins: CRYO_BUILTIN });
        case "go": return cLike(code, { kw: GO_KW, builtins: new Set(["println","printf","print","len","make","append","panic","recover"]) });
        case "c": return cLike(code, { kw: C_KW, builtins: new Set(["printf","malloc","free","memcpy","sizeof"]) });
        case "bash": case "sh": case "shell": return bash(code);
        case "json": return json(code);
        default: return esc(code);
      }
    } catch (e) { return esc(code); }
  };
})();
