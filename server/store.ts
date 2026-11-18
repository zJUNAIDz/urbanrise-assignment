import fs from "node:fs";
import path from "node:path";
import { count, eq, sql } from "drizzle-orm";
import { closeDatabase, getDatabase, getDatabasePath } from "./database";
import { visits } from "./schema";

export type Visit = {
  visit_id: string;
  lead_id: string;
  customer_name: string;
  phone: string;
  project: string;
  config: string;
  visit_at: string;
  executive: string;
  outcome: string;
  next_action: string;
};

const dataDir = path.join(import.meta.dir, "data");
const csvPath = path.join(dataDir, "visits.csv");

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      fields.push(value);
      value = "";
    } else value += char;
  }
  fields.push(value);
  return fields;
}

function loadInitialData(): Visit[] {
  const lines = fs
    .readFileSync(csvPath, "utf8")
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  const headers = parseCsvLine(lines.shift() ?? "");
  return lines.map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
    return {
      visit_id: row.visit_id,
      lead_id: row.lead_id,
      customer_name: row.customer_name,
      phone: row.phone,
      project: row.project,
      config: row.config,
      visit_at: row.visit_at,
      executive: row.executive,
      outcome: row.outcome || "",
      next_action: row.next_action || "",
    };
  });
}

function ensureStore(): void {
  const db = getDatabase();
  db.run(sql`
    CREATE TABLE IF NOT EXISTS visits (
      visit_id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      project TEXT NOT NULL,
      config TEXT NOT NULL,
      visit_at TEXT NOT NULL,
      executive TEXT NOT NULL,
      outcome TEXT NOT NULL DEFAULT '',
      next_action TEXT NOT NULL DEFAULT ''
    )
  `);

  const [{ value }] = db.select({ value: count() }).from(visits).all();
  if (value === 0) {
    db.insert(visits)
      .values(
        loadInitialData().map((visit) => ({
          visitId: visit.visit_id,
          leadId: visit.lead_id,
          customerName: visit.customer_name,
          phone: visit.phone,
          project: visit.project,
          config: visit.config,
          visitAt: visit.visit_at,
          executive: visit.executive,
          outcome: visit.outcome,
          nextAction: visit.next_action,
        })),
      )
      .run();
  }
}

export function readVisits(): Visit[] {
  ensureStore();
  return getDatabase()
    .select()
    .from(visits)
    .all()
    .map((visit) => ({
      visit_id: visit.visitId,
      lead_id: visit.leadId,
      customer_name: visit.customerName,
      phone: visit.phone,
      project: visit.project,
      config: visit.config,
      visit_at: visit.visitAt,
      executive: visit.executive,
      outcome: visit.outcome,
      next_action: visit.nextAction,
    }));
}

export function writeVisits(visitsToWrite: Visit[]): void {
  ensureStore();
  const db = getDatabase();
  db.transaction((tx) => {
    for (const visit of visitsToWrite) {
      tx.update(visits)
        .set({ outcome: visit.outcome, nextAction: visit.next_action })
        .where(eq(visits.visitId, visit.visit_id))
        .run();
    }
  });
}

export function resetStoreForTests(): void {
  closeDatabase();
  const databasePath = getDatabasePath();
  if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
}
