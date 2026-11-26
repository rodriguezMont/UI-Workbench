import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHandler } from "../server.js";

let dir: string;
let server: Server;
let port: number;

/** A raw request, so the path reaches the server exactly as written. */
function send(method: string, pathname: string) {
  return new Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }>(
    (resolve, reject) => {
      const req = request({ host: "127.0.0.1", port, method, path: pathname }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      });
      req.on("error", reject);
      req.end();
    },
  );
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "workbench-server-"));
  const root = path.join(dir, "dist");
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, "index.html"), "<!doctype html><title>index</title>");
  await writeFile(path.join(root, "assets", "app-1a2b.js"), "console.log(1)");
  await writeFile(path.join(dir, "secret.txt"), "outside the build");
  server = createServer(createHandler(root));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dir, { recursive: true, force: true });
});

describe("the production server", () => {
  it("serves index.html at the root, never cached, marked noindex", async () => {
    const res = await send("GET", "/");
    expect(res.status).toBe(200);
    expect(res.body).toContain("<title>index</title>");
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.headers["cache-control"]).toBe("no-cache");
    expect(res.headers["x-robots-tag"]).toBe("noindex, nofollow");
  });

  it("answers a client route with index.html, so a reload works", async () => {
    const res = await send("GET", "/primitives?tab=states");
    expect(res.status).toBe(200);
    expect(res.body).toContain("<title>index</title>");
  });

  it("serves a hashed asset with its type, cached for a year", async () => {
    const res = await send("GET", "/assets/app-1a2b.js");
    expect(res.status).toBe(200);
    expect(res.body).toBe("console.log(1)");
    expect(res.headers["content-type"]).toContain("text/javascript");
    expect(res.headers["cache-control"]).toContain("immutable");
  });

  it("answers a missing file with 404, not the page", async () => {
    const res = await send("GET", "/assets/missing.js");
    expect(res.status).toBe(404);
    expect(res.headers["x-robots-tag"]).toBe("noindex, nofollow");
  });

  it("never serves a file outside the build", async () => {
    for (const pathname of ["/../secret.txt", "/%2e%2e/secret.txt", "/assets/..%2f..%2fsecret.txt"]) {
      const res = await send("GET", pathname);
      expect(res.body).not.toContain("outside the build");
    }
  });

  it("answers HEAD without a body and refuses other methods", async () => {
    const head = await send("HEAD", "/");
    expect(head.status).toBe(200);
    expect(head.body).toBe("");
    const post = await send("POST", "/");
    expect(post.status).toBe(405);
    expect(post.headers.allow).toBe("GET, HEAD");
  });
});
