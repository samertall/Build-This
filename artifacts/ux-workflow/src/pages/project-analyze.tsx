import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, FlaskConical, Target, Lightbulb, Route, Star, ListChecks, CheckCircle, Loader2, PlayCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useRunAnalysis, useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const [result, setResult] = useState<{ agentsRun: string[]; insightsGenerated: number; problemsGenerated: number; recommendationsGenerated: number; featuresGenerated: number; tasksGenerated: number; message: string } | null>(null);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleRun = () => {
    runAnalysis.mutate(
      { id: projectId, data: { agentTypes: Array.from(selected) } },
      {
        onSuccess: (data: typeof result) => {
          setResult(data);
          void qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Analysis complete", description: data?.message ?? "Agents finished running." });
        },
        onError: () => toast({ title: "Analysis failed", description: "An error occurred during analysis. Please try again.", variant: "destructive" }),
      }
    );
  };

  const isRunning = runAnalysis.isPending || project?.analysisStatus === "running";

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">AI Agent Analysis</h1>
          <p className="text-muted-foreground text-base leading-relaxed">Select which agents to initialize. Each agent analyzes your source materials and generates structured outputs for your UX pipeline.</p>
        </motion.div>

        {/* Agent selector grid */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{selected.size} of {agents.length} agents selected</span>
            <button
              onClick={() => setSelected(selected.size === agents.length ? new Set() : new Set(agents.map(a => a.id)))}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {selected.size === agents.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                onClick={() => !isRunning && toggle(agent.id)}
                className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                  selected.has(agent.id)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-border/80 hover:shadow-md"
                } ${isRunning ? "pointer-events-none opacity-60" : ""}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${agent.color}`}>
                  <agent.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-foreground text-base">{agent.label}</span>
                    {isRunning && selected.has(agent.id) && (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{agent.desc}</p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 mt-1 transition-colors ${
                  selected.has(agent.id) ? "bg-primary border-primary" : "border-muted-foreground/30 bg-transparent"
                }`}>
                  {selected.has(agent.id) && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Run CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-xl mx-auto">
          <Button
            onClick={handleRun}
            disabled={selected.size === 0 || isRunning}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 text-lg shadow-lg hover-elevate transition-all"
          >
            {isRunning ? (
              <><Loader2 className="w-6 h-6 mr-3 animate-spin" />Processing Data Pipeline...</>
            ) : (
              <><PlayCircle className="w-6 h-6 mr-3" />Initialize {selected.size} Agent{selected.size !== 1 ? "s" : ""}</>
            )}
          </Button>

          <p className="text-muted-foreground text-sm text-center mt-5 font-medium">
            Analysis runs synchronously. This may take <span className="text-foreground">30–90 seconds</span> depending on data volume and selected agents.
          </p>
        </motion.div>

        {/* Results Banner */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }} 
              animate={{ opacity: 1, height: "auto", marginTop: 48 }} 
              className="overflow-hidden"
            >
              <Card className="border-emerald-200 bg-emerald-50/50 shadow-md">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">Analysis Complete</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: "Insights Generated", value: result.insightsGenerated },
                      { label: "Problems Framed", value: result.problemsGenerated },
                      { label: "Recommendations", value: result.recommendationsGenerated },
                      { label: "Features Scored", value: result.featuresGenerated },
                      { label: "Tasks Orchestrated", value: result.tasksGenerated },
                      { label: "Agents Executed", value: result.agentsRun.length },
                    ].map(item => (
                      <div key={item.label} className="p-4 rounded-xl bg-background border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="text-3xl font-bold text-emerald-700 font-mono mb-1">{item.value}</div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-emerald-100/50 border border-emerald-200">
                    <p className="text-emerald-800 font-medium text-sm">
                      Outputs are marked as pending. Review them in the pipeline to approve or edit.
                    </p>
                    <Link href={`/projects/${projectId}`}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold whitespace-nowrap">
                        Return to Hub <ArrowRight className="w-4 h-4 ml-2" />
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
