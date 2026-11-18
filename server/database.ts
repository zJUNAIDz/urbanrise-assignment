import fs from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

const dataDir = path.join(import.meta.dir, "data");
const databasePath =
  process.env.URBANRISE_DB_PATH || path.join(dataDir, "visits.sqlite");

let sqlite: Database | undefined;
let database: BunSQLiteDatabase | undefined;

export function getDatabase(): BunSQLiteDatabase {
  if (!database) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    sqlite = new Database(databasePath);
    sqlite.exec("PRAGMA foreign_keys = ON;");
    database = drizzle(sqlite);
  }
  return database;
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
  }
  sqlite = undefined;
  database = undefined;
}

export function getDatabasePath(): string {
  return databasePath;
}
