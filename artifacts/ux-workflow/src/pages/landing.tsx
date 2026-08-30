import { Link } from "wouter";
import { motion, useScroll, useTransform, useMotionValue, useSpring, animate, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Brain, Target, Layers, Zap, Users, BarChart3, Presentation, CheckCircle, Cpu, FlaskConical, Route, Star, GitBranch, ListChecks, Search, Lightbulb, Workflow, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
};

const wordReveal: Variants = {
  hidden: { opacity: 0, y: 28, rotateX: -15 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const cardSpring = (i: number) => ({
  hidden: { opacity: 0, y: 30, scale: 0.94 },
  visible: (custom: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, delay: custom * 0.07, type: "spring", stiffness: 220, damping: 24 },
  }),
});

const agents = [
  { name: "Project Context", icon: Layers, desc: "Structures your inputs into a coherent project framework", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { name: "Research Synthesis", icon: FlaskConical, desc: "Clusters insights from disparate research sources", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  { name: "Problem Framing", icon: Target, desc: "Converts findings into clear, actionable problem statements", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { name: "UX Strategy", icon: Lightbulb, desc: "Generates evidence-linked strategic recommendations", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { name: "Journey & Flow", icon: Route, desc: "Maps current and future state user journeys", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { name: "Feature Prioritization", icon: Star, desc: "RICE-scored backlog with MoSCoW prioritization", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Information Architecture", icon: GitBranch, desc: "Structures content hierarchy and navigation logic", color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
  { name: "Wireframe Direction", icon: Workflow, desc: "Generates layout rationale and component specs", color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" },
  { name: "Content & SEO", icon: Search, desc: "Identifies content gaps and SEO opportunities", color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  { name: "Task Orchestration", icon: ListChecks, desc: "Generates team-ready tasks with acceptance criteria", color: "text-blue-600 bg-blue-600/10 border-blue-600/20" },
  { name: "Presentation", icon: Presentation, desc: "Auto-generates stakeholder-ready slide decks", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { name: "Quality & Governance", icon: CheckCircle, desc: "Validates outputs against UX standards and heuristics", color: "text-green-500 bg-green-500/10 border-green-500/20" },
];

const roles = [
  { role: "UX Designers", icon: Brain, color: "from-blue-500 to-indigo-500", outputs: ["User personas", "Journey maps", "Wireframe directions", "Heuristic reports"] },
  { role: "Product Managers", icon: Target, color: "from-amber-500 to-orange-500", outputs: ["Feature priorities", "RICE scores", "User stories", "Roadmaps"] },
  { role: "Developers", icon: Cpu, color: "from-teal-500 to-emerald-500", outputs: ["Dev tickets", "Acceptance criteria", "Edge cases", "Technical specs"] },
  { role: "Content Teams", icon: Search, color: "from-violet-500 to-purple-500", outputs: ["Content audits", "SEO gaps", "UX copy", "IA maps"] },
  { role: "Stakeholders", icon: BarChart3, color: "from-rose-500 to-pink-500", outputs: ["Executive summaries", "Business impact", "Slide decks", "KPIs"] },
];

const steps = [
  { number: "01", label: "Upload Context", desc: "Research notes, goals, design references, analytics — any format." },
  { number: "02", label: "AI Synthesis", desc: "12 specialized agents analyze patterns, gaps, and opportunities." },
  { number: "03", label: "Review & Approve", desc: "Human-in-the-loop: every insight requires your sign-off." },
  { number: "04", label: "Execute", desc: "Tasks, presentations, and exports land in your workflow." },
];

const stats = [
  { value: 60, suffix: "%", label: "Reduction in synthesis time" },
  { value: 12, suffix: "x", label: "AI agents in parallel" },
  { value: 80, suffix: "%", label: "Fewer ambiguous tickets" },
  { value: 3, suffix: "x", label: "Faster sign-off" },
];

function LogoFull({ height = 36 }: { height?: number }) {
  return <img src="/build-this-logo.png" alt="Build-This" style={{ height: `${height}px`, width: "auto" }} />;
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      onViewportEnter={() => animate(count, value, { duration: 2, ease: "easeOut" })}
      className="text-center group cursor-default"
    >
      <motion.div
        whileHover={{ scale: 1.06 }}
        className="text-5xl md:text-6xl font-black text-primary mb-3 tracking-tighter flex items-center justify-center number-glow"
      >
        <motion.span>{rounded}</motion.span>
        <span>{suffix}</span>
      </motion.div>
      <div className="text-xs md:text-sm text-muted-foreground font-bold uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

// Perspective tilt card on mouse move
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotateX.set(((e.clientY - cy) / (rect.height / 2)) * -6);
    rotateY.set(((e.clientX - cx) / (rect.width / 2)) * 6);
  };
  const handleMouseLeave = () => { rotateX.set(0); rotateY.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 180]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  const [activeRole, setActiveRole] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveRole(r => (r + 1) % roles.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-[70px] flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <LogoFull height={36} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-bold text-sm">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
                <Button size="sm" className="font-bold shadow-[0_4px_20px_rgba(24,147,247,0.3)] hover:shadow-[0_6px_28px_rgba(24,147,247,0.5)] transition-shadow rounded-full px-5">
                  Start free
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-28 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[100dvh]">
        {/* Mesh grid background */}
        <div className="absolute inset-0 mesh-grid opacity-60 pointer-events-none" />

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[15%] left-[15%] w-[700px] h-[700px] bg-primary/15 rounded-full blur-[140px] animate-drift" />
          <div className="absolute bottom-[10%] right-[10%] w-[550px] h-[550px] bg-indigo-500/10 rounded-full blur-[120px] animate-drift" style={{ animationDelay: '-7s', animationDuration: '26s' }} />
          <div className="absolute top-[60%] left-[40%] w-[400px] h-[400px] bg-blue-400/8 rounded-full blur-[100px] animate-drift" style={{ animationDelay: '-14s', animationDuration: '32s' }} />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Badge
              variant="outline"
              className="mb-8 bg-background/60 backdrop-blur-md text-primary border-primary/25 px-5 py-2 text-xs font-black tracking-widest uppercase font-mono shadow-[0_0_24px_rgba(24,147,247,0.15)] hover:shadow-[0_0_36px_rgba(24,147,247,0.25)] transition-shadow cursor-default"
            >
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary inline-block mr-2"
              />
              Agentic AI for UX Teams
            </Badge>
          </motion.div>

          <motion.h1
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-[clamp(3rem,8vw,7rem)] font-black leading-[1.03] tracking-tighter text-foreground mb-8"
            style={{ perspective: 1000 }}
          >
            <span className="block overflow-hidden">
              {"From Scattered Inputs".split(" ").map((word, i) => (
                <motion.span key={i} variants={wordReveal} className="inline-block mr-[0.25em]">{word}</motion.span>
              ))}
            </span>
            <span className="block overflow-hidden">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-500 animate-gradient pb-1 inline-block">
                {"to Clear Execution.".split(" ").map((word, i) => (
                  <motion.span key={i} variants={wordReveal} className="inline-block mr-[0.25em]">{word}</motion.span>
                ))}
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            An agentic AI workspace that analyzes research, goals, and design material — generating insights, flows, priorities, and professional presentations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20"
          >
            <Link href="/sign-up">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="font-black px-10 h-14 text-base shadow-[0_0_40px_rgba(24,147,247,0.4)] hover:shadow-[0_0_64px_rgba(24,147,247,0.6)] transition-all duration-300 rounded-full relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                  Start a UX Project
                  <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
            <Link href="/sign-in">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" className="h-14 px-10 text-base font-bold rounded-full border-border/70 bg-background/60 backdrop-blur-sm hover:bg-muted transition-all duration-300">
                  View the Demo
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Floating badge row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex items-center justify-center gap-3 flex-wrap mt-10"
          >
            {["UX Designers", "Product Managers", "Developers", "Marketers"].map((label, i) => (
              <motion.span
                key={label}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.06 }}
                className="text-xs font-bold text-muted-foreground/60 bg-muted/40 border border-border/50 rounded-full px-3 py-1 font-mono uppercase tracking-wider"
              >
                {label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-border/50 flex items-start justify-center p-1"
          >
            <div className="w-1 h-1.5 rounded-full bg-primary/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-24 px-6 border-y border-border/40 bg-card/40 relative z-20 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {stats.map((s) => (
            <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* ── Workflow Steps ── */}
      <section className="py-32 px-6 bg-background relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-primary/4 rounded-full blur-[180px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center mb-24">
            <Badge variant="outline" className="mb-5 bg-secondary/40 text-secondary-foreground border-border text-xs uppercase tracking-widest font-mono font-black">
              How it works
            </Badge>
            <h2 className="text-[clamp(2.4rem,5vw,4rem)] font-black text-foreground mb-5 tracking-tighter">Four steps to execution</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">The entire UX workflow — from scattered inputs to team-ready outputs — in one structured space.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.12, type: "spring", stiffness: 180 }}
                className="relative z-10 group"
              >
                <TiltCard>
                  <div className="glass-card rounded-3xl p-8 h-full relative overflow-hidden cursor-default">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-transparent group-hover:from-primary/4 transition-all duration-700 rounded-3xl" />
                    {/* Step number */}
                    <div className="text-[5rem] font-black leading-none tracking-tighter text-muted-foreground/10 mb-6 group-hover:text-primary/15 transition-colors duration-500 select-none">
                      {s.number}
                    </div>
                    {/* Connector dot */}
                    <div className="hidden md:block absolute top-12 -right-3 w-6 h-6 rounded-full border-2 border-border bg-background z-20 group-hover:border-primary/50 group-hover:shadow-[0_0_12px_rgba(24,147,247,0.4)] transition-all duration-300" />
                    <h3 className="text-foreground font-black text-xl mb-3 tracking-tight">{s.label}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">{s.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12 Agents ── */}
      <section className="py-32 px-6 bg-card border-y border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center mb-20">
            <Badge variant="outline" className="mb-5 bg-primary/8 text-primary border-primary/20 text-xs uppercase tracking-widest font-mono font-black shadow-[0_0_16px_rgba(24,147,247,0.12)]">
              12 AI Agents
            </Badge>
            <h2 className="text-[clamp(2.4rem,5vw,4rem)] font-black text-foreground mb-5 tracking-tighter">Specialized intelligence</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">Each agent is purpose-built for a specific UX discipline. They work in sequence, feeding context forward.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.06, type: "spring", stiffness: 220, damping: 22 }}
                className="group relative"
              >
                {/* Background glow bloom */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-blue-500/0 group-hover:from-primary/10 group-hover:to-blue-500/5 rounded-2xl blur-xl transition-all duration-500 -z-10" />
                <TiltCard className="h-full">
                  <div className="glass-card rounded-2xl p-6 h-full flex flex-col relative bg-background/60 hover:bg-background/90 transition-colors duration-300 overflow-hidden">
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl bg-primary/20" />
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${agent.color}`}>
                      <agent.icon className="w-6 h-6" />
                    </div>
                    <div className="text-foreground font-black text-base mb-2 tracking-tight group-hover:text-primary transition-colors duration-200">{agent.name}</div>
                    <div className="text-muted-foreground text-sm leading-relaxed font-medium">{agent.desc}</div>
                    {/* Subtle sequence number */}
                    <div className="absolute top-4 right-4 text-[10px] font-black font-mono text-muted-foreground/20 group-hover:text-primary/30 transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-32 px-6 bg-background relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center mb-16">
            <Badge variant="outline" className="mb-5 bg-secondary/40 border-border text-xs uppercase tracking-widest font-mono font-black">Built For</Badge>
            <h2 className="text-[clamp(2.4rem,5vw,4rem)] font-black text-foreground mb-5 tracking-tighter">Every voice in the room</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">One pipeline, purpose-built outputs for every discipline.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Role selector */}
            <div className="flex flex-col gap-3">
              {roles.map((role, i) => (
                <motion.button
                  key={role.role}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setActiveRole(i)}
                  className={`relative flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-300 border ${
                    activeRole === i
                      ? "bg-card border-primary/30 shadow-[0_4px_24px_rgba(24,147,247,0.12)]"
                      : "border-transparent hover:bg-card/50 hover:border-border/50"
                  }`}
                >
                  {activeRole === i && (
                    <motion.div
                      layoutId="role-pill"
                      className="absolute inset-0 rounded-2xl bg-primary/4 border border-primary/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0 shadow-sm relative z-10 transition-transform duration-300 ${activeRole === i ? "scale-110" : ""}`}>
                    <role.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className={`font-black text-base tracking-tight transition-colors ${activeRole === i ? "text-primary" : "text-foreground"}`}>{role.role}</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">{role.outputs.length} output types</div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Output preview */}
            <div className="lg:pl-8">
              <motion.div
                key={activeRole}
                initial={{ opacity: 0, x: 20, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="glass-card rounded-3xl p-8 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${roles[activeRole].color} opacity-5 blur-[60px] pointer-events-none rounded-full`} />
                <div className="flex items-center gap-4 mb-7">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roles[activeRole].color} flex items-center justify-center shadow-lg`}>
                    {(() => { const Icon = roles[activeRole].icon; return <Icon className="w-7 h-7 text-white" />; })()}
                  </div>
                  <div>
                    <div className="font-black text-xl text-foreground tracking-tight">{roles[activeRole].role}</div>
                    <div className="text-sm text-muted-foreground font-medium">AI-generated outputs</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {roles[activeRole].outputs.map((output, i) => (
                    <motion.div
                      key={output}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-2.5 p-3.5 rounded-xl bg-background/60 border border-border/60 group hover:border-primary/30 hover:bg-background transition-all duration-200"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 group-hover:shadow-[0_0_8px_rgba(24,147,247,0.8)] transition-shadow" />
                      <span className="text-sm font-semibold text-foreground">{output}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Human-in-the-loop ── */}
      <section className="py-32 px-6 bg-card border-y border-border/40 relative overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <Badge variant="outline" className="mb-8 bg-primary/8 text-primary border-primary/20 text-xs uppercase tracking-widest font-mono font-black">Human-in-the-Loop</Badge>
            <h2 className="text-[clamp(2.4rem,5vw,4.5rem)] font-black text-foreground mb-6 tracking-tighter">
              AI proposes.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">You decide.</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed font-medium">
              Every insight, problem statement, and recommendation requires explicit approval before it becomes actionable.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                { status: "Pending", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20", desc: "AI-generated, awaiting your review", dot: "bg-amber-500" },
                { status: "Approved", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", desc: "Validated and ready for execution", dot: "bg-emerald-500" },
                { status: "Rejected", badge: "bg-rose-500/10 text-rose-600 border-rose-500/20", desc: "Flagged and excluded from outputs", dot: "bg-rose-500" },
              ].map((s, i) => (
                <motion.div
                  key={s.status}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.12, type: "spring", stiffness: 200 }}
                  whileHover={{ y: -6 }}
                  className="glass-card rounded-2xl p-7 relative overflow-hidden cursor-default group"
                >
                  <div className={`absolute top-0 left-0 w-full h-[2px] ${s.dot} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.dot} shadow-lg`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${s.dot} animate-ping-blue opacity-60`} />
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-black font-mono border ${s.badge}`}>{s.status}</span>
                  </div>
                  <div className="text-base text-muted-foreground font-semibold">{s.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-36 px-6 bg-foreground text-background relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,.14) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[150px] animate-breathe" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[140px] animate-breathe" style={{ animationDelay: '-2s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <h2 className="text-[clamp(2.8rem,6vw,5.5rem)] font-black mb-8 tracking-tighter text-background leading-[1.05]">
              Work with AI at the<br />speed of thought.
            </h2>
            <p className="text-background/60 mb-12 text-xl font-medium max-w-xl mx-auto">Start a project in minutes. No complex setup required.</p>
            <Link href="/sign-up">
              <motion.div
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-14 h-18 text-lg shadow-[0_0_60px_rgba(24,147,247,0.5)] hover:shadow-[0_0_90px_rgba(24,147,247,0.8)] rounded-full transition-all duration-300 relative overflow-hidden group border border-primary-foreground/10"
                  style={{ height: 72 }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                  Initialize Workspace
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                    <ArrowRight className="ml-3 w-6 h-6" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-background border-t border-border/40 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-3">
            <LogoFull height={26} />
            <span className="opacity-40">|</span>
            <span>
              Made with{" "}
              <span className="text-primary">&#9829;</span>
              {" "}by{" "}
              <a href="https://samertall.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-bold transition-colors">
                Samer Tallauze
              </a>
            </span>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest opacity-40">AI-Powered UX Workflow Automation</div>
        </div>
      </footer>
    </div>
  );
}
