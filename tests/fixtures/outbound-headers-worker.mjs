// Fixture child for tests/outbound-headers.standalone.test.ts: larger response-header allowances must
// stay confined to one host, also through a proxy, and never follow a redirect elsewhere. The route
// under test arrives via TEST_HEADER_ROUTE; results print as one JSON line on stdout.
// Runs with --experimental-test-module-mocks (node:test module mocking).
import { createServer } from "node:http";
import net from "node:net";
import { mock } from "node:test";
import { DEPLOYMENT } from "@aihot/site";
import { config } from "@aihot/backend/config";
import * as egress from "@aihot/backend/lib/egress-proxy";
mock.module("@aihot/backend/lib/egress-proxy", { namedExports: {
  ...egress, createEgressResolver: () => async () => ["93.184.216.34"],
} });
const { guardedFetch } = await import("@aihot/backend/lib/http-fetch");
const route = process.env.TEST_HEADER_ROUTE;
const sockets = new Set(), requests = [];
const origin = createServer((req, res) => {
  requests.push(req.url);
  if (req.url === "/other") {
    res.writeHead(302, { location: route === "proxy" ? "http://other.invalid/large" : "http://93.184.216.35/large" });
  } else if (req.url === "/private") {
    res.writeHead(302, { location: "http://127.0.0.1/private-dest" });
  } else res.setHeader("content-security-policy", "x".repeat(req.url === "/oversize" ? 40 * 1024 : 18 * 1024));
  res.end("ok");
});
const proxy = createServer();
proxy.on("connect", (req, socket, head) => {
  const upstream = net.connect(origin.address().port, "127.0.0.1", () => {
    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    upstream.write(head); socket.pipe(upstream).pipe(socket);
  });
  sockets.add(upstream);
  socket.on("error", () => upstream.destroy()); upstream.on("error", () => socket.destroy());
  socket.on("close", () => upstream.destroy());
});
for (const server of [origin, proxy]) {
  server.on("connection", socket => { sockets.add(socket); socket.on("close", () => sockets.delete(socket)); });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
}
const connect = net.connect;
net.connect = function (options, ...rest) {
  if (["93.184.216.34", "93.184.216.35"].includes(options?.host)) options = { ...options, host: "127.0.0.1", port: origin.address().port };
  return connect.call(this, options, ...rest);
};
config.allowPrivateNetworkFetch = false;
config.egressProxyUrl = route === "proxy" ? "http://127.0.0.1:" + proxy.address().port : null;
DEPLOYMENT.responseHeaderLimits = { "93.184.216.34": 32 * 1024, "headers.invalid": 32 * 1024 };
const configured = route === "proxy" ? "http://headers.invalid" : "http://93.184.216.34";
const ordinary = route === "proxy" ? "http://other.invalid" : "http://93.184.216.35";
const results = {};
try {
  for (const [key, url] of [["configured", configured + "/large"], ["ordinary", ordinary + "/large"],
    ["oversize", configured + "/oversize"], ["redirect", configured + "/other"], ["private", configured + "/private"]]) {
    try { results[key] = { text: (await guardedFetch(url, { timeoutMs: 2000 })).text() }; }
    catch (e) { results[key] = { error: e.message, cause: e.cause?.code }; }
  }
} finally {
  for (const socket of sockets) socket.destroy();
  await Promise.all([origin, proxy].map(server => new Promise(resolve => server.close(resolve))));
}
console.log(JSON.stringify({ results, requests })); process.exit(0);
