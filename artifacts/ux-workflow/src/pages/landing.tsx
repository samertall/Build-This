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
  { name: "Project Context", icon: Layers, color: "text-cyan-400", desc: "Structures your inputs into a coherent project framework" },
  { name: "Research Synthesis", icon: FlaskConical, color: "text-blue-400", desc: "Clusters insights from disparate research sources" },
  { name: "Problem Framing", icon: Target, color: "text-purple-400", desc: "Converts findings into clear, actionable problem statements" },
  { name: "UX Strategy", icon: Lightbulb, color: "text-teal-400", desc: "Generates evidence-linked strategic recommendations" },
  { name: "Journey & Flow", icon: Route, color: "text-indigo-400", desc: "Maps current and future state user journeys" },
  { name: "Feature Prioritization", icon: Star, color: "text-orange-400", desc: "RICE-scored backlog with MoSCoW prioritization" },
  { name: "Information Architecture", icon: GitBranch, color: "text-sky-400", desc: "Structures content hierarchy and navigation logic" },
  { name: "Wireframe Direction", icon: Workflow, color: "text-violet-400", desc: "Generates layout rationale and component specs" },
  { name: "Content & SEO", icon: Search, color: "text-green-400", desc: "Identifies content gaps and SEO opportunities" },
  { name: "Task Orchestration", icon: ListChecks, color: "text-yellow-400", desc: "Generates team-ready tasks with acceptance criteria" },
  { name: "Presentation", icon: Presentation, color: "text-pink-400", desc: "Auto-generates stakeholder-ready slide decks" },
  { name: "Quality & Governance", icon: CheckCircle, color: "text-emerald-400", desc: "Validates outputs against UX standards and heuristics" },
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,8%)] text-[hsl(210,40%,96%)] font-['Space_Grotesk',sans-serif]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[hsl(222,47%,8%)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-semibold text-white tracking-tight">uxflow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/5">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold">
                Start free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <Badge className="mb-6 bg-cyan-400/10 text-cyan-400 border-cyan-400/20 px-4 py-1.5 text-xs font-medium tracking-wider uppercase">
              Agentic AI for UX Teams
            </Badge>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-white mb-6">
            From Scattered UX Inputs<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              to Clear Product Execution.
            </span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
            An agentic AI workspace that analyzes research, business goals, content, and design material — then generates UX insights, user flows, feature priorities, actionable tasks, and professional presentations.
          </motion.p>
          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold px-8 h-12 text-base">
                Start a UX Project <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white h-12 px-8 text-base">
                View the Demo
              </Button>
            </Link>
          </motion.div>
          <motion.p initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="mt-6 text-sm text-white/40">
            Built for designers, product managers, developers, marketers, and business leaders.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
              className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">{s.value}</div>
              <div className="text-sm text-white/50">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge className="mb-4 bg-purple-400/10 text-purple-400 border-purple-400/20 text-xs uppercase tracking-wider">How it works</Badge>
            <h2 className="text-4xl font-bold text-white mb-4">Four steps from input to execution</h2>
            <p className="text-white/50 max-w-xl mx-auto">No more losing context between tools. The entire UX workflow lives in one structured, AI-powered workspace.</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.number} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="relative group">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent z-0" />
                )}
                <div className="relative z-10 bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-cyan-400/20 transition-colors">
                  <div className="text-5xl font-bold text-white/5 mb-4 leading-none">{s.number}</div>
                  <h3 className="text-white font-semibold mb-2">{s.label}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 Agents */}
      <section className="py-24 px-6 bg-white/2">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/20 text-xs uppercase tracking-wider">12 AI Agents</Badge>
            <h2 className="text-4xl font-bold text-white mb-4">Specialized intelligence at every stage</h2>
            <p className="text-white/50 max-w-xl mx-auto">Each agent is purpose-built for a specific UX discipline. They work in sequence, feeding context forward.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <motion.div key={agent.name} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 6} variants={fadeUp}
                className="flex items-start gap-4 bg-white/3 border border-white/8 rounded-xl p-5 hover:border-white/15 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <agent.icon className={`w-4 h-4 ${agent.color}`} />
                </div>
                <div>
                  <div className="text-white font-medium text-sm mb-1">{agent.name}</div>
                  <div className="text-white/45 text-xs leading-relaxed">{agent.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-400/10 text-indigo-400 border-indigo-400/20 text-xs uppercase tracking-wider">Multi-Role</Badge>
            <h2 className="text-4xl font-bold text-white mb-4">One platform, every team member</h2>
            <p className="text-white/50 max-w-xl mx-auto">Each role gets exactly what they need — no translation layer, no manual reformatting.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {roles.map((r, i) => (
              <motion.div key={r.role} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-colors">
                <r.icon className="w-6 h-6 text-cyan-400 mb-3" />
                <div className="font-semibold text-white text-sm mb-3">{r.role}</div>
                <ul className="space-y-1.5">
                  {r.outputs.map(o => (
                    <li key={o} className="flex items-center gap-2 text-xs text-white/50">
                      <ChevronRight className="w-3 h-3 text-cyan-400/50 flex-shrink-0" />
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
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-cyan-500/3 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Badge className="mb-6 bg-green-400/10 text-green-400 border-green-400/20 text-xs uppercase tracking-wider">Human-in-the-Loop</Badge>
            <h2 className="text-4xl font-bold text-white mb-6">AI proposes. You decide.</h2>
            <p className="text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
              Every insight, problem statement, and recommendation requires explicit approval before it becomes actionable. The AI works fast — you stay in control. Approve, reject, or refine anything the agents generate.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              {[
                { status: "Pending", color: "text-yellow-400 border-yellow-400/20 bg-yellow-400/8", desc: "AI-generated, awaiting your review" },
                { status: "Approved", color: "text-green-400 border-green-400/20 bg-green-400/8", desc: "Validated and ready for execution" },
                { status: "Rejected", color: "text-red-400 border-red-400/20 bg-red-400/8", desc: "Flagged and excluded from outputs" },
              ].map(s => (
                <div key={s.status} className={`rounded-xl border p-5 ${s.color}`}>
                  <div className="font-semibold mb-1">{s.status}</div>
                  <div className="text-xs text-white/50">{s.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 flex items-center justify-center mx-auto mb-6">
              <Users className="w-7 h-7 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">About this project</h2>
            <p className="text-white/55 leading-relaxed mb-6">
              Created by <span className="text-white font-medium">Samer Tallauze</span> — Senior UX/UI Product Designer | Front-End | SEO | CX. This platform is a working demonstration of agentic AI applied to UX workflow automation.
            </p>
            <p className="text-white/40 text-sm">
              The goal: replace the fragmented stack of spreadsheets, Miro boards, Notion docs, and slide decks with a single intelligent workspace that does the heavy lifting — while keeping designers and product teams firmly in control of every decision.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl font-bold text-white mb-4">Ready to work with AI at the speed of thought?</h2>
            <p className="text-white/50 mb-8">Start a project in minutes. No setup required.</p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-[hsl(222,47%,8%)] font-semibold px-10 h-12 text-base">
                Start a UX Project <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400/50" />
            <span>uxflow by Samer Tallauze</span>
          </div>
          <div>AI-Powered UX Workflow Automation for Smarter Digital Product Design</div>
        </div>
      </footer>
    </div>
  );
}
