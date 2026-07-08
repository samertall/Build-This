import { useParams } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Presentation, Plus, Loader2, Layers, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useListPresentations, useGeneratePresentation, getListPresentationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const presentationTypes = ["project-pitch", "ux-review", "stakeholder-update", "design-brief", "research-summary"];
const audienceTypes = ["stakeholders", "developers", "designers", "executives", "clients", "cross-functional"];

type Slide = { id: number; title: string; layout: string; content: Record<string, unknown> };

function SlidePreview({ slide, index }: { slide: Slide; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-border rounded-lg overflow-hidden group bg-card"
    >
      <button
        className="w-full flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-xs font-mono font-bold text-secondary-foreground shadow-sm">
            {slide.id}
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm leading-none mb-1.5">{slide.title}</div>
            <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground uppercase tracking-wider">{slide.layout}</Badge>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-background transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-border bg-muted/10">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-64 p-3 bg-background rounded-md border border-border/50 shadow-inner">
                {JSON.stringify(slide.content, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
        id: projectId,
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
          setForm({ title: "", presentationType: "project-pitch", audience: "stakeholders", slideCount: "9" });
          toast({ title: "Presentation generated", description: "Your slide deck is ready to preview." });
        },
        onError: () => toast({ title: "Error", description: "Failed to generate presentation.", variant: "destructive" }),
      }
    );
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Presentations</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl leading-relaxed">
              Generate stakeholder-ready slide decks from your approved project outputs.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm h-10 px-5">
                <Plus className="w-4 h-4 mr-2" />Generate Deck
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl text-foreground font-bold tracking-tight">Generate Presentation</DialogTitle>
                <DialogDescription>Configure the focus and audience for your slide deck.</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-foreground">Title <span className="text-destructive">*</span></Label>
                  <Input value={form.title} onChange={e => up("title", e.target.value)} placeholder="e.g. Q3 UX Strategy Review" className="bg-background border-border h-10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-semibold text-foreground">Type</Label>
                    <Select value={form.presentationType} onValueChange={v => up("presentationType", v)}>
                      <SelectTrigger className="bg-background border-border h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {presentationTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/-/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-semibold text-foreground">Audience</Label>
                    <Select value={form.audience} onValueChange={v => up("audience", v)}>
                      <SelectTrigger className="bg-background border-border h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {audienceTypes.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-semibold text-foreground">Number of slides</Label>
                  <Select value={form.slideCount} onValueChange={v => up("slideCount", v)}>
                    <SelectTrigger className="bg-background border-border h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n} slides max</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
                  <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                  <Button onClick={handleGenerate} disabled={!form.title.trim() || generate.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm">
                    {generate.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : "Generate"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-4 items-start">
                <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !presentations || presentations.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-dashed border-border bg-muted/30 shadow-none max-w-3xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm">
                  <Presentation className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">No presentations yet</h3>
                <p className="text-muted-foreground text-sm mb-8 max-w-sm leading-relaxed">
                  Generate a slide deck summarizing your approved insights, problems, recommendations, and features.
                </p>
                <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md px-6 h-11">
                  <Plus className="w-4 h-4 mr-2" />Generate First Presentation
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {presentations.map((pres, i) => {
              const slides = (pres.slides as unknown as Slide[]) ?? [];
              const isExp = expandedId === pres.id;
              return (
                <motion.div key={pres.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                  <Card className={`border-border bg-card overflow-hidden transition-all duration-300 ${isExp ? 'shadow-md ring-1 ring-primary/20' : 'shadow-sm hover:shadow-md'}`}>
                    <div 
                      className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      onClick={() => setExpandedId(isExp ? null : pres.id)}
                    >
                      <div className="flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isExp ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">{pres.title}</h3>
                          <div className="flex gap-2 flex-wrap items-center">
                            {pres.presentationType && (
                              <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider capitalize text-secondary-foreground">{pres.presentationType?.replace(/-/g, " ")}</Badge>
                            )}
                            {pres.audience && (
                              <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider capitalize text-secondary-foreground">{pres.audience}</Badge>
                            )}
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-mono text-[10px] uppercase tracking-wider ml-1">
                              {pres.slideCount} slides
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant={isExp ? "default" : "outline"}
                        className={`shrink-0 transition-all ${isExp ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent border-border"}`}
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExp ? null : pres.id); }}
                      >
                        <Layers className="w-4 h-4 mr-2" />
                        {isExp ? "Close Deck" : "View Slides"}
                      </Button>
                    </div>
                    
                    <AnimatePresence>
                      {isExp && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border bg-muted/20"
                        >
                          <div className="p-5 sm:p-6 space-y-3">
                            <h4 className="text-sm font-semibold text-foreground mb-4 tracking-tight flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                              Slide Content Preview
                            </h4>
                            {slides.map((slide, sIdx) => <SlidePreview key={slide.id} slide={slide} index={sIdx} />)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
