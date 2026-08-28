import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import process from "node:process";
const root = resolve(process.cwd(), process.argv[2] ?? "."); const port = Number(process.env.PORT ?? 4173);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
createServer(async (request, response) => {
  try { const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname); const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, ""); let path = normalize(join(root, relative)); if (!path.startsWith(root)) throw new Error("Invalid path"); const info = await stat(path); if (info.isDirectory()) path = join(path, "index.html"); response.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream", "Cache-Control": "no-store" }); createReadStream(path).pipe(response); }
  catch { response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Not found"); }
}).listen(port, () => console.log(`SF Parks Explorer running at http://localhost:${port}`));
