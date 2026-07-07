import { useState } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Brain, FlaskConical, Target, Lightbulb, Route, Star, ListChecks, CheckCircle, Loader2, AlertTriangle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useRunAnalysis, useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const agents = [
  { id: "research", label: "Research Synthesis", icon: FlaskConical, color: "text-blue-400 bg-blue-400/10", desc: "Clusters insights from source materials into evidence-linked findings" },
  { id: "problems", label: "Problem Framing", icon: Target, color: "text-purple-400 bg-purple-400/10", desc: "Converts research into clear problem statements with How Might We questions" },
  { id: "strategy", label: "UX Strategy", icon: Lightbulb, color: "text-teal-400 bg-teal-400/10", desc: "Generates evidence-linked UX recommendations with effort and impact scores" },
  { id: "journeys", label: "Journey & Flow", icon: Route, color: "text-indigo-400 bg-indigo-400/10", desc: "Maps current and future state user journeys with emotion curves" },
  { id: "features", label: "Feature Prioritization", icon: Star, color: "text-orange-400 bg-orange-400/10", desc: "RICE-scored backlog with MoSCoW prioritization by phase" },
  { id: "tasks", label: "Task Orchestration", icon: ListChecks, color: "text-green-400 bg-green-400/10", desc: "Generates team-ready tasks with user stories and acceptance criteria" },
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
      { projectId, data: { agentTypes: Array.from(selected) } },
      {
        onSuccess: (data: typeof result) => {
          setResult(data);
          void qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Analysis complete", description: data?.message ?? "" });
        },
        onError: () => toast({ title: "Analysis failed", description: "Check your API key and try again.", variant: "destructive" }),
      }
    );
  };

  const isRunning = runAnalysis.isPending || project?.analysisStatus === "running";

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">AI Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">Select which agents to run. Each agent analyzes your source materials and generates structured outputs.</p>
        </motion.div>

        {/* Agent selector */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">{selected.size}/{agents.length} agents selected</span>
            <button
              onClick={() => setSelected(selected.size === agents.length ? new Set() : new Set(agents.map(a => a.id)))}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {selected.size === agents.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => !isRunning && toggle(agent.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                selected.has(agent.id)
                  ? "border-cyan-400/40 bg-cyan-400/5"
                  : "border-border bg-card hover:border-border/80"
              } ${isRunning ? "pointer-events-none opacity-60" : ""}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${agent.color}`}>
                <agent.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground text-sm">{agent.label}</span>
                  {isRunning && selected.has(agent.id) && (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  )}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{agent.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 mt-0.5 transition-colors ${
                selected.has(agent.id) ? "bg-cyan-500 border-cyan-500" : "border-border bg-transparent"
              }`}>
                {selected.has(agent.id) && <CheckCircle className="w-3 h-3 text-[hsl(222,47%,8%)]" />}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Run button */}
        <Button
          onClick={handleRun}
          disabled={selected.size === 0 || isRunning}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold h-12 text-base"
        >
          {isRunning ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Agents running — this may take 30–90 seconds...</>
          ) : (
            <><PlayCircle className="w-5 h-5 mr-2" />Run {selected.size} Agent{selected.size !== 1 ? "s" : ""}</>
          )}
        </Button>

        <p className="text-muted-foreground text-xs text-center mt-3">
          Analysis runs synchronously via OpenAI gpt-4o-mini. This may take 30–90 seconds depending on selected agents.
        </p>

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <Card className="border-green-400/20 bg-green-400/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-foreground">Analysis Complete</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Insights", value: result.insightsGenerated },
                    { label: "Problems", value: result.problemsGenerated },
                    { label: "Recommendations", value: result.recommendationsGenerated },
                    { label: "Features", value: result.featuresGenerated },
                    { label: "Tasks", value: result.tasksGenerated },
                    { label: "Agents run", value: result.agentsRun.length },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-card border border-border">
                      <div className="text-2xl font-bold text-foreground">{item.value}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm mt-4">All outputs are marked as pending and await your approval. Navigate to Insights, Problems, and Recommendations to review them.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
