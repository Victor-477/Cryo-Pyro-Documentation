---
title: "Integrity & Signing"
group: "Pyro — Bytecode & VM"
lead: "Optional HMAC-SHA256 signing of a `.pyro`, verified on load — and reproducible builds, so the same source always gives the same bytes."
---
## Reproducible builds

The same source compiled twice gives a **byte-identical** `.pyro`, including with embedded assets and declared permissions, and independent of the directory you compile in. Nothing records a path or a timestamp; asset names and permissions are sorted.

This is not a new feature — the container was built this way from the start, because the [bootstrap fixed point](#/selfhost) depends on it. It is now covered by tests, which is worth doing precisely because every way of losing it is *accidental* (a set where a list was meant, a dict iterated unsorted) and none of them fail loudly. They just make two machines disagree later.

## Signing

```bash
# build
cryoc app.cryo --backend pyro -o app.pyro --sign env:PYRO_KEY

# run, verifying
PYRO_KEY=... pyrovm app.pyro
```

A signed container sets **flag bit 5** and ends with a **32-byte HMAC-SHA256** over every byte before it: magic, flags, constants, functions, code, the debug section, the embedded assets and the declared permissions.

### Why the signature is written last

[Declared permissions](#/seguranca) live *inside* the container and the VM enforces them. That makes the permissions section the first thing worth editing on a `.pyro` you did not build — widening `net` costs one byte and produces no error. Anything left outside the signed range would be exactly the part an attacker edits, so the signature covers all of it, including the flags byte that says a signature is present.

### Verification is opt-in, on the verifier's side

| | |
|---|---|
| No key configured | a signed `.pyro` runs **without checking** |
| Key configured, signature matches | runs |
| Key configured, signature does not match | **refused** |
| Key configured, body modified | **refused** |
| Key configured, file **unsigned** | **refused** |

Most people running a `.pyro` have no key, and refusing would make signing unusable — so without one the VM simply runs it.

That last row is what makes the rest worth anything. If unsigned files were accepted while a key is configured, nobody would need to forge a signature: they would delete 32 bytes, clear a flag bit, and be done.

### Supplying the key

| Form | |
|---|---|
| `--sign env:NAME` | read the key from the environment (preferred) |
| `--sign path/to/key` | read it from a file |
| `PYRO_KEY=...` | the verifying side |
| `PYRO_KEY_FILE=...` | the verifying side, from a file |
| `--key=...` | the verifying side, on the command line |

A key is **never accepted literally on the compiler's command line**. `argv` is readable by every process on the machine and lands in shell history, so offering `--sign <secret>` would make the convenient way the unsafe one.

Keys are trimmed on both sides, so an editor's trailing newline cannot make signing and verifying disagree about "the same" key. A key under 16 bytes is refused — not a policy about entropy, a guard against pointing `--sign` at the wrong file.

## What this is not

**It is a shared secret, not a public-key signature.** Anyone who can verify can also sign.

It answers *"did this file arrive as it was built, by someone holding our key"* — the distribution and tampering question. It does **not** let you publish a key so that strangers can verify your builds. That needs asymmetric signing, and the section layout leaves room for it.

The reason is dependencies: HMAC-SHA256 is in both standard libraries involved (Python's `hmac`, Go's `crypto/hmac`). Ed25519 is in Go's and not in Python's, and this project ships no crypto dependency — hand-rolling one would be a much worse trade than saying plainly what the current scheme does and does not give you.

**The C VM does not verify.** It ignores the trailing section and runs the program, which is the same behaviour as the Go VM with no key configured. Verify with the Go VM.

## Signing and reproducibility together

The signature is a pure function of the body and the key, so the same source and key give a byte-identical file, and two different keys give the same body with a different trailing 32 bytes.
