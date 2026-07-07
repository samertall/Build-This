import { useState } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Plus, Trash2, Globe, FileText, Link2, Loader2, AlertTriangle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListProjectSources, useAddProjectSource, useDeleteProjectSource, getListProjectSourcesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const sourceTypes = ["research_note", "interview", "analytics", "competitor", "heuristic", "user_feedback", "seo_audit", "stakeholder_input", "url", "other"];
const classifications = ["user_research", "business_context", "technical_constraint", "competitive_analysis", "design_reference", "content_audit", "analytics_data", "stakeholder_requirement"];

function TypeIcon({ type }: { type: string }) {
  if (type === "url") return <Globe className="w-4 h-4 text-cyan-400" />;
  if (type === "interview") return <FileText className="w-4 h-4 text-purple-400" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

export default function ProjectSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: sources, isLoading } = useListProjectSources(projectId);
  const addSource = useAddProjectSource();
  const deleteSource = useDeleteProjectSource();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "research_note", name: "", content: "", url: "", classification: "" });
  const up = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleAdd = () => {
    addSource.mutate(
      { projectId, data: { type: form.type, name: form.name, content: form.content || undefined, url: form.url || undefined, classification: form.classification || undefined } },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: getListProjectSourcesQueryKey(projectId) });
          setForm({ type: "research_note", name: "", content: "", url: "", classification: "" });
          setOpen(false);
          toast({ title: "Source added" });
        },
        onError: () => toast({ title: "Error", description: "Failed to add source.", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (sourceId: number) => {
    deleteSource.mutate(
      { projectId, sourceId },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: getListProjectSourcesQueryKey(projectId) });
          toast({ title: "Source removed" });
        },
      }
    );
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Source Hub</h1>
            <p className="text-muted-foreground text-sm mt-1">Add research materials, URLs, and notes for AI analysis</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
                <Plus className="w-4 h-4 mr-2" />Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add Source Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="mb-2 block text-foreground">Name <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={e => up("name", e.target.value)} placeholder="e.g. User interview with Sarah M." className="bg-input border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-2 block text-foreground">Type</Label>
                    <Select value={form.type} onValueChange={v => up("type", v)}>
                      <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{sourceTypes.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-foreground">Classification</Label>
                    <Select value={form.classification} onValueChange={v => up("classification", v)}>
                      <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{classifications.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-foreground">URL (optional)</Label>
                  <Input value={form.url} onChange={e => up("url", e.target.value)} placeholder="https://..." className="bg-input border-border" />
                </div>
                <div>
                  <Label className="mb-2 block text-foreground">Content / Notes</Label>
                  <Textarea value={form.content} onChange={e => up("content", e.target.value)} rows={5} placeholder="Paste research notes, findings, observations..." className="bg-input border-border resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
                  <Button onClick={handleAdd} disabled={!form.name.trim() || addSource.isPending} className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
                    {addSource.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Source"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : !sources || sources.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-400/10 flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-sky-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No sources yet</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-xs">Add research notes, interview transcripts, competitor reviews, analytics reports, or any URLs you want the AI agents to analyze.</p>
              <Button onClick={() => setOpen(true)} className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
                <Plus className="w-4 h-4 mr-2" />Add First Source
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sources.map((source, i) => (
              <motion.div key={source.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="border-border bg-card hover:border-border/80 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TypeIcon type={source.type ?? "other"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-foreground text-sm">{source.name}</span>
                          <Badge variant="outline" className="border-border text-xs text-muted-foreground capitalize">{(source.type ?? "other").replace("_", " ")}</Badge>
                          {source.classification && (
                            <Badge className="bg-cyan-400/10 text-cyan-400 border-cyan-400/20 text-xs">{source.classification.replace(/_/g, " ")}</Badge>
                          )}
                        </div>
                        {source.url && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Link2 className="w-3 h-3" />
                            <span className="truncate">{source.url}</span>
                          </div>
                        )}
                        {source.content && (
                          <p className="text-muted-foreground text-xs line-clamp-2 mt-1">{source.content}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => handleDelete(source.id)}
                        disabled={deleteSource.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
