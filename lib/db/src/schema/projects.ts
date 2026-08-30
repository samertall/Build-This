import { index, pgTable, serial, text, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id"),
  name: text("name").notNull(),
  description: text("description"),
  productType: text("product_type"),
  industry: text("industry"),
  stage: text("stage"),
  businessGoals: text("business_goals"),
  targetUsers: text("target_users"),
  status: text("status").notNull().default("active"),
  analysisStatus: text("analysis_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("projects_owner_id_idx").on(table.ownerId),
]);

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;

export const projectSourcesTable = pgTable("project_sources", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'url', 'text', 'note'
  name: text("name").notNull(),
  content: text("content"),
  url: text("url"),
  classification: text("classification"),
  processingStatus: text("processing_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSourceSchema = createInsertSchema(projectSourcesTable).omit({ id: true, createdAt: true });
export type InsertProjectSource = z.infer<typeof insertProjectSourceSchema>;
export type ProjectSource = typeof projectSourcesTable.$inferSelect;

export const researchInsightsTable = pgTable("research_insights", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull().default("research"),
  cluster: text("cluster"),
  insight: text("insight").notNull(),
  evidence: text("evidence"),
  confidence: text("confidence"),
  tags: text("tags"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResearchInsightSchema = createInsertSchema(researchInsightsTable).omit({ id: true, createdAt: true });
export type InsertResearchInsight = z.infer<typeof insertResearchInsightSchema>;
export type ResearchInsight = typeof researchInsightsTable.$inferSelect;

export const problemStatementsTable = pgTable("problem_statements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  statement: text("statement").notNull(),
  howMightWe: text("how_might_we"),
  rootCause: text("root_cause"),
  businessImpact: text("business_impact"),
  userSegment: text("user_segment"),
  successMetric: text("success_metric"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProblemStatementSchema = createInsertSchema(problemStatementsTable).omit({ id: true, createdAt: true });
export type InsertProblemStatement = z.infer<typeof insertProblemStatementSchema>;
export type ProblemStatement = typeof problemStatementsTable.$inferSelect;

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  userProblem: text("user_problem"),
  businessGoal: text("business_goal"),
  evidence: text("evidence"),
  expectedImpact: text("expected_impact"),
  effort: text("effort"),
  risk: text("risk"),
  confidence: text("confidence"),
  priority: text("priority"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecommendationSchema = createInsertSchema(recommendationsTable).omit({ id: true, createdAt: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;

export const userJourneysTable = pgTable("user_journeys", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  persona: text("persona"),
  scenario: text("scenario"),
  journeyType: text("journey_type").notNull().default("current"),
  stages: jsonb("stages").notNull().default("[]"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserJourneySchema = createInsertSchema(userJourneysTable).omit({ id: true, createdAt: true });
export type InsertUserJourney = z.infer<typeof insertUserJourneySchema>;
export type UserJourney = typeof userJourneysTable.$inferSelect;

export const featuresTable = pgTable("features", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  reach: integer("reach"),
  impact: integer("impact"),
  confidence: integer("confidence"),
  effort: integer("effort"),
  riceScore: real("rice_score"),
  moscowPriority: text("moscow_priority"),
  phase: text("phase"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFeatureSchema = createInsertSchema(featuresTable).omit({ id: true, createdAt: true });
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof featuresTable.$inferSelect;

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  userStory: text("user_story"),
  acceptanceCriteria: text("acceptance_criteria"),
  priority: text("priority"),
  effort: text("effort"),
  status: text("status").notNull().default("todo"),
  owner: text("owner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

export const presentationsTable = pgTable("presentations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  presentationType: text("presentation_type"),
  audience: text("audience"),
  slideCount: integer("slide_count"),
  slides: jsonb("slides").notNull().default("[]"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPresentationSchema = createInsertSchema(presentationsTable).omit({ id: true, createdAt: true });
export type InsertPresentation = z.infer<typeof insertPresentationSchema>;
export type Presentation = typeof presentationsTable.$inferSelect;
