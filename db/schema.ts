import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const prompts = sqliteTable("prompts", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  kind: text("kind").notNull(),
  authorId: text("author_id").notNull(),
  created: integer("created").notNull(),
});

export const promptVotes = sqliteTable("prompt_votes", {
  promptId: text("prompt_id").notNull(),
  clientId: text("client_id").notNull(),
  vote: text("vote").notNull(),
}, (table) => [primaryKey({ columns: [table.promptId, table.clientId] })]);

export const rateLimits = sqliteTable("rate_limits", {
  scope: text("scope").primaryKey(),
  bucket: integer("bucket").notNull(),
  hits: integer("hits").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const promptReports = sqliteTable("prompt_reports", {
  promptId: text("prompt_id").notNull(),
  clientId: text("client_id").notNull(),
  reason: text("reason").notNull(),
  created: integer("created").notNull(),
}, (table) => [primaryKey({ columns: [table.promptId, table.clientId] })]);
