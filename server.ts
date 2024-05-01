import { Hono } from "hono";
import { logger } from "hono/logger";
import { toLatex } from "./formula.ts";

const app = new Hono();

app.use(logger());

app.get("/api/hello", (c) => {
  return c.json({ message: "Hello, World!" });
});

app.post("/api/formula", async (c) => {
  const json = (await c.req.json()) as { formula: string };
  const latex = await toLatex(json.formula);
  return c.json({ latex });
});

const server = Bun.serve({
  port: process.env.PORT || 3333,
  hostname: "0.0.0.0",
  fetch: app.fetch,
});

console.log(`server running: http://localhost:${server.port}`);
