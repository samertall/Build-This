import { Link } from "wouter";
import { motion, useScroll, useTransform, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { ArrowRight, Brain, Target, Layers, Zap, Users, BarChart3, Presentation, CheckCircle, ChevronRight, Cpu, FlaskConical, Route, Star, GitBranch, ListChecks, Search, Lightbulb, Workflow, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const wordReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
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
  { value: 60, suffix: "%", label: "Reduction in synthesis time" },
  { value: 12, suffix: "x", label: "AI agents in parallel" },
  { value: 80, suffix: "%", label: "Fewer ambiguous tickets" },
  { value: 3, suffix: "x", label: "Faster sign-off" },
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

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  
  return (
    <motion.div 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeUp}
      onViewportEnter={() => animate(count, value, { duration: 2, ease: "easeOut" })}
      className="text-center group"
    >
      <div className="text-5xl md:text-6xl font-black text-primary mb-3 tracking-tighter flex items-center justify-center text-glow transition-transform duration-500 group-hover:scale-110">
        <motion.span>{rounded}</motion.span>
        <span>{suffix}</span>
      </div>
      <div className="text-sm md:text-base text-muted-foreground font-bold uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const timelineProgress = useTransform(scrollYProgress, [0.3, 0.6], [0, 100]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-2.5"
          >
            <LogoFull height={40} />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-4"
          >
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-bold text-sm tracking-wide">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="font-bold tracking-wide shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
                Start free
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[100dvh]">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-drift opacity-70" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen animate-drift opacity-50" style={{ animationDelay: '-5s', animationDuration: '25s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse-glow" />
          
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        </div>

        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Badge variant="outline" className="mb-8 bg-background/50 backdrop-blur-md text-primary border-primary/30 px-5 py-2 text-sm font-black tracking-widest uppercase font-mono shadow-[0_0_20px_rgba(24,147,247,0.2)]">
              Agentic AI for UX Teams
            </Badge>
          </motion.div>
          
          <motion.h1 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-6xl md:text-8xl lg:text-[7.5rem] font-black leading-[1.05] tracking-tighter text-foreground mb-8 drop-shadow-sm"
          >
            {"From Scattered Inputs".split(" ").map((word, i) => (
              <motion.span key={i} variants={wordReveal} className="inline-block mr-3 lg:mr-4">{word}</motion.span>
            ))}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-500 animate-gradient pb-2 inline-block">
              {"to Clear Execution.".split(" ").map((word, i) => (
                <motion.span key={i} variants={wordReveal} className="inline-block mr-3 lg:mr-4">{word}</motion.span>
              ))}
            </span>
          </motion.h1>
          
          <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            An agentic AI workspace that analyzes research, goals, and design material — generating insights, flows, priorities, and professional presentations.
          </motion.p>
          
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-5 flex-wrap relative z-20">
            <Link href="/sign-up">
              <Button size="lg" className="font-bold px-10 h-16 text-lg shadow-[0_0_40px_rgba(24,147,247,0.4)] hover:shadow-[0_0_60px_rgba(24,147,247,0.6)] hover:-translate-y-1 transition-all duration-300 rounded-full relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                Start a UX Project <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-bold rounded-full border-border/80 bg-background/50 backdrop-blur-sm hover:bg-muted hover:-translate-y-1 transition-all duration-300">
                View the Demo
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-24 px-6 border-y border-border/50 bg-card/30 relative z-20 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {stats.map((s, i) => (
            <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="py-32 px-6 bg-background relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-24">
            <Badge variant="outline" className="mb-6 bg-secondary/50 text-secondary-foreground border-border text-sm uppercase tracking-widest font-mono font-black">How it works</Badge>
            <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6 tracking-tighter">Four steps to execution</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-xl font-medium">No more losing context between tools. The entire UX workflow lives in one structured workspace.</p>
          </motion.div>
          
          <div className="relative">
            {/* Animated Progress Line */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-border/50 rounded-full overflow-hidden z-0">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full"
                style={{ width: useTransform(timelineProgress, v => `${v}%`) }}
              />
            </div>

            <div className="grid md:grid-cols-4 gap-8 md:gap-6">
              {steps.map((s, i) => (
                <motion.div 
                  key={s.number} 
                  initial="hidden" 
                  whileInView="visible" 
                  viewport={{ once: true, margin: "-50px" }} 
                  custom={i} 
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15, type: "spring" } })
                  }}
                  className="relative z-10 group"
                >
                  <div className="glass-card rounded-3xl p-8 h-full relative overflow-hidden group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="text-6xl font-black text-muted-foreground/20 mb-8 leading-none tracking-tighter transition-colors duration-500 group-hover:text-primary/20">{s.number}</div>
                    <h3 className="text-foreground font-bold mb-4 text-2xl tracking-tight">{s.label}</h3>
                    <p className="text-muted-foreground text-base leading-relaxed font-medium">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 12 Agents */}
      <section className="py-32 px-6 bg-card border-y border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-20">
            <Badge variant="outline" className="mb-6 bg-primary/10 text-primary border-primary/20 text-sm uppercase tracking-widest font-mono font-black shadow-[0_0_15px_rgba(24,147,247,0.15)]">12 AI Agents</Badge>
            <h2 className="text-5xl md:text-6xl font-black text-foreground mb-6 tracking-tighter">Specialized intelligence</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-xl font-medium">Each agent is purpose-built for a specific UX discipline. They work in sequence, feeding context forward.</p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <motion.div 
                key={agent.name} 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, margin: "-50px" }} 
                custom={i} 
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 20 },
                  visible: (i) => ({ opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, delay: (i % 6) * 0.08, type: "spring", stiffness: 200 } })
                }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col relative z-10 bg-background/50 hover:bg-background/80 transition-colors duration-300">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm border border-primary/10">
                    <agent.icon className="w-7 h-7" />
                  </div>
                  <div className="text-foreground font-black text-xl mb-3 tracking-tight group-hover:text-primary transition-colors">{agent.name}</div>
                  <div className="text-muted-foreground text-base leading-relaxed font-medium">{agent.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Human-in-the-loop */}
      <section className="py-32 px-6 bg-background relative overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <Badge variant="outline" className="mb-8 bg-primary/10 text-primary border-primary/20 text-sm uppercase tracking-widest font-mono font-black">Human-in-the-Loop</Badge>
            <h2 className="text-5xl md:text-7xl font-black text-foreground mb-8 tracking-tighter">AI proposes. <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">You decide.</span></h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
              Every insight, problem statement, and recommendation requires explicit approval before it becomes actionable. The AI works fast — you stay in control.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-8 text-left">
              {[
                { status: "Pending", icon: Clock, badge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", desc: "AI-generated, awaiting your review" },
                { status: "Approved", icon: CheckCircle, badge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", desc: "Validated and ready for execution" },
                { status: "Rejected", icon: Target, badge: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800", desc: "Flagged and excluded from outputs" },
              ].map((s, i) => (
                <motion.div 
                  key={s.status} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.15, type: "spring" }}
                  className="glass-card rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 p-6 opacity-5 transition-transform duration-500 group-hover:scale-150 group-hover:-rotate-12`}>
                    <s.icon className="w-24 h-24" />
                  </div>
                  <div className={`inline-block px-4 py-1.5 rounded-lg text-sm font-black font-mono border-2 mb-6 ${s.badge} shadow-sm`}>
                    {s.status}
                  </div>
                  <div className="text-lg text-muted-foreground font-semibold relative z-10">{s.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/40 rounded-full blur-[150px] animate-pulse-glow" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <h2 className="text-6xl md:text-7xl font-black mb-8 tracking-tighter text-background">Work with AI at the speed of thought.</h2>
            <p className="text-background/70 mb-12 text-2xl font-medium max-w-2xl mx-auto">Start a project in minutes. No complex setup required.</p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-12 h-20 text-xl shadow-[0_0_50px_rgba(24,147,247,0.5)] hover:shadow-[0_0_80px_rgba(24,147,247,0.8)] rounded-full hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border border-primary-foreground/20">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                Initialize Workspace <ArrowRight className="ml-3 w-7 h-7 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-3">
            <LogoFull height={28} />
            <span className="opacity-60">|</span>
            <span>
              Crafted with intent by{" "}
              <a href="https://samertall.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-bold transition-colors">
                Samer Tallauze
              </a>
            </span>
          </div>
          <div className="font-mono text-xs uppercase tracking-widest opacity-60">AI-Powered UX Workflow Automation</div>
        </div>
      </footer>
    </div>
  );
}
