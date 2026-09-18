import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { openStore } from "./store.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const store = await openStore(root);
const port = 4180;
const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
const token = randomBytes(32).toString("hex");
let mutationQueue = Promise.resolve();
const assets = new Map([["/", ["index.html", "text/html"]], ["/admin.js", ["admin.js", "text/javascript"]], ["/admin.css", ["admin.css", "text/css"]]]);
const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' https: blob:; connect-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  const json = (status, value) => { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(value)); };
  try {
    if (!hosts.has(request.headers.host)) return json(403, { error: "Localhost access only." });
    const pathname = new URL(request.url, `http://127.0.0.1:${port}`).pathname;
    if (request.method === "GET" && assets.has(pathname)) {
      const [filename, type] = assets.get(pathname);
      response.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
      response.end(await readFile(new URL(filename, import.meta.url)));
      return;
    }
    if (request.method === "GET" && pathname === "/api/state") return json(200, { ...(await store.state()), token });
    if (request.method !== "POST" || !["/api/notices", "/api/images", "/api/blogs", "/api/upload"].includes(pathname)) return json(404, { error: "Not found." });
    if (request.headers["x-admin-token"] !== token || request.headers.origin !== `http://${request.headers.host}`) return json(403, { error: "Reload the local admin page before saving." });
    if (!request.headers["content-type"]?.startsWith("application/json")) return json(415, { error: "JSON required." });
    const chunks = [];
    let length = 0;
    for await (const chunk of request) { length += chunk.length; if (length > 29 * 1024 * 1024) throw new Error("Request exceeds the upload limit."); chunks.push(chunk); }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const operation = mutationQueue.then(async () => {
      if (pathname === "/api/notices") return store.saveNotice(value);
      if (pathname === "/api/images") return store.saveImages(value);
      if (pathname === "/api/blogs") return store.saveBlog(value);
      return store.upload(value);
    });
    mutationQueue = operation.catch(() => {});
    const result = await operation;
    return json(200, { saved: true, image: result });
  } catch (error) { return json(400, { error: error.message || "Could not save." }); }
});
server.on("error", (error) => { console.error(error.code === "EADDRINUSE" ? "Port 4180 is already in use. Stop the existing admin server yourself before trying again." : error.message); store.close(); process.exitCode = 1; });
server.listen(port, "127.0.0.1", () => console.log(`Local Parks admin: http://127.0.0.1:${port}\nEdits save to project files. Deploy through your normal Git/Vercel workflow. Press Ctrl+C to stop.`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => { store.close(); process.exit(0); }));
