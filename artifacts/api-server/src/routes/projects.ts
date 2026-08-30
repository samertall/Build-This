import { Router } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  projectSourcesTable,
  researchInsightsTable,
  problemStatementsTable,
  recommendationsTable,
  userJourneysTable,
  featuresTable,
  tasksTable,
  presentationsTable,
} from "@workspace/db";
import { eq, count, and, inArray } from "drizzle-orm";
import {
  CreateProjectBody,
  UpdateProjectBody,
  AddProjectSourceBody,
  RunAnalysisBody,
  ApproveInsightBody,
  ApproveProblemBody,
  ApproveRecommendationBody,
  CreateFeatureBody,
  UpdateFeatureBody,
  UpdateTaskBody,
  GeneratePresentationBody,
} from "@workspace/api-zod";
import { runFullAnalysis } from "../lib/agents";
import { requireOwnedProject } from "../middlewares/auth";

const router = Router();

// Dashboard summary
router.get("/dashboard/summary", async (req, res) => {
  try {
    const ownerId = req.userId!;
    const projectScope = eq(projectsTable.ownerId, ownerId);
    const ownedProjectIds = db.select({ id: projectsTable.id }).from(projectsTable).where(projectScope);
    const [tProjects] = await db.select({ count: count() }).from(projectsTable).where(projectScope);
    const [aProjects] = await db.select({ count: count() }).from(projectsTable).where(and(projectScope, eq(projectsTable.status, "active")));
    const [tInsights] = await db.select({ count: count() }).from(researchInsightsTable).where(inArray(researchInsightsTable.projectId, ownedProjectIds));
    const [tTasks] = await db.select({ count: count() }).from(tasksTable).where(inArray(tasksTable.projectId, ownedProjectIds));
    const [pendingI] = await db.select({ count: count() }).from(researchInsightsTable).where(and(inArray(researchInsightsTable.projectId, ownedProjectIds), eq(researchInsightsTable.approvalStatus, "pending")));
    const [pendingP] = await db.select({ count: count() }).from(problemStatementsTable).where(and(inArray(problemStatementsTable.projectId, ownedProjectIds), eq(problemStatementsTable.approvalStatus, "pending")));
    const [pendingR] = await db.select({ count: count() }).from(recommendationsTable).where(and(inArray(recommendationsTable.projectId, ownedProjectIds), eq(recommendationsTable.approvalStatus, "pending")));
    const [tPres] = await db.select({ count: count() }).from(presentationsTable).where(inArray(presentationsTable.projectId, ownedProjectIds));
    const recentProjects = await db.select().from(projectsTable).where(projectScope).orderBy(projectsTable.updatedAt).limit(5);
    res.json({
      totalProjects: Number(tProjects.count),
      activeProjects: Number(aProjects.count),
      totalInsights: Number(tInsights.count),
      totalTasks: Number(tTasks.count),
      pendingApprovals: Number(pendingI.count) + Number(pendingP.count) + Number(pendingR.count),
      totalPresentations: Number(tPres.count),
      estimatedTimeSavedHours: Number(tTasks.count) * 0.5,
      recentProjects,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Projects list
router.get("/projects", async (req, res) => {
  try {
    const projects = await db.select().from(projectsTable).where(eq(projectsTable.ownerId, req.userId!)).orderBy(projectsTable.updatedAt);
    res.json(projects);
  } catch (err) {
    req.log.error({ err }, "Failed to list projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create project
router.post("/projects", async (req, res) => {
  try {
    const parsed = CreateProjectBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [project] = await db.insert(projectsTable).values({
      ...parsed.data,
      ownerId: req.userId!,
      status: "active",
      analysisStatus: "pending",
    }).returning();
    res.status(201).json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to create project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.use("/projects/:id", requireOwnedProject);

// Get project
router.get("/projects/:id", async (req, res) => {
  try {
    res.json(req.project);
  } catch (err) {
    req.log.error({ err }, "Failed to get project");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update project
router.patch("/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = UpdateProjectBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [project] = await db.update(projectsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(projectsTable.id, id), eq(projectsTable.ownerId, req.userId!)))
      .returning();
    if (!project) { res.status(404).json({ error: "Not found" }); return; }
    res.json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to update project");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete project
router.delete("/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.ownerId, req.userId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete project");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Project stats
router.get("/projects/:id/stats", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [iCount] = await db.select({ count: count() }).from(researchInsightsTable).where(eq(researchInsightsTable.projectId, id));
    const [iApproved] = await db.select({ count: count() }).from(researchInsightsTable).where(and(eq(researchInsightsTable.projectId, id), eq(researchInsightsTable.approvalStatus, "approved")));
    const [pCount] = await db.select({ count: count() }).from(problemStatementsTable).where(eq(problemStatementsTable.projectId, id));
    const [pApproved] = await db.select({ count: count() }).from(problemStatementsTable).where(and(eq(problemStatementsTable.projectId, id), eq(problemStatementsTable.approvalStatus, "approved")));
    const [rCount] = await db.select({ count: count() }).from(recommendationsTable).where(eq(recommendationsTable.projectId, id));
    const [rApproved] = await db.select({ count: count() }).from(recommendationsTable).where(and(eq(recommendationsTable.projectId, id), eq(recommendationsTable.approvalStatus, "approved")));
    const [fCount] = await db.select({ count: count() }).from(featuresTable).where(eq(featuresTable.projectId, id));
    const [tCount] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.projectId, id));
    const [presCount] = await db.select({ count: count() }).from(presentationsTable).where(eq(presentationsTable.projectId, id));
    const [srcCount] = await db.select({ count: count() }).from(projectSourcesTable).where(eq(projectSourcesTable.projectId, id));
    res.json({
      insightCount: Number(iCount.count),
      approvedInsights: Number(iApproved.count),
      problemCount: Number(pCount.count),
      approvedProblems: Number(pApproved.count),
      recommendationCount: Number(rCount.count),
      approvedRecommendations: Number(rApproved.count),
      featureCount: Number(fCount.count),
      taskCount: Number(tCount.count),
      presentationCount: Number(presCount.count),
      sourceCount: Number(srcCount.count),
      estimatedTimeSaved: Number(tCount.count) * 0.5,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get project stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sources
router.get("/projects/:id/sources", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const sources = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.projectId, id)).orderBy(projectSourcesTable.createdAt);
    res.json(sources);
  } catch (err) {
    req.log.error({ err }, "Failed to list sources");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/sources", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = AddProjectSourceBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [source] = await db.insert(projectSourcesTable).values({
      ...parsed.data,
      projectId: id,
      processingStatus: "ready",
    }).returning();
    res.status(201).json(source);
  } catch (err) {
    req.log.error({ err }, "Failed to add source");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/projects/:id/sources/:sourceId", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const sourceId = parseInt(req.params.sourceId);
    const deleted = await db.delete(projectSourcesTable)
      .where(and(eq(projectSourcesTable.id, sourceId), eq(projectSourcesTable.projectId, id)))
      .returning({ id: projectSourcesTable.id });
    if (deleted.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete source");
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI Analysis
router.post("/projects/:id/analyze", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = RunAnalysisBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const project = req.project!;
    const sources = await db.select().from(projectSourcesTable).where(eq(projectSourcesTable.projectId, id));
    await db.update(projectsTable).set({ analysisStatus: "running", updatedAt: new Date() }).where(and(eq(projectsTable.id, id), eq(projectsTable.ownerId, req.userId!)));
    const result = await runFullAnalysis(project, sources, parsed.data.agentTypes);
    await db.update(projectsTable).set({ analysisStatus: "complete", updatedAt: new Date() }).where(and(eq(projectsTable.id, id), eq(projectsTable.ownerId, req.userId!)));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to run analysis");
    await db.update(projectsTable).set({ analysisStatus: "error", updatedAt: new Date() }).where(and(eq(projectsTable.id, parseInt(req.params.id)), eq(projectsTable.ownerId, req.userId!)));
    res.status(500).json({ error: "Analysis failed" });
  }
});

// Insights
router.get("/projects/:id/insights", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const insights = await db.select().from(researchInsightsTable).where(eq(researchInsightsTable.projectId, id)).orderBy(researchInsightsTable.createdAt);
    res.json(insights);
  } catch (err) {
    req.log.error({ err }, "Failed to list insights");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/insights/:insightId/approve", async (req, res) => {
  try {
    const insightId = parseInt(req.params.insightId);
    const parsed = ApproveInsightBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [insight] = await db.update(researchInsightsTable)
      .set({ approvalStatus: parsed.data.status })
      .where(and(eq(researchInsightsTable.id, insightId), eq(researchInsightsTable.projectId, parseInt(req.params.id))))
      .returning();
    if (!insight) { res.status(404).json({ error: "Not found" }); return; }
    res.json(insight);
  } catch (err) {
    req.log.error({ err }, "Failed to approve insight");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Problems
router.get("/projects/:id/problems", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const problems = await db.select().from(problemStatementsTable).where(eq(problemStatementsTable.projectId, id)).orderBy(problemStatementsTable.createdAt);
    res.json(problems);
  } catch (err) {
    req.log.error({ err }, "Failed to list problems");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/problems/:problemId/approve", async (req, res) => {
  try {
    const problemId = parseInt(req.params.problemId);
    const parsed = ApproveProblemBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [problem] = await db.update(problemStatementsTable)
      .set({ approvalStatus: parsed.data.status })
      .where(and(eq(problemStatementsTable.id, problemId), eq(problemStatementsTable.projectId, parseInt(req.params.id))))
      .returning();
    if (!problem) { res.status(404).json({ error: "Not found" }); return; }
    res.json(problem);
  } catch (err) {
    req.log.error({ err }, "Failed to approve problem");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Recommendations
router.get("/projects/:id/recommendations", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const recs = await db.select().from(recommendationsTable).where(eq(recommendationsTable.projectId, id)).orderBy(recommendationsTable.createdAt);
    res.json(recs);
  } catch (err) {
    req.log.error({ err }, "Failed to list recommendations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/recommendations/:recId/approve", async (req, res) => {
  try {
    const recId = parseInt(req.params.recId);
    const parsed = ApproveRecommendationBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [rec] = await db.update(recommendationsTable)
      .set({ approvalStatus: parsed.data.status })
      .where(and(eq(recommendationsTable.id, recId), eq(recommendationsTable.projectId, parseInt(req.params.id))))
      .returning();
    if (!rec) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rec);
  } catch (err) {
    req.log.error({ err }, "Failed to approve recommendation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Journeys
router.get("/projects/:id/journeys", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const journeys = await db.select().from(userJourneysTable).where(eq(userJourneysTable.projectId, id)).orderBy(userJourneysTable.createdAt);
    res.json(journeys);
  } catch (err) {
    req.log.error({ err }, "Failed to list journeys");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Features
router.get("/projects/:id/features", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const features = await db.select().from(featuresTable).where(eq(featuresTable.projectId, id)).orderBy(featuresTable.riceScore);
    res.json(features);
  } catch (err) {
    req.log.error({ err }, "Failed to list features");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/features", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = CreateFeatureBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const data = parsed.data;
    let riceScore: number | null = null;
    if (data.reach && data.impact && data.confidence && data.effort && data.effort > 0) {
      riceScore = (data.reach * data.impact * (data.confidence / 100)) / data.effort;
    }
    const [feature] = await db.insert(featuresTable).values({
      ...data,
      projectId: id,
      riceScore,
      approvalStatus: "pending",
    }).returning();
    res.status(201).json(feature);
  } catch (err) {
    req.log.error({ err }, "Failed to create feature");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/projects/:id/features/:featureId", async (req, res) => {
  try {
    const featureId = parseInt(req.params.featureId);
    const parsed = UpdateFeatureBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const data = parsed.data;
    let riceScore: number | null | undefined = undefined;
    if (data.reach !== undefined && data.impact !== undefined && data.confidence !== undefined && data.effort !== undefined && data.effort > 0) {
      riceScore = (data.reach * data.impact * (data.confidence / 100)) / data.effort;
    }
    const updateData: Record<string, unknown> = { ...data };
    if (riceScore !== undefined) updateData.riceScore = riceScore;
    const [feature] = await db.update(featuresTable)
      .set(updateData)
      .where(and(eq(featuresTable.id, featureId), eq(featuresTable.projectId, parseInt(req.params.id))))
      .returning();
    if (!feature) { res.status(404).json({ error: "Not found" }); return; }
    res.json(feature);
  } catch (err) {
    req.log.error({ err }, "Failed to update feature");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Tasks
router.get("/projects/:id/tasks", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, id)).orderBy(tasksTable.createdAt);
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/projects/:id/tasks/:taskId", async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const parsed = UpdateTaskBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const [task] = await db.update(tasksTable)
      .set(parsed.data)
      .where(and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, parseInt(req.params.id))))
      .returning();
    if (!task) { res.status(404).json({ error: "Not found" }); return; }
    res.json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Presentations
router.get("/projects/:id/presentations", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const presentations = await db.select().from(presentationsTable).where(eq(presentationsTable.projectId, id)).orderBy(presentationsTable.createdAt);
    res.json(presentations);
  } catch (err) {
    req.log.error({ err }, "Failed to list presentations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/presentations", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = GeneratePresentationBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
    const project = req.project!;
    const insights = await db.select().from(researchInsightsTable).where(and(eq(researchInsightsTable.projectId, id), eq(researchInsightsTable.approvalStatus, "approved")));
    const problems = await db.select().from(problemStatementsTable).where(eq(problemStatementsTable.projectId, id));
    const recs = await db.select().from(recommendationsTable).where(eq(recommendationsTable.projectId, id));
    const features = await db.select().from(featuresTable).where(eq(featuresTable.projectId, id));
    const slides = generatePresentationSlides(project, insights, problems, recs, features, parsed.data);
    const [presentation] = await db.insert(presentationsTable).values({
      projectId: id,
      title: parsed.data.title,
      presentationType: parsed.data.presentationType ?? "project-pitch",
      audience: parsed.data.audience ?? "stakeholders",
      slideCount: slides.length,
      slides,
      status: "ready",
    }).returning();
    res.status(201).json(presentation);
  } catch (err) {
    req.log.error({ err }, "Failed to generate presentation");
    res.status(500).json({ error: "Internal server error" });
  }
});

function generatePresentationSlides(
  project: { name: string; description?: string | null; businessGoals?: string | null; targetUsers?: string | null; industry?: string | null },
  insights: { insight: string; evidence?: string | null }[],
  problems: { statement: string; howMightWe?: string | null }[],
  recs: { title: string; description: string; expectedImpact?: string | null }[],
  features: { title: string; moscowPriority?: string | null; phase?: string | null }[],
  opts: { title: string; presentationType?: string | null; audience?: string | null; slideCount?: number | null }
) {
  const baseSlides = [
    {
      id: 1,
      title: "Cover",
      layout: "cover",
      content: {
        headline: project.name,
        subtitle: project.description ?? "AI-Powered UX Workflow Automation",
        presenter: "Samer Tallauze — Senior UX/UI Product Designer",
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }),
      },
    },
    {
      id: 2,
      title: "The Problem",
      layout: "problem",
      content: {
        headline: "The Challenge",
        points: problems.slice(0, 4).map(p => p.statement),
        note: "Manual UX work is fragmented, repetitive, and slow.",
      },
    },
    {
      id: 3,
      title: "The Solution",
      layout: "solution",
      content: {
        headline: project.description ?? "AI-Powered UX Workflow Automation",
        description: "An agentic AI workspace that analyzes research, business goals, content, and design material — then generates UX insights, user flows, feature priorities, actionable tasks, and professional presentations.",
        pillars: ["Research Synthesis", "UX Strategy", "Feature Prioritization", "Task Generation", "Presentation Export"],
      },
    },
    {
      id: 4,
      title: "How It Works",
      layout: "steps",
      content: {
        headline: "Four-Step Workflow",
        steps: [
          { number: "01", label: "Upload Context", description: "Research notes, goals, files, URLs, and design references" },
          { number: "02", label: "AI Synthesis", description: "12 specialized agents analyze patterns, gaps, and opportunities" },
          { number: "03", label: "Generate Outputs", description: "Journeys, feature priorities, wireframe directions, and recommendations" },
          { number: "04", label: "Execute", description: "Team-ready tasks, presentations, and export to PM tools" },
        ],
      },
    },
    {
      id: 5,
      title: "Target Users",
      layout: "personas",
      content: {
        headline: "Built for Cross-Functional Teams",
        roles: [
          { role: "UX Designers", need: "Personas, journeys, wireframe directions" },
          { role: "Product Managers", need: "Feature priorities, roadmaps, user stories" },
          { role: "Developers", need: "Clear tickets, acceptance criteria, edge cases" },
          { role: "Content Teams", need: "UX writing, SEO, content gap reports" },
          { role: "Stakeholders", need: "Executive summaries, business impact, presentations" },
        ],
        userContext: project.targetUsers,
      },
    },
    {
      id: 6,
      title: "Key Insights",
      layout: "insights",
      content: {
        headline: "Research Findings",
        insights: insights.slice(0, 5).map(i => ({ text: i.insight, evidence: i.evidence })),
        note: insights.length === 0 ? "Run AI analysis to generate evidence-linked research insights." : undefined,
      },
    },
    {
      id: 7,
      title: "UX Recommendations",
      layout: "recommendations",
      content: {
        headline: "Strategic Recommendations",
        items: recs.slice(0, 4).map(r => ({ title: r.title, impact: r.expectedImpact, description: r.description })),
      },
    },
    {
      id: 8,
      title: "Feature Priorities",
      layout: "features",
      content: {
        headline: "Prioritized Backlog",
        mvp: features.filter(f => f.moscowPriority === "must" || f.phase === "mvp").slice(0, 4).map(f => f.title),
        future: features.filter(f => f.moscowPriority === "should" || f.phase === "phase2").slice(0, 3).map(f => f.title),
      },
    },
    {
      id: 9,
      title: "Business Impact",
      layout: "impact",
      content: {
        headline: "Expected Business Impact",
        metrics: [
          { label: "Faster Research-to-Decision", value: "60%", note: "Estimated reduction in synthesis time" },
          { label: "Clearer Requirements", value: "80%", note: "Reduction in ambiguous dev tickets" },
          { label: "Less Manual Planning", value: "40%", note: "Reduction in repetitive UX planning" },
          { label: "Better Team Alignment", value: "3x", note: "Faster cross-functional sign-off" },
        ],
      },
    },
    {
      id: 10,
      title: "Roadmap",
      layout: "roadmap",
      content: {
        headline: "Roadmap & Next Steps",
        phases: [
          { phase: "Phase 1", label: "Prototype", description: "Refine AI prompts, UX logic, and output templates" },
          { phase: "Phase 2", label: "Integrations", description: "Connect Figma, Google Drive, ClickUp, and content systems" },
          { phase: "Phase 3", label: "Industry Packs", description: "Adapt for LMS, SaaS, e-commerce, and enterprise teams" },
          { phase: "Phase 4", label: "Analytics", description: "Measure time saved, task clarity, and business impact" },
        ],
      },
    },
  ];

  const slideCount = opts.slideCount ?? 9;
  return baseSlides.slice(0, slideCount);
}

export default router;
