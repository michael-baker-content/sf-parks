# Optional park notices

Park pages can display an amber notice between About this place and Location.
Notices are separate from evergreen descriptions and inactive unless a record
in `data/content/park-alerts.json` explicitly sets `active` to `true`.

Each record uses `destinationId`, `active`, `title`, and `body`, plus optional
`expiresOn` (YYYY-MM-DD, valid through that day in San Francisco) and `url`
(an HTTP/HTTPS more-information link, typically to the official parks site),
with optional `urlText` for its display text. More Information is hidden without
a URL; blank display text falls back to the URL. Set `active` to
`false` to hide it; add an active record to enable a notice for another park.
Lafayette Park has a clearly labeled test notice with placeholder text, not a
real closure announcement. Sue Bierman Park also has an owner-added renovation
notice with an official source link and an expiration date.

Notice changes require a rebuild and deployment. The component is a labeled
section with a heading and warning symbol; color is not its only indicator.
The page navigation includes Park notice only when the notice is active.

Before publishing real operational notices, establish official source
verification, review dates, and an expiration/recheck procedure. This initial
editor supports automatic expiry but does not supply a live status feed.
Use the [local editor](local-editor.md) to manage these fields.
