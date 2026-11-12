-- Build-This initial schema, matching Drizzle tables in lib/db/src/schema and AI quota table.
-- Additive DDL only. Validate on a Neon temporary branch before production application.
CREATE TABLE IF NOT EXISTS "projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "owner_id" text,
  "name" text NOT NULL,
  "description" text,
  "product_type" text,
  "industry" text,
  "stage" text,
  "business_goals" text,
  "target_users" text,
  "status" text NOT NULL DEFAULT 'active',
  "analysis_status" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "projects_owner_id_idx" ON "projects" ("owner_id");
CREATE TABLE IF NOT EXISTS "project_sources" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "name" text NOT NULL,
  "content" text,
  "url" text,
  "classification" text,
  "processing_status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "research_insights" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "agent_type" text NOT NULL DEFAULT 'research',
  "cluster" text,
  "insight" text NOT NULL,
  "evidence" text,
  "confidence" text,
  "tags" text,
  "approval_status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "problem_statements" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "statement" text NOT NULL,
  "how_might_we" text,
  "root_cause" text,
  "business_impact" text,
  "user_segment" text,
  "success_metric" text,
  "approval_status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "recommendations" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" text,
  "user_problem" text,
  "business_goal" text,
  "evidence" text,
  "expected_impact" text,
  "effort" text,
  "risk" text,
  "confidence" text,
  "priority" text,
  "approval_status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "user_journeys" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "persona" text,
  "scenario" text,
  "journey_type" text NOT NULL DEFAULT 'current',
  "stages" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "approval_status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "features" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "category" text,
  "reach" integer,
  "impact" integer,
  "confidence" integer,
  "effort" integer,
  "rice_score" real,
  "moscow_priority" text,
  "phase" text,
  "approval_status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "category" text,
  "user_story" text,
  "acceptance_criteria" text,
  "priority" text,
  "effort" text,
  "status" text NOT NULL DEFAULT 'todo',
  "owner" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "presentations" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "presentation_type" text,
  "audience" text,
  "slide_count" integer,
  "slides" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'draft',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "project_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "user_id" text,
  "email" text NOT NULL,
  "name" text,
  "role" text NOT NULL DEFAULT 'reviewer',
  "status" text NOT NULL DEFAULT 'invited',
  "invited_by" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "project_members_project_email_idx" ON "project_members" ("project_id","email");
CREATE INDEX IF NOT EXISTS "project_members_user_id_idx" ON "project_members" ("user_id");
CREATE TABLE IF NOT EXISTS "project_comments" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "item_type" text NOT NULL,
  "item_id" integer NOT NULL,
  "body" text NOT NULL,
  "author_id" text NOT NULL,
  "author_name" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "project_comments_item_idx" ON "project_comments" ("project_id","item_type","item_id");
CREATE TABLE IF NOT EXISTS "approval_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "item_type" text NOT NULL,
  "item_id" integer NOT NULL,
  "status" text NOT NULL,
  "comment" text,
  "actor_id" text NOT NULL,
  "actor_name" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "approval_events_item_idx" ON "approval_events" ("project_id","item_type","item_id");
CREATE INDEX IF NOT EXISTS "approval_events_project_idx" ON "approval_events" ("project_id","created_at");
CREATE TABLE IF NOT EXISTS "ai_analysis_usage" (
  "quota_key" text NOT NULL,
  "quota_day" date NOT NULL,
  "used_stages" integer NOT NULL CHECK ("used_stages" >= 0),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("quota_key","quota_day")
);
