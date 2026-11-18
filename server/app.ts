import { Hono } from "hono";
import { readVisits, writeVisits, type Visit } from "./store";

export const OUTCOMES = [
  "Interested",
  "Needs time",
  "Not interested",
  "No show",
] as const;

type Outcome = (typeof OUTCOMES)[number];
type VisitUpdate = { outcome: Outcome; next_action?: string };

export function maskPhone(phone: string | null | undefined): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return `••••••${digits.slice(-4)}`;
}

function publicVisit(visit: Visit) {
  return { ...visit, phone: maskPhone(visit.phone) };
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export const app = new Hono();

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/visits", (c) => {
  const executive = (c.req.query("executive") ?? "").trim();
  const date = c.req.query("date") ?? "";
  if (!executive || !isValidDate(date)) {
    return c.json(
      { error: "Provide an executive and a valid date in YYYY-MM-DD format." },
      400,
    );
  }

  const visits = readVisits()
    .filter(
      (visit) =>
        visit.executive === executive && visit.visit_at.slice(0, 10) === date,
    )
    .sort((a, b) => a.visit_at.localeCompare(b.visit_at))
    .map(publicVisit);
  return c.json({ executive, date, count: visits.length, visits });
});

app.patch("/api/visits/:visitId", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: "Request body must be valid JSON." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return c.json({ error: "Request body must be a JSON object." }, 400);
  }

  const allowedKeys = new Set(["outcome", "next_action"]);
  const unknownKeys = Object.keys(body).filter((key) => !allowedKeys.has(key));
  const nextAction = body.next_action;
  if (
    unknownKeys.length ||
    typeof body.outcome !== "string" ||
    !OUTCOMES.includes(body.outcome as Outcome) ||
    (nextAction !== undefined && typeof nextAction !== "string") ||
    (typeof nextAction === "string" && nextAction.trim().length > 240)
  ) {
    return c.json(
      {
        error: "Invalid visit update.",
        details:
          "Provide an allowed outcome and a next action of at most 240 characters.",
      },
      400,
    );
  }

  const visits = readVisits();
  const index = visits.findIndex(
    (visit) => visit.visit_id === c.req.param("visitId"),
  );
  if (index === -1)
    return c.json(
      { error: `Visit '${c.req.param("visitId")}' was not found.` },
      404,
    );

  visits[index] = {
    ...visits[index],
    outcome: body.outcome as Outcome,
    next_action: typeof nextAction === "string" ? nextAction.trim() : "",
  };
  writeVisits(visits);
  return c.json({
    message: "Visit outcome saved.",
    visit: publicVisit(visits[index]),
  });
});
