import OpenAI from "openai";
import { db } from "@workspace/db";
import {
  researchInsightsTable,
  problemStatementsTable,
  recommendationsTable,
  userJourneysTable,
  featuresTable,
  tasksTable,
} from "@workspace/db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Project = {
  id: number;
  name: string;
  description?: string | null;
  productType?: string | null;
  industry?: string | null;
  businessGoals?: string | null;
  targetUsers?: string | null;
};

type Source = {
  type: string;
  name: string;
  content?: string | null;
  url?: string | null;
  classification?: string | null;
};

async function callAgent(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.4,
  });
  return response.choices[0]?.message?.content ?? "{}";
}

function buildProjectContext(project: Project, sources: Source[]): string {
  const sourceText = sources
    .map(s => `[${s.classification ?? s.type}] ${s.name}: ${s.content ?? s.url ?? ""}`)
    .join("\n\n");
  return `
Project: ${project.name}
Industry: ${project.industry ?? "Not specified"}
Product Type: ${project.productType ?? "Not specified"}
Business Goals: ${project.businessGoals ?? "Not specified"}
Target Users: ${project.targetUsers ?? "Not specified"}
Description: ${project.description ?? "Not specified"}

Source Materials:
${sourceText || "No sources provided — generate insights based on project context."}
`.trim();
}

async function runResearchAgent(project: Project, sources: Source[]): Promise<number> {
  const context = buildProjectContext(project, sources);
  const raw = await callAgent(
    `You are a senior UX research synthesizer. Analyze project materials and extract evidence-linked research insights.
Return JSON: { "insights": [{ "cluster": string, "insight": string, "evidence": string, "confidence": "high"|"medium"|"low", "tags": string }] }
Generate 5-8 specific, actionable insights. Each insight must cite evidence or be labeled as an AI interpretation.
Focus on: pain points, user needs, content gaps, constraints, and opportunities.`,
    `Analyze this project and generate research insights:\n\n${context}`
  );
  const parsed = JSON.parse(raw);
  const insights = parsed.insights ?? [];
  if (insights.length > 0) {
    await db.insert(researchInsightsTable).values(
      insights.map((i: { cluster?: string; insight: string; evidence?: string; confidence?: string; tags?: string }) => ({
        projectId: project.id,
        agentType: "research",
        cluster: i.cluster ?? "General",
        insight: i.insight,
        evidence: i.evidence,
        confidence: i.confidence ?? "medium",
        tags: i.tags,
        approvalStatus: "pending",
      }))
    );
  }
  return insights.length;
}

async function runProblemAgent(project: Project, sources: Source[]): Promise<number> {
  const context = buildProjectContext(project, sources);
  const raw = await callAgent(
    `You are a UX problem framing specialist. Convert research findings into clear, specific problem statements.
Return JSON: { "problems": [{ "statement": string, "howMightWe": string, "rootCause": string, "businessImpact": string, "userSegment": string, "successMetric": string }] }
Generate 4-6 problem statements. Each must be specific and measurable. Avoid vague statements like "improve UX".`,
    `Generate problem statements for this project:\n\n${context}`
  );
  const parsed = JSON.parse(raw);
  const problems = parsed.problems ?? [];
  if (problems.length > 0) {
    await db.insert(problemStatementsTable).values(
      problems.map((p: { statement: string; howMightWe?: string; rootCause?: string; businessImpact?: string; userSegment?: string; successMetric?: string }) => ({
        projectId: project.id,
        statement: p.statement,
        howMightWe: p.howMightWe,
        rootCause: p.rootCause,
        businessImpact: p.businessImpact,
        userSegment: p.userSegment,
        successMetric: p.successMetric,
        approvalStatus: "pending",
      }))
    );
  }
  return problems.length;
}

