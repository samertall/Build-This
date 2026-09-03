import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Presentation, Plus, Loader2, Layers, FileText, CheckCircle, Target, Lightbulb, Users, TrendingUp, Layout, List, Download, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import {
  exportPresentationPdf,
  exportPresentationPptx,
  useListPresentations,
  useGeneratePresentation,
  getListPresentationsQueryKey,
  type Presentation as PresentationModel,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ReviewThread } from "@/components/review-thread";
import { renderSlideContent } from "@/lib/presentation-content";
import type { SlideContent } from "@/lib/presentation-order";

const presentationTypes = ["project-pitch", "ux-review", "stakeholder-update", "design-brief", "research-summary"];
const audienceTypes = ["stakeholders", "developers", "designers", "executives", "clients", "cross-functional"];

type Slide = { id: number; title: string; layout: string; content: SlideContent; sectionOrder?: string[] };

const layoutIcons: Record<string, React.ElementType> = {
  cover: Layout,
  problem: Target,
  insight: Lightbulb,
  recommendation: TrendingUp,
  journey: Users,
  features: List,
  tasks: CheckCircle,
  conclusion: CheckCircle,
};

type ExportFormat = "pptx" | "pdf";
type ExportState = { format: ExportFormat; status: "preparing" | "failed"; message?: string } | null;

function exportFileName(title: string, format: ExportFormat): string {
  const base = title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "presentation";
  return `${base}.${format}`;
}

