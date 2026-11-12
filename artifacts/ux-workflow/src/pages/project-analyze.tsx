import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, FlaskConical, Target, Lightbulb, Route, Star, ListChecks, CheckCircle, Loader2, PlayCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useRunAnalysis, useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

const agents = [
  { id: "research", label: "Research Synthesis", icon: FlaskConical, color: "text-blue-600 bg-blue-100 border-blue-200", desc: "Clusters insights from source materials into evidence-linked findings" },
  { id: "problems", label: "Problem Framing", icon: Target, color: "text-rose-600 bg-rose-100 border-rose-200", desc: "Converts research into clear problem statements with How Might We questions" },
  { id: "strategy", label: "UX Strategy", icon: Lightbulb, color: "text-amber-600 bg-amber-100 border-amber-200", desc: "Generates evidence-linked UX recommendations with effort and impact scores" },
  { id: "journeys", label: "Journey & Flow", icon: Route, color: "text-indigo-600 bg-indigo-100 border-indigo-200", desc: "Maps current and future state user journeys with emotion curves" },
  { id: "features", label: "Feature Prioritization", icon: Star, color: "text-emerald-600 bg-emerald-100 border-emerald-200", desc: "RICE-scored backlog with MoSCoW prioritization by phase" },
  { id: "tasks", label: "Task Orchestration", icon: ListChecks, color: "text-teal-600 bg-teal-100 border-teal-200", desc: "Generates team-ready tasks with user stories and acceptance criteria" },
];

