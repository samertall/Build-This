import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useCreateProject } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

const steps = ["Basics", "Objectives", "Audience", "Context", "Review"];

const productTypes = ["SaaS", "E-commerce", "Mobile App", "Enterprise Platform", "Content Site", "Marketplace", "Internal Tool", "Other"];
const industries = ["Technology", "Healthcare", "Finance", "Education", "Retail", "Media", "Government", "Real Estate", "Other"];
const stages = ["Discovery", "Definition", "Design", "Development", "Launch", "Post-launch"];

export default function NewProjectPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProject = useCreateProject();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    description: "",
    productType: "",
    industry: "",
    stage: "",
    businessGoals: "",
    targetUsers: "",
    constraints: "",
    additionalContext: "",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.businessGoals.trim().length > 0;
    return true;
  };

  const handleSubmit = () => {
    const extraContext = [
      form.constraints ? `Constraints & Limitations: ${form.constraints}` : "",
      form.additionalContext ? `Additional Context: ${form.additionalContext}` : "",
    ].filter(Boolean).join("\n\n");
    const combinedDescription = [form.description, extraContext].filter(Boolean).join("\n\n");

    createProject.mutate(
      { data: { name: form.name, description: combinedDescription || undefined, productType: form.productType || undefined, industry: form.industry || undefined, stage: form.stage || undefined, businessGoals: form.businessGoals || undefined, targetUsers: form.targetUsers || undefined } },
      {
        onSuccess: (project: { id: number }) => {
          trackEvent("project_created", {
            product_type: form.productType || "unspecified",
            industry: form.industry || "unspecified",
            stage: form.stage || "unspecified",
          });
          toast({ title: "Project created", description: "Your project is ready. Start by adding sources." });
          setLocation(`/projects/${project.id}`);
        },
        onError: (error: unknown) => {
          const status = error && typeof error === "object" && "status" in error
            ? (error as { status?: unknown }).status
            : undefined;
          const description = status === 401
            ? "Your session was not recognized by the API. Sign out and sign in again, then retry."
            : status === 400
              ? "One or more fields were rejected. Review your project details and try again."
              : status === 503
                ? "The project service is temporarily unavailable. Try again shortly."
                : typeof status === "number"
                  ? `The server returned HTTP ${status}. Your project was not confirmed as saved.`
                  : "The request could not reach the server. Check your connection and retry.";
          toast({
            title: status === 401 ? "Authentication required" : "Project creation failed",
            description,
            variant: "destructive",
          });
        },
      }
    );
  };

  const stepContent = [
    // Step 0: Basics
    <div key="step0" className="space-y-6">
      <div>
        <Label htmlFor="project-name" className="text-foreground mb-2 block font-bold">Project Name <span className="text-destructive">*</span></Label>
        <Input
          id="project-name"
          placeholder="e.g. Redesign of checkout flow for mobile app"
          value={form.name}
          onChange={e => update("name", e.target.value)}
          className="bg-background/50 border-border focus-visible:ring-primary shadow-sm h-12 text-base rounded-xl"
        />
      </div>
      <div>
        <Label htmlFor="project-description" className="text-foreground mb-2 block font-bold">Description</Label>
        <Textarea
          id="project-description"
          placeholder="Brief overview of the project scope and context"
          value={form.description}
          onChange={e => update("description", e.target.value)}
          rows={3}
          className="bg-background/50 border-border focus-visible:ring-primary resize-none shadow-sm rounded-xl text-base"
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <Label htmlFor="project-product-type" className="text-foreground mb-2 block font-bold">Product Type</Label>
          <Select value={form.productType} onValueChange={v => update("productType", v)}>
            <SelectTrigger id="project-product-type" className="bg-background/50 border-border shadow-sm h-12 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent className="rounded-xl border-border">{productTypes.map(t => <SelectItem key={t} value={t} className="rounded-lg">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="project-industry" className="text-foreground mb-2 block font-bold">Industry</Label>
          <Select value={form.industry} onValueChange={v => update("industry", v)}>
            <SelectTrigger id="project-industry" className="bg-background/50 border-border shadow-sm h-12 rounded-xl"><SelectValue placeholder="Select industry" /></SelectTrigger>
            <SelectContent className="rounded-xl border-border">{industries.map(i => <SelectItem key={i} value={i} className="rounded-lg">{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="project-stage" className="text-foreground mb-2 block font-bold">Project Stage</Label>
        <Select value={form.stage} onValueChange={v => update("stage", v)}>
          <SelectTrigger id="project-stage" className="bg-background/50 border-border shadow-sm h-12 rounded-xl"><SelectValue placeholder="Select current stage" /></SelectTrigger>
          <SelectContent className="rounded-xl border-border">{stages.map(s => <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>,

    // Step 1: Objectives
    <div key="step1" className="space-y-6">
      <div>
        <Label htmlFor="project-business-goals" className="text-foreground mb-2 block font-bold">Business Goals <span className="text-destructive">*</span></Label>
        <Textarea
          id="project-business-goals"
          placeholder="What are the core business objectives? e.g. Increase checkout conversion by 15%, reduce cart abandonment, expand to mobile users..."
          value={form.businessGoals}
          onChange={e => update("businessGoals", e.target.value)}
          rows={6}
          className="bg-background/50 border-border focus-visible:ring-primary resize-none shadow-sm text-base rounded-xl"
        />
        <div className="flex items-start gap-3 mt-4 bg-primary/10 border border-primary/20 p-4 rounded-xl">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-foreground text-sm font-semibold leading-relaxed">
            Be specific. Vague goals produce vague AI outputs. The more context you provide, the better the agents can score features and craft tasks.
          </p>
        </div>
      </div>
    </div>,

    // Step 2: Audience
    <div key="step2" className="space-y-6">
      <div>
        <Label htmlFor="project-target-users" className="text-foreground mb-2 block font-bold">Target Users</Label>
        <Textarea
          id="project-target-users"
          placeholder="Describe your primary users. Include demographics, behaviors, technical literacy, pain points, and any personas you already have..."
          value={form.targetUsers}
          onChange={e => update("targetUsers", e.target.value)}
          rows={8}
          className="bg-background/50 border-border focus-visible:ring-primary resize-none shadow-sm text-base rounded-xl"
        />
      </div>
    </div>,

    // Step 3: Context
    <div key="step3" className="space-y-6">
      <div>
        <Label htmlFor="project-constraints" className="text-foreground mb-2 block font-bold">Constraints & Limitations</Label>
        <Textarea
          id="project-constraints"
          placeholder="Technical constraints, design system rules, regulatory requirements, timeline, budget, team size..."
          value={form.constraints}
          onChange={e => update("constraints", e.target.value)}
          rows={4}
          className="bg-background/50 border-border focus-visible:ring-primary resize-none shadow-sm rounded-xl text-base"
        />
      </div>
      <div>
        <Label htmlFor="project-additional-context" className="text-foreground mb-2 block font-bold">Additional Context</Label>
        <Textarea
          id="project-additional-context"
          placeholder="Anything else the AI agents should know — existing research, previous failed approaches, competitor context..."
          value={form.additionalContext}
          onChange={e => update("additionalContext", e.target.value)}
          rows={4}
          className="bg-background/50 border-border focus-visible:ring-primary resize-none shadow-sm rounded-xl text-base"
        />
      </div>
    </div>,

    // Step 4: Review
    <div key="step4" className="space-y-6">
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 space-y-6">
        {[
          { label: "Project Name", value: form.name },
          { label: "Product Type", value: form.productType },
          { label: "Industry", value: form.industry },
          { label: "Stage", value: form.stage },
          { label: "Business Goals", value: form.businessGoals },
          { label: "Target Users", value: form.targetUsers },
        ].map(({ label, value }) => value ? (
          <div key={label}>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 font-mono">{label}</div>
            <div className="text-foreground text-sm font-semibold leading-relaxed">{value}</div>
          </div>
        ) : null)}
      </div>
      <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 p-5 rounded-2xl text-sm font-semibold shadow-sm">
        <Check className="w-5 h-5 shrink-0" />
        <p>Almost done! Once created, you'll add source materials (research notes, URLs, files) before running the agent pipeline.</p>
      </div>
    </div>,
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-2xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-foreground mb-3 tracking-tighter">New Project</h1>
          <p className="text-muted-foreground text-base font-semibold max-w-md mx-auto">Configure your project context to give the AI agents the foundation they need.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-12 max-w-lg mx-auto">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all flex-shrink-0 ${
                  i < step ? "bg-primary text-primary-foreground cursor-pointer shadow-md hover:scale-105" :
                  i === step ? "bg-primary/10 text-primary border-2 border-primary ring-4 ring-primary/10 scale-110" :
                  "bg-muted text-muted-foreground border-2 border-border"
                }`}
              >
                {i < step ? <Check className="w-5 h-5" /> : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? "bg-primary/60" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-foreground tracking-tight">{steps[step]}</h2>
          <span className="text-xs font-black font-mono tracking-widest uppercase text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            Step {step + 1} / {steps.length}
          </span>
        </div>

        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 mb-8 shadow-xl shadow-primary/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="border-border/80 font-bold shadow-sm w-32 h-12 rounded-xl text-foreground bg-card hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-md shadow-primary/20 w-36 h-12 rounded-xl"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createProject.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-md shadow-primary/20 h-12 px-8 rounded-xl"
            >
              {createProject.isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating...</> : "Create Project"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
