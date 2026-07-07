import { useParams } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { Presentation, Plus, Loader2, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListPresentations, useGeneratePresentation, getListPresentationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const presentationTypes = ["project-pitch", "ux-review", "stakeholder-update", "design-brief", "research-summary"];
const audienceTypes = ["stakeholders", "developers", "designers", "executives", "clients", "cross-functional"];

type Slide = { id: number; title: string; layout: string; content: Record<string, unknown> };

function SlidePreview({ slide }: { slide: Slide }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-cyan-400/10 flex items-center justify-center text-xs font-bold text-cyan-400">{slide.id}</div>
          <span className="font-medium text-foreground text-sm">{slide.title}</span>
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">{slide.layout}</Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="p-3 bg-card">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-48">
            {JSON.stringify(slide.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ProjectPresentationsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: presentations, isLoading } = useListPresentations(projectId);
  const generate = useGeneratePresentation();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    presentationType: "project-pitch",
    audience: "stakeholders",
    slideCount: "9",
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const up = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleGenerate = () => {
    generate.mutate(
      {
        projectId,
        data: {
          title: form.title,
          presentationType: form.presentationType,
          audience: form.audience,
          slideCount: parseInt(form.slideCount),
        },
      },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: getListPresentationsQueryKey(projectId) });
          setOpen(false);
          toast({ title: "Presentation generated", description: "Your slide deck is ready to preview." });
        },
        onError: () => toast({ title: "Error", description: "Failed to generate presentation.", variant: "destructive" }),
      }
    );
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Presentations</h1>
            <p className="text-muted-foreground text-sm mt-1">Generate stakeholder-ready slide decks from your approved project outputs.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
                <Plus className="w-4 h-4 mr-2" />Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Generate Presentation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="mb-2 block text-foreground">Title <span className="text-destructive">*</span></Label>
                  <Input value={form.title} onChange={e => up("title", e.target.value)} placeholder="e.g. Q3 UX Strategy Review" className="bg-input border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-2 block text-foreground">Type</Label>
                    <Select value={form.presentationType} onValueChange={v => up("presentationType", v)}>
                      <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{presentationTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/-/g, " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-foreground">Audience</Label>
                    <Select value={form.audience} onValueChange={v => up("audience", v)}>
                      <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{audienceTypes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-foreground">Number of slides (max 10)</Label>
                  <Select value={form.slideCount} onValueChange={v => up("slideCount", v)}>
                    <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n} slides</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
                  <Button onClick={handleGenerate} disabled={!form.title.trim() || generate.isPending} className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
                    {generate.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : "Generate"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : !presentations || presentations.length === 0 ? (
          <Card className="border-dashed border-border bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-pink-400/10 flex items-center justify-center mb-4">
                <Presentation className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No presentations yet</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-xs">Generate a slide deck from your approved insights, problems, recommendations, and features.</p>
              <Button onClick={() => setOpen(true)} className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
                <Plus className="w-4 h-4 mr-2" />Generate First Presentation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {presentations.map((pres, i) => {
              const slides = (pres.slides as Slide[]) ?? [];
              const isExp = expandedId === pres.id;
              return (
                <motion.div key={pres.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground">{pres.title}</CardTitle>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {pres.presentationType && (
                              <Badge variant="outline" className="border-border text-muted-foreground text-xs capitalize">{pres.presentationType?.replace(/-/g, " ")}</Badge>
                            )}
                            {pres.audience && (
                              <Badge variant="outline" className="border-border text-muted-foreground text-xs capitalize">{pres.audience}</Badge>
                            )}
                            <Badge className="bg-green-400/15 text-green-400 border-green-400/20 text-xs">
                              {pres.slideCount} slides
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => setExpandedId(isExp ? null : pres.id)}
                          className="border-border text-muted-foreground hover:text-foreground flex-shrink-0"
                        >
                          <Layers className="w-3.5 h-3.5 mr-1.5" />
                          {isExp ? "Hide" : "View"} slides
                        </Button>
                      </div>
                    </CardHeader>
                    {isExp && (
                      <CardContent className="pt-0">
                        <div className="space-y-2 mt-2">
                          {slides.map(slide => <SlidePreview key={slide.id} slide={slide} />)}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
