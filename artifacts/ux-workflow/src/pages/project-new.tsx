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
    createProject.mutate(
      { data: { name: form.name, description: form.description || undefined, productType: form.productType || undefined, industry: form.industry || undefined, stage: form.stage || undefined, businessGoals: form.businessGoals || undefined, targetUsers: form.targetUsers || undefined, additionalContext: form.additionalContext || undefined } },
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
    <div className="space-y-5">
      <div>
        <Label className="text-foreground mb-2 block">Project Name <span className="text-destructive">*</span></Label>
        <Input
          placeholder="e.g. Redesign of checkout flow for mobile app"
          value={form.name}
          onChange={e => update("name", e.target.value)}
          className="bg-input border-border focus-visible:ring-primary"
        />
      </div>
      <div>
        <Label className="text-foreground mb-2 block">Description</Label>
        <Textarea
          placeholder="Brief overview of the project scope and context"
          value={form.description}
          onChange={e => update("description", e.target.value)}
          rows={3}
          className="bg-input border-border focus-visible:ring-primary resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-foreground mb-2 block">Product Type</Label>
          <Select value={form.productType} onValueChange={v => update("productType", v)}>
            <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>{productTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-foreground mb-2 block">Industry</Label>
          <Select value={form.industry} onValueChange={v => update("industry", v)}>
            <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select industry" /></SelectTrigger>
            <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-foreground mb-2 block">Project Stage</Label>
        <Select value={form.stage} onValueChange={v => update("stage", v)}>
          <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select current stage" /></SelectTrigger>
          <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>,

    // Step 1: Objectives
    <div className="space-y-5">
      <div>
        <Label className="text-foreground mb-2 block">Business Goals <span className="text-destructive">*</span></Label>
        <Textarea
          placeholder="What are the core business objectives? e.g. Increase checkout conversion by 15%, reduce cart abandonment, expand to mobile users..."
          value={form.businessGoals}
          onChange={e => update("businessGoals", e.target.value)}
          rows={5}
          className="bg-input border-border focus-visible:ring-primary resize-none"
        />
        <p className="text-muted-foreground text-xs mt-2">Be specific. Vague goals produce vague AI outputs.</p>
      </div>
    </div>,

    // Step 2: Audience
    <div className="space-y-5">
      <div>
        <Label className="text-foreground mb-2 block">Target Users</Label>
        <Textarea
          placeholder="Describe your primary users. Include demographics, behaviors, technical literacy, pain points, and any personas you already have..."
          value={form.targetUsers}
          onChange={e => update("targetUsers", e.target.value)}
          rows={5}
          className="bg-input border-border focus-visible:ring-primary resize-none"
        />
      </div>
    </div>,

    // Step 3: Context
    <div className="space-y-5">
      <div>
        <Label className="text-foreground mb-2 block">Constraints & Limitations</Label>
        <Textarea
          placeholder="Technical constraints, design system rules, regulatory requirements, timeline, budget, team size..."
          value={form.constraints}
          onChange={e => update("constraints", e.target.value)}
          rows={3}
          className="bg-input border-border focus-visible:ring-primary resize-none"
        />
      </div>
      <div>
        <Label className="text-foreground mb-2 block">Additional Context</Label>
        <Textarea
          placeholder="Anything else the AI agents should know — existing research, previous failed approaches, competitor context..."
          value={form.additionalContext}
          onChange={e => update("additionalContext", e.target.value)}
          rows={3}
          className="bg-input border-border focus-visible:ring-primary resize-none"
        />
      </div>
    </div>,

    // Step 4: Review
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
        {[
          { label: "Project Name", value: form.name },
          { label: "Product Type", value: form.productType },
          { label: "Industry", value: form.industry },
          { label: "Stage", value: form.stage },
          { label: "Business Goals", value: form.businessGoals },
          { label: "Target Users", value: form.targetUsers },
        ].map(({ label, value }) => value ? (
          <div key={label}>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
            <div className="text-foreground text-sm">{value}</div>
          </div>
        ) : null)}
      </div>
      <p className="text-muted-foreground text-sm">Once created, you'll add source materials (research notes, URLs, files) before running AI analysis.</p>
    </div>,
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">New Project</h1>
          <p className="text-muted-foreground text-sm">Configure your project before adding sources and running AI analysis.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors flex-shrink-0 ${
                  i < step ? "bg-cyan-500 text-[hsl(222,47%,8%)] cursor-pointer" :
                  i === step ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 transition-colors ${i < step ? "bg-cyan-500/50" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-2">
          <h2 className="text-lg font-semibold text-foreground">{steps[step]}</h2>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="border-border"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createProject.isPending}
              className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold"
            >
              {createProject.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Project"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
