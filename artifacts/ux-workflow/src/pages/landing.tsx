import { Link } from "wouter";
import { motion, useScroll, useTransform, useMotionValue, useSpring, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Brain, Target, BarChart3, CheckCircle, Cpu, FlaskConical, Route, Star, ListChecks, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const wordReveal: Variants = {
  hidden: { opacity: 0, y: 30, rotateX: -15 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const agents = [
  { name: "Research Synthesis", icon: FlaskConical, desc: "Clusters insights from disparate research sources.", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  { name: "Problem Framing", icon: Target, desc: "Converts findings into clear problem statements.", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { name: "UX Strategy", icon: Lightbulb, desc: "Generates evidence-linked strategic recommendations.", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { name: "Journey & Flow", icon: Route, desc: "Maps current and future state user journeys.", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { name: "Feature Prioritization", icon: Star, desc: "RICE-scored backlog with MoSCoW priorities.", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Task Orchestration", icon: ListChecks, desc: "Generates team-ready tasks with acceptance criteria.", color: "text-blue-600 bg-blue-600/10 border-blue-600/20" },
];

const roles = [
  { role: "UX Designers", icon: Brain, color: "from-blue-500 to-indigo-500", outputs: ["User personas", "Journey maps", "Wireframe directions", "Heuristic reports"] },
  { role: "Product Managers", icon: Target, color: "from-amber-500 to-orange-500", outputs: ["Feature priorities", "RICE scores", "User stories", "Roadmaps"] },
  { role: "Developers", icon: Cpu, color: "from-teal-500 to-emerald-500", outputs: ["Dev tickets", "Acceptance criteria", "Edge cases", "Technical specs"] },
  { role: "Stakeholders", icon: BarChart3, color: "from-rose-500 to-pink-500", outputs: ["Executive summaries", "Business impact", "Slide decks", "KPIs"] },
];

const steps = [
  { number: "01", label: "Upload Context", desc: "Research notes, goals, analytics, and references." },
  { number: "02", label: "AI Synthesis", desc: "Six analysis stages explore gaps and opportunities." },
  { number: "03", label: "Review & Approve", desc: "Human-in-the-loop sign-off for every insight." },
  { number: "04", label: "Execute", desc: "Tasks and slide decks land in your workflow." },
];

const capabilities = [
  { value: "6", label: "Analysis stages" },
  { value: "4", label: "Workflow steps" },
  { value: "2", label: "Deck export formats" },
  { value: "You", label: "Final approval" },
];

function LogoFull({ height = 36 }: { height?: number }) {
  return <img src="/build-this-logo.png" alt="Build-This" style={{ height: `${height}px`, width: "auto" }} />;
}

function CapabilityStat({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      className="text-center group cursor-default"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="text-5xl md:text-6xl font-black text-primary mb-3 tracking-tighter flex items-center justify-center number-glow"
      >
        {value}
      </motion.div>
      <div className="text-xs md:text-sm text-muted-foreground font-black uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

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
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 180]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  const [activeRole, setActiveRole] = useState(0);
  useEffect(() => {
    if (shouldReduceMotion) return;
    const t = setInterval(() => setActiveRole(r => (r + 1) % roles.length), 3500);
    return () => clearInterval(t);
  }, [shouldReduceMotion]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <LogoFull height={32} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex items-center gap-4"
          >
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-bold text-sm hidden sm:flex hover:bg-primary/10 hover:text-primary">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
                <Button size="sm" className="font-black shadow-[0_4px_20px_rgba(24,147,247,0.3)] hover:shadow-[0_6px_28px_rgba(24,147,247,0.5)] transition-shadow rounded-full px-6 h-10">
                  Start free
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden flex flex-col items-center min-h-[100dvh]">
        <div className="absolute inset-0 mesh-grid opacity-60 pointer-events-none" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] left-[15%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[140px] animate-drift" />
          <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-drift" style={{ animationDelay: '-7s', animationDuration: '26s' }} />
          <div className="absolute top-[60%] left-[40%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[100px] animate-drift" style={{ animationDelay: '-14s', animationDuration: '32s' }} />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-6xl mx-auto w-full relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 mt-12"
        >
          {/* Left Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Badge
                variant="outline"
                className="mb-8 bg-background/80 backdrop-blur-md text-primary border-primary/30 px-5 py-2 text-[10px] md:text-xs font-black tracking-widest uppercase font-mono shadow-[0_0_24px_rgba(24,147,247,0.15)] cursor-default"
              >
                <motion.span
                  animate={shouldReduceMotion ? undefined : { opacity: [1, 0.5, 1] }}
                  transition={shouldReduceMotion ? undefined : { duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-primary inline-block mr-2.5"
                />
                Agentic UX Pipeline
              </Badge>
            </motion.div>

            <motion.h1
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-[1.05] tracking-tighter text-foreground mb-6"
              style={{ perspective: 1000 }}
            >
              <span className="block overflow-hidden pb-2">
                {"Turn messy inputs".split(" ").map((word, i) => (
                  <motion.span key={i} variants={wordReveal} className="inline-block mr-[0.25em]">{word}</motion.span>
                ))}
              </span>
              <span className="block overflow-hidden">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-500 animate-gradient pb-2 inline-block">
                  {"into pure execution.".split(" ").map((word, i) => (
                    <motion.span key={i} variants={wordReveal} className="inline-block mr-[0.25em]">{word}</motion.span>
                  ))}
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed font-semibold"
            >
              An agentic workspace that synthesizes research, prioritizes features, and builds stakeholder decks automatically.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 relative z-20"
            >
              <Link href="/sign-up">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="font-black px-10 h-14 text-base shadow-[0_0_40px_rgba(24,147,247,0.4)] hover:shadow-[0_0_64px_rgba(24,147,247,0.6)] transition-all duration-300 rounded-full group"
                  >
                    Start your pipeline
                    <motion.span
                      animate={shouldReduceMotion ? undefined : { x: [0, 4, 0] }}
                      transition={shouldReduceMotion ? undefined : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </motion.span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Right Mock UI */}
          <motion.div
            className="flex-1 w-full max-w-lg hidden md:block"
            initial={{ opacity: 0, x: 40, rotateY: 20 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: 1000 }}
          >
            <TiltCard>
              <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

                <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-foreground">AI Synthesis Complete</div>
                    <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">48 Insights Extracted</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { tag: "Priority", text: "Users abandon checkout due to complex address validation." },
                    { tag: "Opportunity", text: "Mobile interface lacks clear step indicators." },
                    { tag: "Friction", text: "Guest checkout is hidden behind sign-in wall." }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + (i * 0.15) }}
                      className="bg-background/60 border border-border/60 p-4 rounded-2xl flex gap-4 items-start"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                      <div>
                        <span className="text-[9px] font-black font-mono uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md mb-2 inline-block">{item.tag}</span>
                        <p className="text-sm font-semibold text-foreground leading-snug">{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 }}
                  className="mt-6 pt-4 border-t border-border/50 flex justify-end"
                >
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    Approve Insights
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-70">Example</span>
                  </div>
                </motion.div>
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Verified product capabilities, not unsubstantiated outcomes ── */}
      <section className="py-24 px-6 border-y border-border/40 bg-card/60 relative z-20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-6">
          {capabilities.map((capability) => (
            <CapabilityStat key={capability.label} {...capability} />
          ))}
        </div>
      </section>

      {/* ── Workflow Steps ── */}
      <section className="py-32 px-6 bg-background relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-[900px] h-[900px] bg-primary/5 rounded-full blur-[180px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center mb-24">
            <Badge variant="outline" className="mb-6 bg-secondary/50 text-secondary-foreground border-border text-[10px] uppercase tracking-widest font-mono font-black py-1.5 px-4">
              How it works
            </Badge>
            <h2 className="text-[clamp(2.4rem,5vw,4.5rem)] font-black text-foreground mb-6 tracking-tighter">Four steps to execution</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-semibold">The entire UX workflow — from scattered inputs to team-ready outputs — in one structured space.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 180 }}
                className="relative z-10 group"
              >
                <div className="bg-card border border-border/80 rounded-3xl p-8 h-full relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-primary/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-transparent group-hover:from-primary/5 transition-all duration-700" />
                  <div className="text-6xl font-black leading-none tracking-tighter text-muted-foreground/10 mb-6 group-hover:text-primary/20 transition-colors duration-500 select-none font-mono">
                    {s.number}
                  </div>
                  <h3 className="text-foreground font-black text-xl mb-3 tracking-tight">{s.label}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-semibold">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Six implemented analysis stages ── */}
      <section className="py-32 px-6 bg-card border-y border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center mb-20">
            <Badge variant="outline" className="mb-6 bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-widest font-mono font-black px-4 py-1.5 shadow-sm">
              6 AI Analysis Stages
            </Badge>
            <h2 className="text-[clamp(2.4rem,5vw,4.5rem)] font-black text-foreground mb-6 tracking-tighter">Specialized intelligence</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-semibold">Each stage focuses on a UX discipline. Stages run in sequence to generate reviewable outputs.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: (i % 8) * 0.05, type: "spring" }}
                className="group relative"
              >
                <div className="bg-background/80 backdrop-blur-sm border border-border/80 rounded-2xl p-6 h-full flex flex-col relative transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${agent.color}`}>
                    <agent.icon className="w-6 h-6" />
                  </div>
                  <div className="text-foreground font-black text-base mb-2 tracking-tight group-hover:text-primary transition-colors duration-200">{agent.name}</div>
                  <div className="text-muted-foreground text-sm leading-relaxed font-semibold">{agent.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-32 px-6 bg-background relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center mb-16">
            <Badge variant="outline" className="mb-6 bg-secondary/50 border-border text-[10px] uppercase tracking-widest font-mono font-black px-4 py-1.5">Built For</Badge>
            <h2 className="text-[clamp(2.4rem,5vw,4.5rem)] font-black text-foreground mb-6 tracking-tighter">Every voice in the room</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-semibold">One pipeline, purpose-built outputs for every discipline.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-4">
              {roles.map((role, i) => (
                <motion.button
                  key={role.role}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setActiveRole(i)}
                  className={`relative flex items-center gap-5 p-5 rounded-3xl text-left transition-all duration-300 border-2 ${
                    activeRole === i
                      ? "bg-card border-primary/30 shadow-[0_8px_30px_rgba(24,147,247,0.12)]"
                      : "border-transparent hover:bg-card/50 hover:border-border/50"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 ${activeRole === i ? "scale-110" : ""}`}>
                    <role.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className={`font-black text-lg tracking-tight transition-colors ${activeRole === i ? "text-primary" : "text-foreground"}`}>{role.role}</div>
                    <div className="text-sm text-muted-foreground font-semibold mt-1">{role.outputs.length} output types</div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="lg:pl-8">
              <motion.div
                key={activeRole}
                initial={{ opacity: 0, x: 20, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="bg-card border border-border/80 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-xl"
              >
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${roles[activeRole].color} opacity-[0.08] blur-[80px] pointer-events-none rounded-full`} />
                <div className="flex items-center gap-5 mb-10 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roles[activeRole].color} flex items-center justify-center shadow-lg`}>
                    {(() => { const Icon = roles[activeRole].icon; return <Icon className="w-8 h-8 text-white" />; })()}
                  </div>
                  <div>
                    <div className="font-black text-2xl text-foreground tracking-tight">{roles[activeRole].role}</div>
                    <div className="text-sm text-muted-foreground font-semibold mt-1 uppercase tracking-widest font-mono">AI-Generated Outputs</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  {roles[activeRole].outputs.map((output, i) => (
                    <motion.div
                      key={output}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-background border border-border group hover:border-primary/40 hover:shadow-md transition-all duration-200"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 group-hover:scale-150 transition-transform" />
                      <span className="text-sm font-bold text-foreground">{output}</span>
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
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <Badge variant="outline" className="mb-6 bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-widest font-mono font-black px-4 py-1.5">Human-in-the-Loop</Badge>
            <h2 className="text-[clamp(2.4rem,5vw,5rem)] font-black text-foreground mb-6 tracking-tighter">
              AI proposes.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">You decide.</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed font-semibold">
              Review and approve AI-generated insights, problem statements, and recommendations before sharing them with your team.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 text-center text-muted-foreground border-t border-border/40 bg-background text-sm font-semibold">
        <p>© {new Date().getFullYear()} Build-This UX Pipeline. Agentic workflows for product teams.</p>
        <nav aria-label="Legal and support" className="mt-5 flex flex-wrap justify-center gap-x-7 gap-y-3">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
        </nav>
      </footer>
    </div>
  );
}
