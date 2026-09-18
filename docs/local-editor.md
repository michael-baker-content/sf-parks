# Local content editor

Run `npm run admin` with Node.js 24 (minimum 22.13), then open
http://127.0.0.1:4180. Stop it yourself with Ctrl+C. It runs independently of
the website's development server; agents must not start or stop either server
without your explicit request.

The editor is intentionally local-only: it binds to loopback, checks the host
and origin, and requires a per-session save token. It has no public Next.js
routes and is not deployed. Do not expose it with a tunnel or proxy. There is
no account/login system.

## Editable content

- Notices: active switch, title, body, optional more-information URL (usually
  the official parks website), optional URL display text, and optional expiration date. The
  notice's More Information section appears only when a URL is provided; blank
  display text falls back to the URL. Links open in the
  same tab and accept HTTP/HTTPS addresses without embedded credentials. A date
  remains valid through the end of that day in San Francisco. Public notices
  check expiration on page load and every minute, even on the static site.
- All cataloged photographs, including original and second-party images:
  captions, alt text, creator/attribution, visibility, and gallery order.
  Existing external licenses are read-only; contributor licenses are editable.
- Blog posts: one Markdown file per post, including existing cover/gallery
  frontmatter. Full schema validation happens during the production build.

Official inventory, evergreen context, coordinates, sources, and nearby
transit are read-only. The Lafayette placeholder notice remains the test case;
do not mistake its text for an actual closure.

## Saving and publishing

Save buttons immediately update the existing project JSON/Markdown files.
Those files remain the deployment source of truth. Restarting the editor
imports the current files into its SQLite catalog. `.local-admin/` stores the
database, edit history, and a backup of each replaced file; it is ignored by
Git. Backups can be restored manually after stopping the editor.

Changes do **not** edit the live site. Review changes, run tests and the
production build, then commit/push and deploy normally. Expired notice anchors
may remain in older static builds until the next deployment, but the notice
body is hidden. Hide/reorder operations never delete Blob files. Hidden park
photographs are also excluded from blog galleries and featured cards; a hidden
blog cover uses the default illustration.

The local editor is the sole photo metadata review workflow. The former CSV
and its scripts have been retired. All 40 CSV entries matched the current
manifest and Blob registry, with no pending replacement captions or alt text.
New uploads appear directly in the editor.

## Uploading

Put `BLOB_READ_WRITE_TOKEN` in your ignored `.env.local`. It is used only by
the local server and is never sent to the browser. JPEG, PNG, and WebP files
are accepted up to 20 MB / 50 million pixels. Uploads default to Michael Baker,
“Photo by Michael Baker,” and CC BY 4.0; change the credit/license when needed
and confirm you have publishing permission.

Uploads preserve the complete oriented image (no crop), strip embedded
metadata, and create responsive WebP variants up to 1280 pixels wide. Keep
your original photographs elsewhere: this tool does not archive originals.
Successful uploads immediately become public Blob objects, and append to the
media manifest and Blob registry. They appear on the live website only
after deployment. Interrupted uploads can leave unreferenced Blob objects;
the tool deliberately does not delete them automatically.

Save the current form before switching parks or editor sections. Only one
editor instance should be used at a time; simultaneous external file edits
are not merged. There is no automatic Git commit or deployment.
