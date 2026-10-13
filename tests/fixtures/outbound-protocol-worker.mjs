// Fixture child for tests/outbound-protocol.standalone.test.ts: direct requests, proxy destinations,
// HTTPS proxies and DNS-over-HTTPS must all negotiate HTTP/1.1, and routing to a checked IP must keep
// the original Host, SNI and certificate validation intact. The route arrives via TEST_OUTBOUND_ROUTE;
// the TLS pair via TEST_TLS_KEY / NODE_EXTRA_CA_CERTS. Results print as one JSON line on stdout.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createSecureServer } from "node:http2";
import net from "node:net";
import tls from "node:tls";
import { createRequire } from "node:module";
import { guardedFetch } from "@aihot/backend/lib/http-fetch";
import { createEgressProxy, createEgressResolver } from "@aihot/backend/lib/egress-proxy";
const { fetch } = createRequire(new URL("../../packages/backend/package.json", import.meta.url))("undici");
const route = process.env.TEST_OUTBOUND_ROUTE;
const options = { key: readFileSync(process.env.TEST_TLS_KEY), cert: readFileSync(process.env.NODE_EXTRA_CA_CERTS), allowHTTP1: true };
const requests = [], tunnels = [], proxyProtocols = [], sockets = new Set();
const origin = createSecureServer(options, (req, res) => {
  requests.push({ version: req.httpVersion, host: req.headers.host ?? req.headers[":authority"], sni: req.socket.servername });
  if (req.url.startsWith("/dns-query")) {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ Status: 0, Answer: [{ type: 1, data: "93.184.216.34", TTL: 60 }] }));
  } else res.end("ok");
});
const proxy = route === "secure-proxy" ? createSecureServer(options) : createServer();
function tunnel(req, socket, head) {
  tunnels.push(req.url);
  const upstream = net.connect(origin.address().port, "127.0.0.1", () => {
    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  sockets.add(upstream);
  socket.on("error", () => upstream.destroy());
  upstream.on("error", () => socket.destroy());
  socket.on("close", () => upstream.destroy());
}
proxy.on("connect", tunnel);
if (route === "secure-proxy") {
  proxy.on("secureConnection", socket => proxyProtocols.push(socket.alpnProtocol));
  proxy.on("stream", stream => { stream.respond({ ":status": 503 }); stream.end(); });
}
for (const server of [origin, proxy]) {
  server.on("connection", socket => { sockets.add(socket); socket.on("close", () => sockets.delete(socket)); });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
}
// Only the direct public IP is redirected to the local fixture. Certificate checks remain on;
// the proxy paths exercise their real CONNECT and TLS implementation without interception.
const connect = tls.connect;
tls.connect = function (options, ...rest) {
  if (options.host === "93.184.216.34") options = { ...options, host: "127.0.0.1", port: origin.address().port };
  return connect.call(this, options, ...rest);
};
const proxyUrl = (route === "secure-proxy" ? "https" : "http") + "://127.0.0.1:" + proxy.address().port;
let error = null, agent;
try {
  if (route === "direct") {
    const result = await guardedFetch("https://93.184.216.34/item", { route: "direct" });
    if (result.text() !== "ok") throw new Error("response lost");
  } else if (route === "dns") {
    await createEgressResolver(proxyUrl)("outbound.invalid");
  } else {
    agent = createEgressProxy(proxyUrl, async () => ["93.184.216.34"]);
    const response = await fetch("https://outbound.invalid/item", { dispatcher: agent, signal: AbortSignal.timeout(2000) });
    if (await response.text() !== "ok") throw new Error("response lost");
  }
} catch (failure) { error = String(failure); }
finally {
  await agent?.destroy();
  for (const socket of sockets) socket.destroy();
  await Promise.all([origin, proxy].map(server => new Promise(resolve => server.close(resolve))));
}
console.log(JSON.stringify({ requests, tunnels, proxyProtocols: [...new Set(proxyProtocols)], error }));
