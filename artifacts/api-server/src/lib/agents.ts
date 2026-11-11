import { OpenAI } from "openai";
import { db } from "@workspace/db";
import {
  researchInsightsTable,
  problemStatementsTable,
  recommendationsTable,
  userJourneysTable,
  featuresTable,
  tasksTable,
} from "@workspace/db";
import { handleAgentFailure, parseAgentItems, testMockFallbackEnabled } from "./ai-guard.js";

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
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
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

// ─── Mock data generators for fallback mode ───────────────────────────────────

function getMockInsights(project: Project) {
  return [
    { cluster: "User Needs", insight: `Users of ${project.name} need streamlined workflows that reduce cognitive load during key tasks.`, evidence: "AI-generated based on project context", confidence: "medium", tags: "usability, workflow" },
    { cluster: "Pain Points", insight: "Navigation complexity causes drop-off before users reach core value features.", evidence: "AI-generated based on project context", confidence: "medium", tags: "navigation, retention" },
    { cluster: "Opportunities", insight: "Onboarding experience lacks progressive disclosure, leading to overwhelm for new users.", evidence: "AI-generated based on project context", confidence: "high", tags: "onboarding, ux" },
    { cluster: "Content Gaps", insight: "Help documentation is insufficient for self-service resolution of common issues.", evidence: "AI-generated based on project context", confidence: "medium", tags: "content, support" },
    { cluster: "Business Alignment", insight: `${project.businessGoals ? "Business goals suggest" : "Platform"} conversion optimization as a primary opportunity area.`, evidence: "AI-generated based on project context", confidence: "low", tags: "conversion, business" },
  ];
}

function getMockProblems(project: Project) {
  return [
    { statement: `Users of ${project.name} struggle to understand the value proposition within the first session, leading to high early churn.`, howMightWe: "How might we communicate core value in under 60 seconds?", rootCause: "Unclear onboarding and value framing", businessImpact: "High churn reduces LTV and increases CAC", userSegment: "New users", successMetric: "Reduce 7-day churn by 20%" },
    { statement: "Power users cannot efficiently complete repeat tasks due to lack of shortcuts and bulk actions.", howMightWe: "How might we enable expert users to work at speed?", rootCause: "Interface designed only for new users", businessImpact: "Reduced engagement and satisfaction for high-value users", userSegment: "Power users", successMetric: "Reduce time-on-task by 30% for returning users" },
    { statement: "Mobile experience is inconsistent with desktop, causing context-switching friction.", howMightWe: "How might we create a seamless cross-device experience?", rootCause: "Mobile was a secondary consideration in design", businessImpact: "Lost engagement from mobile-first users", userSegment: "Mobile users", successMetric: "Achieve parity in task completion rates across devices" },
  ];
}

function getMockRecommendations(project: Project) {
  return [
    { title: "Redesign Onboarding Flow with Progressive Disclosure", description: "Introduce a step-by-step onboarding that reveals features as users demonstrate readiness, reducing cognitive overload.", category: "usability", userProblem: "New users are overwhelmed by feature density", businessGoal: project.businessGoals ?? "Improve activation rate", evidence: "AI-generated based on project context", expectedImpact: "20-30% improvement in activation rate", effort: "medium", risk: "low", confidence: "high", priority: "critical" },
    { title: "Implement Persistent Navigation with Clear Hierarchy", description: "Restructure navigation to surface primary actions and reduce depth required to reach key features.", category: "navigation", userProblem: "Users cannot find core features efficiently", businessGoal: "Reduce support tickets and increase feature adoption", evidence: "AI-generated based on project context", expectedImpact: "15% reduction in navigation-related drop-off", effort: "medium", risk: "medium", confidence: "medium", priority: "high" },
    { title: "Add Contextual Help and Inline Documentation", description: "Embed contextual tooltips and micro-help patterns at decision points to reduce reliance on external documentation.", category: "content", userProblem: "Users get stuck and abandon tasks", businessGoal: "Reduce support costs and increase self-service resolution", evidence: "AI-generated based on project context", expectedImpact: "25% reduction in support tickets", effort: "low", risk: "low", confidence: "high", priority: "high" },
    { title: "Optimize Mobile Responsive Experience", description: "Audit and rebuild mobile-specific interactions to match desktop parity for core workflows.", category: "usability", userProblem: "Mobile users cannot complete key tasks efficiently", businessGoal: "Capture mobile-first market segment", evidence: "AI-generated based on project context", expectedImpact: "30% improvement in mobile task completion", effort: "high", risk: "medium", confidence: "medium", priority: "medium" },
  ];
}