export default function ProjectAnalyzePage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: project } = useGetProject(projectId);
  const runAnalysis = useRunAnalysis();

  const [selected, setSelected] = useState<Set<string>>(new Set(["research", "problems", "strategy", "journeys", "features", "tasks"]));
  const [billingRequired, setBillingRequired] = useState(false);
  const [providerSetupRequired, setProviderSetupRequired] = useState(false);
  const [result, setResult] = useState<{ agentsRun: string[]; insightsGenerated: number; problemsGenerated: number; recommendationsGenerated: number; featuresGenerated: number; tasksGenerated: number; message: string } | null>(null);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleRun = () => {
    setResult(null);
    setBillingRequired(false);
    setProviderSetupRequired(false);
    runAnalysis.mutate(
      { id: projectId, data: { agentTypes: Array.from(selected) } },
      {
        onSuccess: (data: typeof result) => {
          setBillingRequired(false);
          setProviderSetupRequired(false);
          trackEvent("analysis_completed", {
            agent_count: selected.size,
            all_agents: selected.size === agents.length,
            insights_generated: data?.insightsGenerated ?? 0,
            problems_generated: data?.problemsGenerated ?? 0,
            recommendations_generated: data?.recommendationsGenerated ?? 0,
            features_generated: data?.featuresGenerated ?? 0,
            tasks_generated: data?.tasksGenerated ?? 0,
          });
          setResult(data);
          void qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Analysis complete", description: data?.message ?? "Agents finished running." });
        },
        onError: (error: unknown) => {
          trackEvent("analysis_failed", { agent_count: selected.size });
          const apiData = error && typeof error === "object" && "data" in error
            ? (error as { data?: { error?: string; code?: string } }).data
            : undefined;
          const status = error && typeof error === "object" && "status" in error
            ? (error as { status?: number }).status
            : undefined;
          const creditsExhausted = apiData?.code === "ai_credits_exhausted";
          setBillingRequired(creditsExhausted);
          setProviderSetupRequired(apiData?.code === "ai_provider_not_configured");
          void qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({
            title: creditsExhausted ? "OpenAI API credits exhausted" : apiData?.code === "ai_provider_not_configured" ? "Gemini API setup required" : status === 429 ? "Daily analysis limit reached" : status === 503 ? "AI service unavailable" : "Analysis failed",
            description: apiData?.error ?? "AI analysis could not finish. No demonstration results were substituted. Please retry.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const isRunning = runAnalysis.isPending || project?.analysisStatus === "running";

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="mb-12 text-center max-w-3xl mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse-glow" />
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(24,147,247,0.2)] border border-primary/20 relative z-10 backdrop-blur-md">
              {isRunning ? (
                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
              ) : (
                <Brain className="w-12 h-12 text-primary" />
              )}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-4">Initialize AI Swarm</h1>
          <p className="text-muted-foreground text-lg leading-relaxed font-medium">Configure which agents to dispatch. They will analyze your source materials sequentially and construct the structured outputs for your pipeline.</p>
        </motion.div>

        {/* Agent selector grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-black text-muted-foreground uppercase tracking-widest font-mono">
              <span className="text-primary">{selected.size}</span> of {agents.length} agents selected
            </span>
            <button
              onClick={() => setSelected(selected.size === agents.length ? new Set() : new Set(agents.map(a => a.id)))}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20"
            >
              {selected.size === agents.length ? "Deselect Swarm" : "Select Full Swarm"}
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => !isRunning && toggle(agent.id)}
                className={`flex items-start gap-5 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  selected.has(agent.id)
                    ? "border-primary bg-primary/5 shadow-[0_8px_30px_rgba(24,147,247,0.12)] scale-[1.02]"
                    : "border-border/60 bg-card hover:border-border hover:shadow-md hover:-translate-y-1 glass-card"
                } ${isRunning ? "pointer-events-none opacity-60" : ""}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-transform duration-500 ${selected.has(agent.id) ? 'scale-110 rotate-3' : ''} ${agent.color}`}>
                  <agent.icon className="w-7 h-7" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-foreground text-lg tracking-tight">{agent.label}</span>
                    {isRunning && selected.has(agent.id) && (
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 shadow-none font-mono text-[10px] animate-pulse">Running</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">{agent.desc}</p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 mt-1 transition-all duration-300 ${
                  selected.has(agent.id) ? "bg-primary border-primary shadow-[0_0_15px_rgba(24,147,247,0.5)]" : "border-muted-foreground/30 bg-transparent"
                }`}>
                  {selected.has(agent.id) && <CheckCircle className="w-5 h-5 text-primary-foreground" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Run CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-2xl mx-auto text-center">
          <Button
            onClick={handleRun}
            disabled={selected.size === 0 || isRunning}
            className={`w-full font-black h-20 text-xl rounded-2xl transition-all duration-300 relative overflow-hidden group ${
              isRunning ? 'bg-secondary text-secondary-foreground shadow-none' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_40px_rgba(24,147,247,0.4)] hover:shadow-[0_0_60px_rgba(24,147,247,0.6)] hover:-translate-y-1'
            }`}
          >
            {!isRunning && <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />}
            
            {isRunning ? (
              <><Loader2 className="w-7 h-7 mr-4 animate-spin opacity-70" />Swarm Active: Processing Data Pipeline...</>
            ) : (
              <><PlayCircle className="w-7 h-7 mr-4" />Dispatch {selected.size} Agent{selected.size !== 1 ? "s" : ""}</>
            )}
          </Button>

          {providerSetupRequired && (
            <p role="alert" className="text-sm text-destructive mt-4 font-semibold">
              Gemini is selected but its API key needs to be configured in the backend. Create a free-tier key at{" "}
              <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Google AI Studio</a>, then add GEMINI_API_KEY to Vercel api-server Production settings. Do not paste keys into this site or GitHub.
            </p>
          )}
          {billingRequired && (
            <p role="alert" className="text-sm text-destructive mt-4 font-semibold">
              OpenAI API credits are exhausted. The application owner can restore service in{" "}
              <a href="https://platform.openai.com/settings/organization/billing/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">OpenAI API Billing</a>.
              Your project and source materials remain saved.
            </p>
          )}
          <p className="text-muted-foreground text-sm text-center mt-6 font-medium">
            Analysis runs synchronously. The agent swarm may require <span className="text-foreground font-bold font-mono bg-muted px-2 py-1 rounded">30–90s</span> depending on data volume.
          </p>
        </motion.div>

        {/* Results Banner */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: 20 }} 
              animate={{ opacity: 1, height: "auto", y: 0 }} 
              className="overflow-hidden mt-16"
            >
              <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-[0_10px_40px_rgba(16,185,129,0.1)] rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
                <CardContent className="p-8 md:p-10 relative z-10">
                  <div className="flex flex-col md:flex-row items-center gap-5 mb-10 text-center md:text-left">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 border border-emerald-500/30 shadow-sm">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-foreground tracking-tight">Swarm Execution Complete</h2>
                      <p className="text-muted-foreground font-medium mt-1 text-lg">The agents have successfully populated the pipeline.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
                    {[
                      { label: "Insights Generated", value: result.insightsGenerated },
                      { label: "Problems Framed", value: result.problemsGenerated },
                      { label: "Recommendations", value: result.recommendationsGenerated },
                      { label: "Features Scored", value: result.featuresGenerated },
                      { label: "Tasks Orchestrated", value: result.tasksGenerated },
                      { label: "Agents Executed", value: result.agentsRun.length },
                    ].map(item => (
                      <div key={item.label} className="p-5 rounded-2xl bg-background border border-emerald-500/20 shadow-sm flex flex-col items-center justify-center text-center group hover:border-emerald-500/40 transition-colors">
                        <div className="text-4xl font-black text-emerald-600 font-mono tracking-tighter mb-2 group-hover:scale-110 transition-transform">{item.value}</div>
                        <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-800 dark:text-emerald-400 font-medium text-base">
                      Outputs are staged as pending. Review them in the pipeline to approve or edit.
                    </p>
                    <Link href={`/projects/${projectId}`} className="w-full sm:w-auto">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all">
                        Return to Hub <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
