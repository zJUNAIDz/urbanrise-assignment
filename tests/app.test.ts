import { afterAll, beforeEach, expect, test } from "bun:test";
import { app, maskPhone } from "../server/app";
import { readVisits, resetStoreForTests } from "../server/store";

let baseUrl: string;
let server: ReturnType<typeof Bun.serve>;

beforeEach(() => {
  resetStoreForTests();
  server?.stop();
  server = Bun.serve({ port: 0, fetch: app.fetch });
  baseUrl = `http://127.0.0.1:${server.port}`;
});

test("lists one executive/date in time order and masks phone numbers", async () => {
  const response = await fetch(`${baseUrl}/api/visits?executive=EX-02%20Farhan&date=2026-10-06`);
  const data = await response.json() as { count: number; visits: Array<{ visit_id: string; phone: string }> };
  expect(response.status).toBe(200);
  expect(data.count).toBe(4);
  expect(data.visits[0].visit_id).toBe("V-3017");
  expect(data.visits[0].phone).toBe("••••••9667");
  expect(data.visits[0].phone.includes("983760")).toBe(false);
});

test("rejects a malformed date with HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/visits?executive=EX-02%20Farhan&date=06-10-2026`);
  expect(response.status).toBe(400);
  expect((await response.json()).error).toMatch(/YYYY-MM-DD/);
});

test("rejects a nonexistent calendar date with HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/visits?executive=EX-02%20Farhan&date=2026-02-31`);
  expect(response.status).toBe(400);
  expect((await response.json()).error).toMatch(/YYYY-MM-DD/);
});

test("rejects a non-object update body with HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/visits/V-3002`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: "null",
  });
  expect(response.status).toBe(400);
  expect((await response.json()).error).toMatch(/JSON object/);
});

test("records an outcome and next action persistently", async () => {
  const response = await fetch(`${baseUrl}/api/visits/V-3002`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outcome: "Interested", next_action: "Call tomorrow with the price sheet" }),
  });
  const data = await response.json() as { visit: { outcome: string; phone: string } };
  expect(response.status).toBe(200);
  expect(data.visit.outcome).toBe("Interested");
  expect(data.visit.phone).toBe("••••••8739");
  expect(readVisits().find((visit) => visit.visit_id === "V-3002")?.next_action).toBe("Call tomorrow with the price sheet");
});

test("rejects outcomes outside the allowed set", async () => {
  const response = await fetch(`${baseUrl}/api/visits/V-3002`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outcome: "Maybe", next_action: "Call" }),
  });
  expect(response.status).toBe(400);
  expect((await response.json()).error).toBe("Invalid visit update.");
});

test("returns HTTP 404 for an unknown visit", async () => {
  const response = await fetch(`${baseUrl}/api/visits/V-9999`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outcome: "No show", next_action: "" }),
  });
  expect(response.status).toBe(404);
  expect((await response.json()).error).toMatch(/V-9999/);
});

test("masks phone numbers consistently", () => expect(maskPhone("+91 98765 43210")).toBe("••••••3210"));

afterAll(() => {
  server?.stop();
  resetStoreForTests();
});