async function runUXStrategyAgent(project: Project, sources: Source[]): Promise<number> {
  const context = buildProjectContext(project, sources);
  const raw = await callAgent(
    `You are a senior UX strategist. Generate specific, evidence-linked UX recommendations.
Return JSON: { "recommendations": [{ "title": string, "description": string, "category": string, "userProblem": string, "businessGoal": string, "evidence": string, "expectedImpact": string, "effort": "low"|"medium"|"high", "risk": "low"|"medium"|"high", "confidence": "high"|"medium"|"low", "priority": "critical"|"high"|"medium"|"low" }] }
Generate 5-7 recommendations. Categories: usability, accessibility, conversion, content, navigation, performance, SEO.
Each recommendation must be specific and actionable — never say "improve UX" or "make it intuitive".`,
    `Generate UX recommendations for this project:\n\n${context}`
  );
  const parsed = JSON.parse(raw);
  const recs = parsed.recommendations ?? [];
  if (recs.length > 0) {
    await db.insert(recommendationsTable).values(
      recs.map((r: { title: string; description: string; category?: string; userProblem?: string; businessGoal?: string; evidence?: string; expectedImpact?: string; effort?: string; risk?: string; confidence?: string; priority?: string }) => ({
        projectId: project.id,
        title: r.title,
        description: r.description,
        category: r.category,
        userProblem: r.userProblem,
        businessGoal: r.businessGoal,
        evidence: r.evidence,
        expectedImpact: r.expectedImpact,
        effort: r.effort ?? "medium",
        risk: r.risk ?? "low",
        confidence: r.confidence ?? "medium",
        priority: r.priority ?? "medium",
        approvalStatus: "pending",
      }))
    );
  }
  return recs.length;
}

async function runJourneyAgent(project: Project, sources: Source[]): Promise<number> {
  const context = buildProjectContext(project, sources);
  const raw = await callAgent(
    `You are a UX journey mapping specialist. Create detailed user journey maps.
Return JSON: { "journeys": [{ "title": string, "persona": string, "scenario": string, "journeyType": "current"|"future", "stages": [{ "name": string, "userGoal": string, "actions": [string], "thoughts": string, "emotions": string, "painPoints": [string], "touchpoints": [string], "opportunities": [string] }] }] }
Generate 2 journeys: one current-state (showing pain points) and one future-state (showing the improved experience).`,
    `Generate user journey maps for this project:\n\n${context}`
  );
  const parsed = JSON.parse(raw);
  const journeys = parsed.journeys ?? [];
  if (journeys.length > 0) {
    await db.insert(userJourneysTable).values(
      journeys.map((j: { title: string; persona?: string; scenario?: string; journeyType?: string; stages: unknown }) => ({
        projectId: project.id,
        title: j.title,
        persona: j.persona,
        scenario: j.scenario,
        journeyType: j.journeyType ?? "current",
        stages: j.stages,
        approvalStatus: "pending",
      }))
    );
  }
  return journeys.length;
}

async function runFeatureAgent(project: Project, sources: Source[]): Promise<number> {
  const context = buildProjectContext(project, sources);
  const raw = await callAgent(
    `You are a product feature prioritization expert. Generate and prioritize features using RICE scoring.
Return JSON: { "features": [{ "title": string, "description": string, "category": string, "reach": number (1-100), "impact": number (1-3), "confidence": number (1-100), "effort": number (1-10, weeks), "moscowPriority": "must"|"should"|"could"|"wont", "phase": "mvp"|"phase2"|"future" }] }
Generate 6-10 features. Calculate RICE = (reach * impact * confidence/100) / effort.
Prioritize MVP features that deliver the most user and business value quickly.`,
    `Generate prioritized features for this project:\n\n${context}`
  );
  const parsed = JSON.parse(raw);
  const features = parsed.features ?? [];
  if (features.length > 0) {
    await db.insert(featuresTable).values(
      features.map((f: { title: string; description?: string; category?: string; reach?: number; impact?: number; confidence?: number; effort?: number; moscowPriority?: string; phase?: string }) => {
        const reach = f.reach ?? 50;
        const impact = f.impact ?? 2;
        const conf = f.confidence ?? 70;
        const effort = f.effort ?? 3;
        const riceScore = effort > 0 ? (reach * impact * (conf / 100)) / effort : 0;
        return {
          projectId: project.id,
          title: f.title,
          description: f.description,
          category: f.category,
          reach,
          impact,
          confidence: conf,
          effort,
          riceScore,
          moscowPriority: f.moscowPriority ?? "should",
          phase: f.phase ?? "phase2",
          approvalStatus: "pending",
        };
      })
    );
  }
  return features.length;
}

