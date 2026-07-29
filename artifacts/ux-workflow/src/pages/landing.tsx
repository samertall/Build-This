import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Target, Layers, Zap, Users, BarChart3, Presentation, CheckCircle, ChevronRight, Cpu, FlaskConical, Route, Star, GitBranch, ListChecks, Search, Lightbulb, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

const agents = [
  { name: "Project Context", icon: Layers, desc: "Structures your inputs into a coherent project framework" },
  { name: "Research Synthesis", icon: FlaskConical, desc: "Clusters insights from disparate research sources" },
  { name: "Problem Framing", icon: Target, desc: "Converts findings into clear, actionable problem statements" },
  { name: "UX Strategy", icon: Lightbulb, desc: "Generates evidence-linked strategic recommendations" },
  { name: "Journey & Flow", icon: Route, desc: "Maps current and future state user journeys" },
  { name: "Feature Prioritization", icon: Star, desc: "RICE-scored backlog with MoSCoW prioritization" },
  { name: "Information Architecture", icon: GitBranch, desc: "Structures content hierarchy and navigation logic" },
  { name: "Wireframe Direction", icon: Workflow, desc: "Generates layout rationale and component specs" },
  { name: "Content & SEO", icon: Search, desc: "Identifies content gaps and SEO opportunities" },
  { name: "Task Orchestration", icon: ListChecks, desc: "Generates team-ready tasks with acceptance criteria" },
  { name: "Presentation", icon: Presentation, desc: "Auto-generates stakeholder-ready slide decks" },
  { name: "Quality & Governance", icon: CheckCircle, desc: "Validates outputs against UX standards and heuristics" },
];

const roles = [
  { role: "UX Designers", icon: Brain, outputs: ["User personas", "Journey maps", "Wireframe directions", "Heuristic reports"] },
  { role: "Product Managers", icon: Target, outputs: ["Feature priorities", "RICE scores", "User stories", "Roadmaps"] },
  { role: "Developers", icon: Cpu, outputs: ["Dev tickets", "Acceptance criteria", "Edge cases", "Technical specs"] },
  { role: "Content Teams", icon: Search, outputs: ["Content audits", "SEO gaps", "UX copy", "IA maps"] },
  { role: "Stakeholders", icon: BarChart3, outputs: ["Executive summaries", "Business impact", "Slide decks", "KPIs"] },
];

const steps = [
  { number: "01", label: "Upload Context", desc: "Research notes, goals, design references, analytics reports, competitor reviews — any format." },
  { number: "02", label: "AI Synthesis", desc: "12 specialized agents analyze patterns, gaps, conflicts, and opportunities across all your inputs." },
  { number: "03", label: "Review & Approve", desc: "Human-in-the-loop: every insight, problem statement, and recommendation requires your sign-off." },
  { number: "04", label: "Execute", desc: "Team tasks, presentations, and exports land directly in your workflow — no translation required." },
];

const stats = [
  { value: "60%", label: "Reduction in research synthesis time" },
  { value: "12×", label: "AI agents working in parallel" },
  { value: "80%", label: "Fewer ambiguous dev tickets" },
  { value: "3×", label: "Faster stakeholder sign-off" },
];

