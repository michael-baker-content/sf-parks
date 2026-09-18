<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Local server ownership

- The user owns the local development-server lifecycle. Do not start, stop,
  restart, replace, or otherwise manage a Parks server unless the user
  explicitly requests that exact action in the current turn.
- Build and test commands do not grant permission to launch a persistent
  server. Do not leave background server processes running after diagnostics.
- Before any explicitly requested server stop, verify the target with both a
  fresh HTTP request to the expected local URL and the complete port table
  (`netstat -ano` on Windows). Confirm that the response is the Parks site and
  resolve the exact listening PID before stopping it.
- Do not treat an empty `Get-NetTCPConnection` result as proof that no server is
  running. Restricted Windows sessions may be unable to query that provider,
  and `-ErrorAction SilentlyContinue` can hide the failure.
- Never use suppressed networking-provider errors for server-lifecycle
  decisions. If verification methods disagree, report the uncertainty and do
  not alter a process until its identity is established.