function ExportButtons({ projectId, presentation }: { projectId: number; presentation: PresentationModel }) {
  const { toast } = useToast();
  const [exportState, setExportState] = useState<ExportState>(null);

  const download = async (format: ExportFormat) => {
    setExportState({ format, status: "preparing" });
    try {
      const blob = format === "pptx"
        ? await exportPresentationPptx(projectId, presentation.id)
        : await exportPresentationPdf(projectId, presentation.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFileName(presentation.title, format);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportState(null);
      toast({
        title: `${format.toUpperCase()} downloaded`,
        description: `${presentation.title} is ready to share outside Build-This.`,
      });
    } catch {
      const message = `We couldn't prepare the ${format.toUpperCase()} file. Please try again.`;
      setExportState({ format, status: "failed", message });
      toast({ title: "Export failed", description: message, variant: "destructive" });
    }
  };

  const busyFormat = exportState?.status === "preparing" ? exportState.format : null;

  return (
    <div className="flex flex-col items-stretch gap-2">
      <div className="flex flex-wrap gap-2">
        {(["pptx", "pdf"] as const).map((format) => (
          <Button
            key={format}
            type="button"
            variant={format === "pptx" ? "default" : "outline"}
            className="h-10 rounded-xl font-black"
            disabled={busyFormat !== null}
            onClick={() => void download(format)}
          >
            {busyFormat === format
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Download className="w-4 h-4 mr-2" />}
            {busyFormat === format ? `Preparing ${format.toUpperCase()}…` : `Download ${format.toUpperCase()}`}
          </Button>
        ))}
      </div>
      {exportState?.status === "failed" && (
        <p role="alert" className="text-xs font-bold text-destructive">{exportState.message}</p>
      )}
    </div>
  );
}

export function DeckViewer({ projectId, presentation, onClose }: { projectId: number; presentation: PresentationModel; onClose: () => void }) {
  const slides = (presentation.slides ?? []) as unknown as Slide[];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
       <style>{`
        @media print {
          body * { visibility: hidden; }
          #deck-print-area, #deck-print-area * { visibility: visible; }
          #deck-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            margin: 0;
            padding: 0;
            background: white;
            --background: 0 0% 100%;
            --foreground: 215 50% 15%;
            --muted: 212 30% 94%;
            --muted-foreground: 215 25% 45%;
            --card: 0 0% 100%;
            --card-foreground: 215 50% 15%;
            --border: 212 30% 88%;
            --primary: 207 93% 53%;
            --primary-foreground: 0 0% 100%;
          }
          .slide-container { page-break-after: always; width: 100vw; height: 100vh; border: none !important; border-radius: 0 !important; box-shadow: none !important; background: white !important; display: flex; flex-direction: column; justify-content: center; margin: 0; }
          @page { size: landscape; margin: 0; }
        }
      `}</style>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-card p-4 rounded-2xl border border-border shadow-sm mb-8">
         <div className="flex items-center gap-4">
           <Button onClick={onClose} variant="ghost" className="h-10 rounded-xl font-bold"><ChevronLeft className="w-5 h-5 mr-1"/> Back</Button>
           <div className="h-6 w-px bg-border hidden sm:block" />
           <h2 className="text-xl font-black text-foreground tracking-tight">{presentation.title}</h2>
         </div>
         <ExportButtons projectId={projectId} presentation={presentation} />
      </div>

      <div id="deck-print-area" className="flex flex-col gap-12 bg-muted/10 p-4 sm:p-8 lg:p-12 rounded-[2.5rem] border border-border/50">
        {slides.length === 0 && <p className="text-center py-20 text-muted-foreground font-bold">No slides generated yet.</p>}
        {slides.map((slide: any, i: number) => {
          const Icon = layoutIcons[slide.layout?.toLowerCase()] ?? FileText;
          return (
            <div key={i} className="slide-container aspect-[16/9] w-full max-w-5xl mx-auto bg-card border-2 border-border shadow-2xl rounded-3xl p-10 md:p-16 flex flex-col relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />
               <div className="flex items-center gap-4 mb-8 md:mb-12 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                     <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-black text-muted-foreground uppercase tracking-widest block mb-1">Slide {i + 1} &bull; {slide.layout}</span>
                  </div>
               </div>
               <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tighter mb-10 md:mb-14 leading-tight relative z-10">{slide.title}</h2>
               <div className="flex-1 overflow-y-auto print:overflow-visible relative z-10">
                  {renderSlideContent(slide.content, slide.layout, true, slide.sectionOrder)}
               </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/**
 * Test-only route used by the browser release check. It deliberately fetches
 * the same list endpoint as the production page and hands the returned model
 * to the production DeckViewer, while avoiding an external Clerk session.
 */
export function PresentationOrderTestPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0");
  const [presentation, setPresentation] = useState<PresentationModel | null>(null);
  const [viewingDeck, setViewingDeck] = useState<PresentationModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/projects/${projectId}/presentations`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Presentation request failed (${response.status})`);
        return response.json() as Promise<PresentationModel[]>;
      })
      .then((items) => {
        if (!cancelled) setPresentation(items[0] ?? null);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load presentation");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (viewingDeck) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <DeckViewer
          projectId={projectId}
          presentation={viewingDeck}
          onClose={() => setViewingDeck(null)}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      <h1 className="text-4xl font-black text-foreground tracking-tighter">Presentations</h1>
      {error && <p role="alert" className="mt-6 text-destructive">{error}</p>}
      {!error && !presentation && (
        <p className="mt-6 text-muted-foreground">Loading presentation…</p>
      )}
      {presentation && (
        <div className="mt-8 max-w-5xl rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-black text-foreground">{presentation.title}</h2>
          <Button
            type="button"
            className="mt-6 h-12 rounded-xl font-bold"
            onClick={() => setViewingDeck(presentation)}
          >
            <Layers className="mr-2 h-5 w-5" />
            View Stakeholder Deck
          </Button>
        </div>
      )}
    </main>
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

  const [viewingDeck, setViewingDeck] = useState<PresentationModel | null>(null);

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

  if (viewingDeck) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
          <DeckViewer projectId={projectId} presentation={viewingDeck} onClose={() => setViewingDeck(null)} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">Presentations</h1>
            <p className="text-muted-foreground text-base mt-2 max-w-xl font-semibold leading-relaxed">
              Generate stakeholder-ready slide decks from your approved project outputs. Each slide shows structured content from your analysis pipeline.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-[0_4px_20px_rgba(24,147,247,0.3)] h-12 px-6 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />Generate Deck
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-3xl p-8">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl text-foreground font-black tracking-tighter">Generate Deck</DialogTitle>
                <DialogDescription className="font-semibold text-muted-foreground">Configure the focus and audience for your slide deck.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block text-sm font-black text-foreground">Title <span className="text-destructive">*</span></Label>
                  <Input value={form.title} onChange={e => up("title", e.target.value)} placeholder="e.g. Q3 UX Strategy Review" className="bg-background/50 border-border h-12 rounded-xl text-base font-semibold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-black text-foreground">Type</Label>
                    <Select value={form.presentationType} onValueChange={v => up("presentationType", v)}>
                      <SelectTrigger className="bg-background/50 border-border h-12 rounded-xl font-semibold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        {presentationTypes.map(t => <SelectItem key={t} value={t} className="capitalize font-semibold">{t.replace(/-/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-black text-foreground">Audience</Label>
                    <Select value={form.audience} onValueChange={v => up("audience", v)}>
                      <SelectTrigger className="bg-background/50 border-border h-12 rounded-xl font-semibold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        {audienceTypes.map(a => <SelectItem key={a} value={a} className="capitalize font-semibold">{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-black text-foreground">Number of slides</Label>
                  <Select value={form.slideCount} onValueChange={v => up("slideCount", v)}>
                    <SelectTrigger className="bg-background/50 border-border h-12 rounded-xl font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      {[5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)} className="font-semibold">{n} slides max</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-2">
                  <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground font-bold h-11 rounded-xl">Cancel</Button>
                  <Button onClick={handleGenerate} disabled={!form.title.trim() || generate.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 h-11 rounded-xl shadow-md">
                    {generate.isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</> : "Generate"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            {[1, 2].map(i => (
              <div key={i} className="p-6 rounded-3xl border border-border bg-card">
                <div className="flex gap-5 items-center">
                  <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !presentations || presentations.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-dashed border-2 border-border/80 bg-card/40 shadow-none max-w-3xl mx-auto rounded-3xl">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                  <Presentation className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">No presentations yet</h3>
                <p className="text-muted-foreground text-base mb-3 max-w-md font-semibold leading-relaxed">
                  Generate a slide deck summarizing your approved insights, problems, recommendations, and features.
                </p>
                <p className="text-muted-foreground/60 text-xs mb-10 max-w-sm font-bold uppercase tracking-widest font-mono">
                  Tip: Run your analysis pipeline and approve outputs first.
                </p>
                <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-[0_4px_20px_rgba(24,147,247,0.3)] px-8 h-12 rounded-full">
                  <Plus className="w-5 h-5 mr-2" />Generate First Presentation
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {presentations.map((pres, i) => (
              <motion.div key={pres.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                <Card className={`border-border bg-card overflow-hidden transition-all duration-300 rounded-3xl shadow-sm hover:shadow-md group`}>
                  <div
                    className="p-6 sm:p-8 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                    onClick={() => setViewingDeck(pres)}
                  >
                    <div className="flex items-start gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(24,147,247,0.2)]`}>
                        <Presentation className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight mb-3 group-hover:text-primary transition-colors">{pres.title}</h3>
                        <div className="flex gap-2 flex-wrap items-center">
                          {pres.presentationType && (
                            <Badge variant="secondary" className="font-mono text-[10px] font-black uppercase tracking-widest capitalize">{pres.presentationType?.replace(/-/g, " ")}</Badge>
                          )}
                          {pres.audience && (
                            <Badge variant="secondary" className="font-mono text-[10px] font-black uppercase tracking-widest capitalize">{pres.audience}</Badge>
                          )}
                          <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-0 font-mono text-[10px] font-black uppercase tracking-widest shadow-none">
                            {pres.slideCount} slides
                          </Badge>
                           <ReviewThread projectId={projectId} itemType="presentation" itemId={pres.id} label="Comments" />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="lg"
                      className={`shrink-0 transition-all h-12 rounded-xl font-bold border-border text-foreground hover:bg-muted group-hover:border-primary/50 group-hover:bg-primary/5`}
                      onClick={(e) => { e.stopPropagation(); setViewingDeck(pres); }}
                    >
                      <Layers className="w-5 h-5 mr-2 text-primary" />
                      View Stakeholder Deck
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