function LogoFull({ height = 36 }: { height?: number }) {
  return (
    <img
      src="/build-this-logo.png"
      alt="Build-This"
      style={{ height: `${height}px`, width: "auto" }}
    />
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoFull height={32} />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-medium">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="font-semibold shadow-sm">
                Start free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <Badge variant="outline" className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold tracking-widest uppercase font-mono">
              Agentic AI for UX Teams
            </Badge>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-foreground mb-6">
            From Scattered UX Inputs<br />
            <span className="text-primary">
              to Clear Product Execution.
            </span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            An agentic AI workspace that analyzes research, business goals, content, and design material — then generates UX insights, user flows, feature priorities, actionable tasks, and professional presentations.
          </motion.p>
          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up">
              <Button size="lg" className="font-semibold px-8 h-14 text-base shadow-lg shadow-primary/25">
                Start a UX Project <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-medium">
                View the Demo
              </Button>
            </Link>
          </motion.div>
          <motion.p initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="mt-8 text-sm text-muted-foreground font-mono">
            Built for designers, product managers, developers, marketers, and business leaders.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border bg-card">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
              className="text-center">
              <div className="text-4xl font-bold text-primary mb-2 tracking-tight">{s.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge variant="outline" className="mb-4 bg-secondary text-secondary-foreground border-border text-xs uppercase tracking-wider font-mono font-bold">How it works</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Four steps from input to execution</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">No more losing context between tools. The entire UX workflow lives in one structured, AI-powered workspace.</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.number} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="relative group">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border z-0" />
                )}
                <div className="relative z-10 bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                  <div className="text-5xl font-extrabold text-muted/50 mb-6 leading-none tracking-tighter">{s.number}</div>
                  <h3 className="text-foreground font-bold mb-3 text-lg tracking-tight">{s.label}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 Agents */}
      <section className="py-24 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs uppercase tracking-wider font-mono font-bold">12 AI Agents</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Specialized intelligence at every stage</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Each agent is purpose-built for a specific UX discipline. They work in sequence, feeding context forward.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <motion.div key={agent.name} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 6} variants={fadeUp}
                className="flex items-start gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                  <agent.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-foreground font-bold text-sm mb-1">{agent.name}</div>
                  <div className="text-muted-foreground text-sm leading-relaxed">{agent.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge variant="outline" className="mb-4 bg-sidebar/5 text-sidebar border-sidebar/20 text-xs uppercase tracking-wider font-mono font-bold dark:bg-primary/10 dark:text-primary dark:border-primary/20">Multi-Role</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">One platform, every team member</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Each role gets exactly what they need — no translation layer, no manual reformatting.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {roles.map((r, i) => (
              <motion.div key={r.role} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <r.icon className="w-6 h-6" />
                </div>
                <div className="font-bold text-foreground text-base mb-4 tracking-tight">{r.role}</div>
                <ul className="space-y-2.5">
                  {r.outputs.map(o => (
                    <li key={o} className="flex items-start gap-2 text-sm text-muted-foreground font-medium">
                      <ChevronRight className="w-4 h-4 text-primary/50 flex-shrink-0 mt-0.5" />
                      {o}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Human-in-the-loop */}
      <section className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Badge variant="outline" className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs uppercase tracking-wider font-mono font-bold">Human-in-the-Loop</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">AI proposes. You decide.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Every insight, problem statement, and recommendation requires explicit approval before it becomes actionable. The AI works fast — you stay in control. Approve, reject, or refine anything the agents generate.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                { status: "Pending", badge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", desc: "AI-generated, awaiting your review" },
                { status: "Approved", badge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", desc: "Validated and ready for execution" },
                { status: "Rejected", badge: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800", desc: "Flagged and excluded from outputs" },
              ].map(s => (
                <div key={s.status} className="bg-background rounded-xl border border-border p-6 shadow-sm">
                  <div className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono border mb-3 ${s.badge}`}>
                    {s.status}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">{s.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">About this project</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Created by <a href="https://samertall.com/" target="_blank" rel="noopener noreferrer" className="text-foreground font-semibold hover:text-primary transition-colors">Samer Tallauze</a> — Senior UX/UI Product Designer | Front-End | SEO | CX. This platform is a working demonstration of agentic AI applied to UX workflow automation.
            </p>
            <p className="text-muted-foreground/80 text-sm font-medium">
              The goal: replace the fragmented stack of spreadsheets, Miro boards, Notion docs, and slide decks with a single intelligent workspace that does the heavy lifting — while keeping designers and product teams firmly in control of every decision.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl font-bold mb-6 tracking-tight text-white">Ready to work with AI at the speed of thought?</h2>
            <p className="text-sidebar-foreground/70 mb-10 text-lg font-medium">Start a project in minutes. No setup required.</p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 h-14 text-base shadow-lg shadow-primary/30">
                Start a UX Project <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2.5">
            <LogoFull height={24} />
            <span>
              Made with 💙 by{" "}
              <a
                href="https://samertall.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold transition-colors"
              >
                Samer Tallauze
              </a>
            </span>
          </div>
          <div>AI-Powered UX Workflow Automation for Smarter Digital Product Design</div>
        </div>
      </footer>
    </div>
  );
}