async function runTaskAgent(project: Project, sources: Source[]): Promise<number> {
  const context = buildProjectContext(project, sources);
  const raw = await callAgent(
    `You are a UX task orchestration specialist. Generate detailed, actionable team tasks.
Return JSON: { "tasks": [{ "title": string, "description": string, "category": "design"|"development"|"content"|"research"|"qa"|"marketing", "userStory": string, "acceptanceCriteria": string, "priority": "critical"|"high"|"medium"|"low", "effort": "xs"|"s"|"m"|"l"|"xl", "owner": string }] }
Generate 8-12 tasks covering design, development, content, and QA. Each task must have a clear user story and acceptance criteria.
Avoid vague tasks — be specific about what needs to be done and how success is measured.`,
    `Generate team tasks for this project:\n\n${context}`
  );
  const parsed = JSON.parse(raw);
  const tasks = parsed.tasks ?? [];
  if (tasks.length > 0) {
    await db.insert(tasksTable).values(
      tasks.map((t: { title: string; description?: string; category?: string; userStory?: string; acceptanceCriteria?: string; priority?: string; effort?: string; owner?: string }) => ({
        projectId: project.id,
        title: t.title,
        description: t.description,
        category: t.category ?? "design",
        userStory: t.userStory,
        acceptanceCriteria: t.acceptanceCriteria,
        priority: t.priority ?? "medium",
        effort: t.effort ?? "m",
        status: "todo",
        owner: t.owner,
      }))
    );
  }
  return tasks.length;
}

export async function runFullAnalysis(
  project: Project,
  sources: Source[],
  agentTypes: string[]
): Promise<{
  status: string;
  agentsRun: string[];
  insightsGenerated: number;
  problemsGenerated: number;
  recommendationsGenerated: number;
  featuresGenerated: number;
  tasksGenerated: number;
  message: string;
}> {
  const agentsRun: string[] = [];
  let insightsGenerated = 0;
  let problemsGenerated = 0;
  let recommendationsGenerated = 0;
  let featuresGenerated = 0;
  let tasksGenerated = 0;

  const runAll = agentTypes.includes("all") || agentTypes.length === 0;

  if (runAll || agentTypes.includes("research")) {
    insightsGenerated = await runResearchAgent(project, sources);
    agentsRun.push("research");
  }

  if (runAll || agentTypes.includes("problems")) {
    problemsGenerated = await runProblemAgent(project, sources);
    agentsRun.push("problems");
  }

  if (runAll || agentTypes.includes("strategy")) {
    recommendationsGenerated = await runUXStrategyAgent(project, sources);
    agentsRun.push("strategy");
  }

  if (runAll || agentTypes.includes("journeys")) {
    await runJourneyAgent(project, sources);
    agentsRun.push("journeys");
  }

  if (runAll || agentTypes.includes("features")) {
    featuresGenerated = await runFeatureAgent(project, sources);
    agentsRun.push("features");
  }

  if (runAll || agentTypes.includes("tasks")) {
    tasksGenerated = await runTaskAgent(project, sources);
    agentsRun.push("tasks");
  }

  return {
    status: "complete",
    agentsRun,
    insightsGenerated,
    problemsGenerated,
    recommendationsGenerated,
    featuresGenerated,
    tasksGenerated,
    message: `Analysis complete. Generated ${insightsGenerated} insights, ${problemsGenerated} problem statements, ${recommendationsGenerated} recommendations, ${featuresGenerated} features, and ${tasksGenerated} tasks.`,
  };
}
