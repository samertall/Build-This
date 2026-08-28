import { SignIn } from "@clerk/react";
import { motion } from "framer-motion";
import { Brain, Layers, CheckCircle, Zap, ArrowRight } from "lucide-react";

const features = [
  { icon: Brain, label: "12 AI Agents", desc: "Running in parallel" },
  { icon: Layers, label: "Full Pipeline", desc: "End-to-end UX workflow" },
  { icon: CheckCircle, label: "Human-in-Loop", desc: "You approve every output" },
  { icon: Zap, label: "60% Faster", desc: "Synthesis to execution" },
];

export default function SignInPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div className="flex min-h-[100dvh] bg-background font-sans overflow-hidden">
      {/* Left brand panel */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[48%] relative bg-sidebar overflow-hidden flex-col justify-between p-12"
      >
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px] animate-drift" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-blue-600/15 rounded-full blur-[100px] animate-drift" style={{ animationDelay: '-8s', animationDuration: '28s' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(24,147,247,0.06)_0%,transparent_70%)]" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <motion.a
            href="/"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <img src="/build-this-logo.png" alt="Build-This" className="h-9 w-auto brightness-[10] opacity-90" />
          </motion.a>
        </div>

        {/* Center copy */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-primary/80 text-xs font-black uppercase tracking-widest font-mono mb-4">AI-Powered UX Workflow</div>
            <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tighter leading-[1.1] mb-6">
              From scattered
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-300 to-indigo-400 animate-gradient">inputs to execution.</span>
            </h2>
            <p className="text-white/50 text-base font-medium leading-relaxed max-w-sm">
              12 specialized AI agents analyze your research, surface insights, and generate production-ready outputs — all with you in control.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 mt-10">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.08, type: "spring", stiffness: 300, damping: 30 }}
                className="group flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20 group-hover:bg-primary/25 transition-colors">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-white text-sm font-bold leading-tight">{f.label}</div>
                  <div className="text-white/40 text-xs font-medium mt-0.5">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="relative z-10 flex items-center gap-2 text-white/30 text-xs font-medium"
        >
          <span>No account yet?</span>
          <a href={`${basePath}/sign-up`} className="text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-colors">
            Start free <ArrowRight className="w-3 h-3" />
          </a>
        </motion.div>
      </motion.div>

      {/* Right Clerk panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-drift" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/8 rounded-full blur-[100px] animate-drift" style={{ animationDelay: '-5s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.15 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src="/build-this-logo.png" alt="Build-This" className="h-8 w-auto" />
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-b from-primary/15 to-transparent rounded-2xl blur-md -z-10" />
            <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
