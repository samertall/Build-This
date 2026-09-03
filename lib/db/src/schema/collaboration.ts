import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const projectMembersTable = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").notNull().default("reviewer"),
  status: text("status").notNull().default("invited"),
  invitedBy: text("invited_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("project_members_project_email_idx").on(table.projectId, table.email),
  index("project_members_user_id_idx").on(table.userId),
]);

export type ProjectMember = typeof projectMembersTable.$inferSelect;

export const projectCommentsTable = pgTable("project_comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  body: text("body").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("project_comments_item_idx").on(table.projectId, table.itemType, table.itemId),
]);

export type ProjectComment = typeof projectCommentsTable.$inferSelect;

export const approvalEventsTable = pgTable("approval_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  status: text("status").notNull(),
  comment: text("comment"),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("approval_events_item_idx").on(table.projectId, table.itemType, table.itemId),
  index("approval_events_project_idx").on(table.projectId, table.createdAt),
]);

export type ApprovalEvent = typeof approvalEventsTable.$inferSelect;