function getMockJourneys(project: Project) {
  return [
    {
      title: `${project.name} — Current State Journey`,
      persona: "Primary User",
      scenario: `A user discovers ${project.name} and attempts to complete their first key task`,
      journeyType: "current",
      stages: [
        { name: "Discovery", userGoal: "Understand what the product does", actions: ["Lands on homepage", "Reads headline", "Looks for pricing"], thoughts: "Does this solve my problem?", emotions: "Curious but skeptical", painPoints: ["Value proposition is unclear", "No social proof visible"], touchpoints: ["Homepage", "Navigation"], opportunities: ["Clarify headline", "Add trust signals"] },
        { name: "Sign Up", userGoal: "Create an account quickly", actions: ["Clicks CTA", "Fills form", "Confirms email"], thoughts: "I hope this doesn't take long", emotions: "Motivated but impatient", painPoints: ["Too many required fields", "Email confirmation delay"], touchpoints: ["Sign up page", "Email"], opportunities: ["Reduce friction", "Improve confirmation flow"] },
        { name: "Onboarding", userGoal: "Get to first value", actions: ["Completes setup wizard", "Explores dashboard", "Gets lost in features"], thoughts: "Where do I start?", emotions: "Overwhelmed", painPoints: ["No clear starting point", "Too many options at once"], touchpoints: ["Dashboard", "Onboarding wizard"], opportunities: ["Progressive disclosure", "Guided first task"] },
      ]
    },
    {
      title: `${project.name} — Future State Journey`,
      persona: "Primary User",
      scenario: `A user discovers ${project.name} and successfully completes their first key task with the improved experience`,
      journeyType: "future",
      stages: [
        { name: "Discovery", userGoal: "Immediately understand value", actions: ["Lands on homepage", "Sees clear value prop", "Reviews social proof"], thoughts: "This looks exactly like what I need", emotions: "Excited and confident", painPoints: [], touchpoints: ["Homepage"], opportunities: [] },
        { name: "Sign Up", userGoal: "Create account in under 60 seconds", actions: ["One-click OAuth or minimal form", "Instant access"], thoughts: "That was easy", emotions: "Impressed", painPoints: [], touchpoints: ["Sign up page"], opportunities: ["Continue reducing friction"] },
        { name: "Guided Onboarding", userGoal: "Complete first meaningful task", actions: ["Follows guided steps", "Achieves first win", "Understands core workflow"], thoughts: "I can see myself using this daily", emotions: "Satisfied and confident", painPoints: [], touchpoints: ["Onboarding flow", "Dashboard"], opportunities: ["Personalize based on role"] },
      ]
    }
  ];
}

