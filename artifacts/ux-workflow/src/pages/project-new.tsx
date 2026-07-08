import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useCreateProject } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

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
          toast({ title: "Project created", description: "Your project is ready. Start by adding sources." });
          setLocation(`/projects/${project.id}`);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create project. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const stepContent = [
    // Step 0: Basics
    <div key="step0" className="space-y-6">
      <div>
        <Label className="text-foreground mb-2 block font-medium">Project Name <span className="text-destructive">*</span></Label>
        <Input
          placeholder="e.g. Redesign of checkout flow for mobile app"
          value={form.name}
          onChange={e => update("name", e.target.value)}
          className="bg-background border-border focus-visible:ring-primary shadow-sm"
        />
      </div>
      <div>
        <Label className="text-foreground mb-2 block font-medium">Description</Label>
        <Textarea
          placeholder="Brief overview of the project scope and context"
          value={form.description}
          onChange={e => update("description", e.target.value)}
          rows={3}
          className="bg-background border-border focus-visible:ring-primary resize-none shadow-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <Label className="text-foreground mb-2 block font-medium">Product Type</Label>
          <Select value={form.productType} onValueChange={v => update("productType", v)}>
            <SelectTrigger className="bg-background border-border shadow-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>{productTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-foreground mb-2 block font-medium">Industry</Label>
          <Select value={form.industry} onValueChange={v => update("industry", v)}>
            <SelectTrigger className="bg-background border-border shadow-sm"><SelectValue placeholder="Select industry" /></SelectTrigger>
            <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-foreground mb-2 block font-medium">Project Stage</Label>
        <Select value={form.stage} onValueChange={v => update("stage", v)}>
          <SelectTrigger className="bg-background border-border shadow-sm"><SelectValue placeholder="Select current stage" /></SelectTrigger>
          <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>,

    // Step 1: Objectives
    <div key="step1" className="space-y-6">
      <div>
        <Label className="text-foreground mb-2 block font-medium">Business Goals <span className="text-destructive">*</span></Label>
        <Textarea
          placeholder="What are the core business objectives? e.g. Increase checkout conversion by 15%, reduce cart abandonment, expand to mobile users..."
          value={form.businessGoals}
          onChange={e => update("businessGoals", e.target.value)}
          rows={6}
          className="bg-background border-border focus-visible:ring-primary resize-none shadow-sm text-base"
        />
        <p className="text-muted-foreground text-sm mt-2 font-medium bg-muted p-3 rounded-lg border border-border mt-3">💡 Be specific. Vague goals produce vague AI outputs.</p>
      </div>
    </div>,

    // Step 2: Audience
    <div key="step2" className="space-y-6">
      <div>
        <Label className="text-foreground mb-2 block font-medium">Target Users</Label>
        <Textarea
          placeholder="Describe your primary users. Include demographics, behaviors, technical literacy, pain points, and any personas you already have..."
          value={form.targetUsers}
          onChange={e => update("targetUsers", e.target.value)}
          rows={6}
          className="bg-background border-border focus-visible:ring-primary resize-none shadow-sm text-base"
        />
      </div>
    </div>,

    // Step 3: Context
    <div key="step3" className="space-y-6">
      <div>
        <Label className="text-foreground mb-2 block font-medium">Constraints & Limitations</Label>
        <Textarea
          placeholder="Technical constraints, design system rules, regulatory requirements, timeline, budget, team size..."
          value={form.constraints}
          onChange={e => update("constraints", e.target.value)}
          rows={4}
          className="bg-background border-border focus-visible:ring-primary resize-none shadow-sm"
        />
      </div>
      <div>
        <Label className="text-foreground mb-2 block font-medium">Additional Context</Label>
        <Textarea
          placeholder="Anything else the AI agents should know — existing research, previous failed approaches, competitor context..."
          value={form.additionalContext}
          onChange={e => update("additionalContext", e.target.value)}
          rows={4}
          className="bg-background border-border focus-visible:ring-primary resize-none shadow-sm"
        />
      </div>
    </div>,

    // Step 4: Review
    <div key="step4" className="space-y-6">
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5">
        {[
          { label: "Project Name", value: form.name },
          { label: "Product Type", value: form.productType },
          { label: "Industry", value: form.industry },
          { label: "Stage", value: form.stage },
          { label: "Business Goals", value: form.businessGoals },
          { label: "Target Users", value: form.targetUsers },
        ].map(({ label, value }) => value ? (
          <div key={label}>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
            <div className="text-foreground text-sm font-medium">{value}</div>
          </div>
        ) : null)}
      </div>
      <div className="bg-primary/5 text-primary border border-primary/20 p-4 rounded-xl text-sm font-medium">
        Almost done! Once created, you'll add source materials (research notes, URLs, files) before running AI analysis.
      </div>
    </div>,
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">New Project</h1>
          <p className="text-muted-foreground text-base">Configure your project before adding sources and running AI analysis.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${
                  i < step ? "bg-primary text-primary-foreground cursor-pointer shadow-md hover:bg-primary/90" :
                  i === step ? "bg-primary/10 text-primary border-2 border-primary ring-4 ring-primary/10" :
                  "bg-muted text-muted-foreground border-2 border-border"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary/50" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{steps[step]}</h2>
          <span className="text-sm font-mono text-muted-foreground">Step {step + 1} of {steps.length}</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="border-border font-medium shadow-sm w-32"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm w-32"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createProject.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm px-6"
            >
              {createProject.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Project"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
