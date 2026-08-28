import { motion, type Variants } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  accentColor?: string;
  label?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
  count?: number | null;
}

export function PageHeader({
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10 border-primary/20",
  accentColor = "bg-primary",
  label,
  title,
  description,
  right,
  count,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="relative mb-10"
    >
      {/* Ambient glow */}
      <div className="absolute -top-6 -left-6 w-40 h-40 bg-primary/6 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10">
        {label && (
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-1 h-5 rounded-full ${accentColor}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-mono">{label}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 6, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className={`w-14 h-14 rounded-2xl border ${iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}
            >
              <Icon className={`w-7 h-7 ${iconColor}`} />
            </motion.div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-foreground tracking-tighter">{title}</h1>
                {count != null && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
                    className="text-lg font-black font-mono text-muted-foreground/40"
                  >
                    {count}
                  </motion.span>
                )}
              </div>
              {description && (
                <p className="text-muted-foreground text-sm font-medium mt-1 max-w-xl">{description}</p>
              )}
            </div>
          </div>
          {right && <div className="flex-shrink-0">{right}</div>}
        </div>

        {/* Animated underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 h-[1px] bg-gradient-to-r from-primary/30 via-border/50 to-transparent origin-left"
        />
      </div>
    </motion.div>
  );
}

// Empty state for list pages
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="flex flex-col items-center justify-center py-28 text-center relative"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-breathe" />
      </div>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-3xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(24,147,247,0.12)] relative z-10"
      >
        <Icon className="w-10 h-10 text-primary/60" />
      </motion.div>
      <h3 className="text-foreground font-black text-xl mb-2 tracking-tight relative z-10">{title}</h3>
      <p className="text-muted-foreground text-sm font-medium max-w-xs leading-relaxed relative z-10">{description}</p>
    </motion.div>
  );
}

// Stagger list wrapper
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
};
