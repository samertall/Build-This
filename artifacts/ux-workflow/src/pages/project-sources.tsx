import { useState } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Plus, Trash2, Globe, FileText, Link2, Loader2, Database, Search } from "lucide-react";
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
import { trackEvent } from "@/lib/analytics";

const sourceTypes = ["research_note", "interview", "analytics", "competitor", "heuristic", "user_feedback", "seo_audit", "stakeholder_input", "url", "other"];
const classifications = ["user_research", "business_context", "technical_constraint", "competitive_analysis", "design_reference", "content_audit", "analytics_data", "stakeholder_requirement"];

function TypeIcon({ type }: { type: string }) {
  if (type === "url") return <Globe className="w-5 h-5 text-sky-600" />;
  if (type === "interview" || type === "user_feedback") return <FileText className="w-5 h-5 text-violet-600" />;
  if (type === "analytics" || type === "seo_audit") return <Search className="w-5 h-5 text-emerald-600" />;
  return <FileText className="w-5 h-5 text-muted-foreground" />;
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
  const [form, setForm] = useState({ type: "research_note", name: "", content: "", url: "", classification: "user_research" });
  const up = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleAdd = () => {
    addSource.mutate(
      { id: projectId, data: { type: form.type, name: form.name, content: form.content || undefined, url: form.url || undefined, classification: form.classification || undefined } },
      {
        onSuccess: () => {
          trackEvent("source_added", {
            source_type: form.type,
            classification: form.classification,
            has_url: Boolean(form.url),
            has_content: Boolean(form.content),
          });
          void qc.invalidateQueries({ queryKey: getListProjectSourcesQueryKey(projectId) });
          setForm({ type: "research_note", name: "", content: "", url: "", classification: "user_research" });
          setOpen(false);
          toast({ title: "Source added successfully" });
        },
        onError: () => toast({ title: "Error", description: "Failed to add source.", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (sourceId: number) => {
    deleteSource.mutate(
      { id: projectId, sourceId },
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
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Source Hub</h1>
            <p className="text-muted-foreground text-base mt-2">Add research materials, URLs, and notes for AI analysis</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover-elevate shrink-0 h-11 px-5">
                <Plus className="w-5 h-5 mr-2" />Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-card border-border shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">Add Source Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div>
                  <Label className="mb-2 block text-foreground font-medium">Name <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={e => up("name", e.target.value)} placeholder="e.g. User interview with Sarah M." className="bg-background border-border shadow-sm h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-foreground font-medium">Type</Label>
                    <Select value={form.type} onValueChange={v => up("type", v)}>
                      <SelectTrigger className="bg-background border-border shadow-sm h-11 capitalize"><SelectValue /></SelectTrigger>
                      <SelectContent>{sourceTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-foreground font-medium">Classification</Label>
                    <Select value={form.classification} onValueChange={v => up("classification", v)}>
                      <SelectTrigger className="bg-background border-border shadow-sm h-11 capitalize"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{classifications.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-foreground font-medium">URL (optional)</Label>
                  <Input value={form.url} onChange={e => up("url", e.target.value)} placeholder="https://..." className="bg-background border-border shadow-sm h-11" />
                </div>
                <div>
                  <Label className="mb-2 block text-foreground font-medium">Content / Notes</Label>
                  <Textarea value={form.content} onChange={e => up("content", e.target.value)} rows={6} placeholder="Paste research notes, findings, observations..." className="bg-background border-border resize-none shadow-sm text-base" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="border-border font-medium h-11 px-6">Cancel</Button>
                  <Button onClick={handleAdd} disabled={!form.name.trim() || addSource.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6">
                    {addSource.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {addSource.isPending ? "Adding..." : "Add Source"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : !sources || sources.length === 0 ? (
          <Card className="border-dashed border-2 border-border bg-transparent mt-8">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-sm">
                <Database className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">No sources yet</h3>
              <p className="text-muted-foreground text-base mb-8 max-w-md">Add research notes, interview transcripts, competitor reviews, analytics reports, or any URLs you want the AI agents to analyze.</p>
              <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover-elevate h-12 px-6 text-lg">
                <Plus className="w-5 h-5 mr-2" />Add First Source
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 mt-6">
            {sources.map((source, i) => (
              <motion.div key={source.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: "easeOut" }}>
                <Card className="border-border bg-card hover:border-primary/30 shadow-sm transition-all duration-200 group">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TypeIcon type={source.type ?? "other"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-bold text-foreground text-lg">{source.name}</span>
                          <Badge variant="secondary" className="font-mono text-xs capitalize">{(source.type ?? "other").replace(/_/g, " ")}</Badge>
                          {source.classification && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-mono text-xs capitalize">{source.classification.replace(/_/g, " ")}</Badge>
                          )}
                        </div>
                        {source.url && (
                          <div className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 hover:underline mb-3 w-fit transition-colors font-medium">
                            <Link2 className="w-4 h-4" />
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-sm">{source.url}</a>
                          </div>
                        )}
                        {source.content && (
                          <div className="bg-background rounded-lg border border-border p-3 mt-3">
                            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{source.content}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost" 
                        size="icon"
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(source.id)}
                        disabled={deleteSource.isPending}
                        title="Delete source"
                      >
                        <Trash2 className="w-5 h-5" />
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
