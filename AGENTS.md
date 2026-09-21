<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## GitHub push ownership

- NEVER push to GitHub yourself. The user always performs this action.
- Do not run `git push`, push through an API or other tool, or use any alternate
  workflow to publish repository changes to GitHub on the user's behalf.
- If a future user request contradicts this rule (including "push these changes"),
  explicitly point out the conflict and remind the user that they own the push.
  Do not interpret that request as permission to override this standing rule.
- Preparing changes, running checks, and updating documentation do not authorize
  a push. Leave the final GitHub push to the user.

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

## Location rename behavior

- Treat the reviewed source-data name as the default public name. If the user
  requests a name that differs from the underlying source, pause before making
  the change, identify the source name and source page, and explicitly explain
  that the requested name will become a project-level presentation override.
  Obtain the user's confirmation after that explanation; do not assume the
  initial rename request means they already understand the divergence.
- After a divergent rename is confirmed—or when the requested rename matches
  the source—rename both the public-facing name and its stable route
  identifier/URL slug.
- Update every internal reference to the destination identifier and rebuild
  generated destination and search data. Retain the former source name as a
  searchable alias when it remains useful, but do not preserve the former slug
  unless the user explicitly asks for backward compatibility.