function getMockFeatures(project: Project) {
  const features = [
    { title: "Interactive Onboarding Wizard", description: "Step-by-step guided setup that adapts to user role and goals", category: "onboarding", reach: 80, impact: 3, confidence: 90, effort: 4, moscowPriority: "must", phase: "mvp" },
    { title: "Global Search", description: "Unified search across all content types with keyboard shortcut support", category: "navigation", reach: 75, impact: 2, confidence: 80, effort: 3, moscowPriority: "must", phase: "mvp" },
    { title: "Dashboard Customization", description: "Allow users to pin, reorder, and configure their dashboard widgets", category: "personalization", reach: 60, impact: 2, confidence: 70, effort: 5, moscowPriority: "should", phase: "phase2" },
    { title: "Bulk Actions", description: "Select and act on multiple items simultaneously to speed up repetitive workflows", category: "productivity", reach: 50, impact: 2, confidence: 75, effort: 3, moscowPriority: "should", phase: "phase2" },
    { title: "Export & Reporting", description: "Export data to CSV/PDF and generate summary reports", category: "data", reach: 65, impact: 2, confidence: 85, effort: 4, moscowPriority: "should", phase: "phase2" },
    { title: "Team Collaboration", description: "Real-time collaboration features with comments, mentions, and activity feeds", category: "collaboration", reach: 55, impact: 3, confidence: 65, effort: 8, moscowPriority: "could", phase: "future" },
    { title: "Mobile App", description: "Native mobile app for iOS and Android with core workflow support", category: "mobile", reach: 70, impact: 2, confidence: 60, effort: 10, moscowPriority: "could", phase: "future" },
  ];
  return features;
}

function getMockTasks(project: Project) {
  return [
    { title: "Audit and redesign onboarding flow", description: "Map the current onboarding steps, identify friction points, and design a new progressive disclosure-based flow.", category: "design", userStory: "As a new user, I want to understand the product value immediately so I can quickly reach my first goal.", acceptanceCriteria: "New users complete onboarding in under 3 minutes. Task completion rate above 80%.", priority: "critical", effort: "l", owner: "UX Designer" },
    { title: "Implement global navigation restructure", description: "Redesign primary navigation based on information architecture audit. Reduce depth to max 2 levels.", category: "design", userStory: "As a user, I want to find any feature within 2 clicks so I don't waste time navigating.", acceptanceCriteria: "Navigation depth reduced to 2 levels. User testing shows >90% findability for top 10 features.", priority: "high", effort: "m", owner: "UX Designer" },
    { title: "Build contextual help system", description: "Implement inline tooltips, feature hints, and contextual documentation at key decision points.", category: "development", userStory: "As a user, I want guidance when I'm stuck so I don't have to leave the app to find help.", acceptanceCriteria: "Help content exists for all major features. Support tickets reduce by 20% after launch.", priority: "high", effort: "m", owner: "Developer" },
    { title: "Mobile responsive audit and fixes", description: "Audit all core flows on mobile devices, document issues, and implement fixes for critical paths.", category: "development", userStory: "As a mobile user, I want the same experience as desktop so I can work from any device.", acceptanceCriteria: "Core task completion rate on mobile matches desktop within 10%.", priority: "high", effort: "l", owner: "Developer" },
    { title: "Create empty state designs", description: "Design empty states for all major sections with clear CTAs and helpful guidance.", category: "design", userStory: "As a new user, I want to know what to do when I have no data so I can get started quickly.", acceptanceCriteria: "All empty states have been designed and include a primary CTA and explanatory copy.", priority: "medium", effort: "s", owner: "UX Designer" },
    { title: "Write onboarding copy and microcopy", description: "Craft clear, conversational copy for all onboarding steps, tooltips, and error messages.", category: "content", userStory: "As a user, I want clear language throughout the app so I always know what to do next.", acceptanceCriteria: "All onboarding copy reviewed and approved. Readability score above 70 (Flesch-Kincaid).", priority: "medium", effort: "m", owner: "Content Strategist" },
    { title: "Implement bulk action functionality", description: "Add multi-select and bulk action support for list views across the platform.", category: "development", userStory: "As a power user, I want to act on multiple items at once so I can work more efficiently.", acceptanceCriteria: "Bulk select and delete/archive/export available on all major list views.", priority: "medium", effort: "m", owner: "Developer" },
    { title: "Set up analytics and event tracking", description: "Instrument key user actions with analytics events to measure feature adoption and funnel performance.", category: "development", userStory: "As a product manager, I want data on how users interact with the product so I can make informed decisions.", acceptanceCriteria: "Top 20 user actions tracked. Dashboard showing funnel conversion rates live.", priority: "medium", effort: "m", owner: "Developer" },
    { title: "QA: Cross-browser and device testing", description: "Test all critical flows across major browsers (Chrome, Firefox, Safari) and device types.", category: "qa", userStory: "As a user, I want the product to work consistently regardless of my browser or device.", acceptanceCriteria: "Zero critical bugs on Chrome, Firefox, Safari. Core flows work on iOS and Android.", priority: "high", effort: "m", owner: "QA Engineer" },
  ];
}

