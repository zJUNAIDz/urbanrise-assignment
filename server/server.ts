import { serveStatic } from "@hono/bun";
import { app } from "./app";

app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

const port = Number(process.env.PORT || 3003);
const server = Bun.serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
console.log(
  `Urbanrise Site Visits is running at http://localhost:${server.port}`,
);
