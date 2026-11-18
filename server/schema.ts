import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const visits = sqliteTable("visits", {
  visitId: text("visit_id").primaryKey(),
  leadId: text("lead_id").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  project: text("project").notNull(),
  config: text("config").notNull(),
  visitAt: text("visit_at").notNull(),
  executive: text("executive").notNull(),
  outcome: text("outcome").notNull().default(""),
  nextAction: text("next_action").notNull().default(""),
});