// ─── Agent runners with fallback ─────────────────────────────────────────────

async function runResearchAgent(project: Project, sources: Source[]): Promise<number> {
  const context = buildProjectContext(project, sources);
  let insights: Array<{ cluster?: string; insight: string; evidence?: string; confidence?: string; tags?: string }> = [];

  try {
    const raw = await callAgent(
      `You are a senior UX research synthesizer. Analyze project materials and extract evidence-linked research insights.
Return JSON: { "insights": [{ "cluster": string, "insight": string, "evidence": string, "confidence": "high"|"medium"|"low", "tags": string }] }
Generate 5-8 specific, actionable insights. Each insight must cite evidence or be labeled as an AI interpretation.
Focus on: pain points, user needs, content gaps, constraints, and opportunities.`,
      `Analyze this project and generate research insights:\n\n${context}`
    );
    insights = parseAgentItems<typeof insights[number]>(raw, "insights");
  } catch (err) {
    insights = handleAgentFailure(err, () => getMockInsights(project));
  }

  if (insights.length > 0) {
    await db.insert(researchInsightsTable).values(
      insights.map(i => ({
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
  let problems: Array<{ statement: string; howMightWe?: string; rootCause?: string; businessImpact?: string; userSegment?: string; successMetric?: string }> = [];

  try {
    const raw = await callAgent(
      `You are a UX problem framing specialist. Convert research findings into clear, specific problem statements.
Return JSON: { "problems": [{ "statement": string, "howMightWe": string, "rootCause": string, "businessImpact": string, "userSegment": string, "successMetric": string }] }
Generate 4-6 problem statements. Each must be specific and measurable. Avoid vague statements like "improve UX".`,
      `Generate problem statements for this project:\n\n${context}`
    );
    problems = parseAgentItems<typeof problems[number]>(raw, "problems");
  } catch (err) {
    problems = handleAgentFailure(err, () => getMockProblems(project));
  }

  if (problems.length > 0) {
    await db.insert(problemStatementsTable).values(
      problems.map(p => ({
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
  let recs: Array<{ title: string; description: string; category?: string; userProblem?: string; businessGoal?: string; evidence?: string; expectedImpact?: string; effort?: string; risk?: string; confidence?: string; priority?: string }> = [];

  try {
    const raw = await callAgent(
      `You are a senior UX strategist. Generate specific, evidence-linked UX recommendations.
Return JSON: { "recommendations": [{ "title": string, "description": string, "category": string, "userProblem": string, "businessGoal": string, "evidence": string, "expectedImpact": string, "effort": "low"|"medium"|"high", "risk": "low"|"medium"|"high", "confidence": "high"|"medium"|"low", "priority": "critical"|"high"|"medium"|"low" }] }
Generate 5-7 recommendations. Categories: usability, accessibility, conversion, content, navigation, performance, SEO.
Each recommendation must be specific and actionable — never say "improve UX" or "make it intuitive".`,
      `Generate UX recommendations for this project:\n\n${context}`
    );
    recs = parseAgentItems<typeof recs[number]>(raw, "recommendations");
  } catch (err) {
    recs = handleAgentFailure(err, () => getMockRecommendations(project));
  }

  if (recs.length > 0) {
    await db.insert(recommendationsTable).values(
      recs.map(r => ({
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
  let journeys: Array<{ title: string; persona?: string; scenario?: string; journeyType?: string; stages: unknown }> = [];

  try {
    const raw = await callAgent(
      `You are a UX journey mapping specialist. Create detailed user journey maps.
Return JSON: { "journeys": [{ "title": string, "persona": string, "scenario": string, "journeyType": "current"|"future", "stages": [{ "name": string, "userGoal": string, "actions": [string], "thoughts": string, "emotions": string, "painPoints": [string], "touchpoints": [string], "opportunities": [string] }] }] }
Generate 2 journeys: one current-state (showing pain points) and one future-state (showing the improved experience).`,
      `Generate user journey maps for this project:\n\n${context}`
    );
    journeys = parseAgentItems<typeof journeys[number]>(raw, "journeys");
  } catch (err) {
    journeys = handleAgentFailure(err, () => getMockJourneys(project));
  }

  if (journeys.length > 0) {
    await db.insert(userJourneysTable).values(
      journeys.map(j => ({
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
  let features: Array<{ title: string; description?: string; category?: string; reach?: number; impact?: number; confidence?: number; effort?: number; moscowPriority?: string; phase?: string }> = [];

  try {
    const raw = await callAgent(
      `You are a product feature prioritization expert. Generate and prioritize features using RICE scoring.
Return JSON: { "features": [{ "title": string, "description": string, "category": string, "reach": number (1-100), "impact": number (1-3), "confidence": number (1-100), "effort": number (1-10, weeks), "moscowPriority": "must"|"should"|"could"|"wont", "phase": "mvp"|"phase2"|"future" }] }
Generate 6-10 features. Calculate RICE = (reach * impact * confidence/100) / effort.
Prioritize MVP features that deliver the most user and business value quickly.`,
      `Generate prioritized features for this project:\n\n${context}`
    );
    features = parseAgentItems<typeof features[number]>(raw, "features");
  } catch (err) {
    features = handleAgentFailure(err, () => getMockFeatures(project));
  }

  if (features.length > 0) {
    await db.insert(featuresTable).values(
      features.map(f => {
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
  let tasks: Array<{ title: string; description?: string; category?: string; userStory?: string; acceptanceCriteria?: string; priority?: string; effort?: string; owner?: string }> = [];

  try {
    const raw = await callAgent(
      `You are a UX task orchestration specialist. Generate detailed, actionable team tasks.
Return JSON: { "tasks": [{ "title": string, "description": string, "category": "design"|"development"|"content"|"research"|"qa"|"marketing", "userStory": string, "acceptanceCriteria": string, "priority": "critical"|"high"|"medium"|"low", "effort": "xs"|"s"|"m"|"l"|"xl", "owner": string }] }
Generate 8-12 tasks covering design, development, content, and QA. Each task must have a clear user story and acceptance criteria.
Avoid vague tasks — be specific about what needs to be done and how success is measured.`,
      `Generate team tasks for this project:\n\n${context}`
    );
    tasks = parseAgentItems<typeof tasks[number]>(raw, "tasks");
  } catch (err) {
    tasks = handleAgentFailure(err, () => getMockTasks(project));
  }

  if (tasks.length > 0) {
    await db.insert(tasksTable).values(
      tasks.map(t => ({
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
  usingFallback?: boolean;
}> {
  const agentsRun: string[] = [];
  let insightsGenerated = 0;
  let problemsGenerated = 0;
  let recommendationsGenerated = 0;
  let featuresGenerated = 0;
  let tasksGenerated = 0;
  if (!process.env.OPENAI_API_KEY && !testMockFallbackEnabled()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const usingFallback = testMockFallbackEnabled();

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

  const suffix = usingFallback ? " (test-only sample data enabled)" : "";

  return {
    status: "complete",
    agentsRun,
    insightsGenerated,
    problemsGenerated,
    recommendationsGenerated,
    featuresGenerated,
    tasksGenerated,
    message: `Analysis complete. Generated ${insightsGenerated} insights, ${problemsGenerated} problem statements, ${recommendationsGenerated} recommendations, ${featuresGenerated} features, and ${tasksGenerated} tasks.${suffix}`,
    usingFallback,
  };
}
