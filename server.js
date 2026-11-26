// @ts-check
/**
 * The production entry for the published workbench: Hostinger's managed
 * Node.js runs `node server.js` at the repository root (docs/DEPLOY.md).
 *
 * The workbench is a static build, so this only serves `dist/`:
 *
 * - a path with no file extension is a client route (`/primitives`), so it
 *   gets `index.html` and the app's router takes over — a reload on any
 *   section works;
 * - a path with an extension is a file, served if it exists, 404 if not;
 * - every response carries `X-Robots-Tag: noindex, nofollow`, like
 *   `vercel.json` does on Vercel;
 * - hashed files under `/assets/` are cached for a year, `index.html` never.
 *
 * Plain JavaScript with no dependencies on purpose: the platform publishes
 * this file, the build output and `package.json`, and runs it as is.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {Record<string, string>} */
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const HEADERS = {
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};

/**
 * The file a request path points at, or null when it would leave `root`.
 * @param {string} root
 * @param {string} pathname
 */
function resolveInside(root, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const file = path.resolve(root, `.${decoded}`);
  return file === root || file.startsWith(root + path.sep) ? file : null;
}

/**
 * @param {string} file
 * @returns {Promise<boolean>}
 */
async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

/**
 * The request handler, serving the build in `root`.
 * @param {string} root the build output folder
 * @returns {import("node:http").RequestListener}
 */
export function createHandler(root) {
  const base = path.resolve(root);
  const index = path.join(base, "index.html");

  return async (req, res) => {
    for (const [name, value] of Object.entries(HEADERS)) res.setHeader(name, value);

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }

    const { pathname } = new URL(req.url ?? "/", "http://workbench");
    const asked = resolveInside(base, pathname);
    if (!asked) {
      res.writeHead(400).end();
      return;
    }

    let file = asked;
    if (!(await isFile(file))) {
      if (path.extname(pathname)) {
        res.writeHead(404, { "Content-Type": TYPES[".txt"] }).end("Not found");
        return;
      }
      file = index;
    }

    const isIndex = file === index;
    const immutable = !isIndex && pathname.startsWith("/assets/");
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(file)
      .on("error", () => res.destroy())
      .pipe(res);
  };
}

const isEntry = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntry) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
  const port = Number(process.env.PORT) || 3000;
  const server = createServer(createHandler(root));
  server.listen(port, () => console.log(`workbench  http://localhost:${port}`));

  // Finish the requests in flight before exiting.
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.once(signal, () => {
      server.close((error) => process.exit(error ? 1 : 0));
      server.closeIdleConnections();
    });
  }
}
