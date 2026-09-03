import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  FolderPlus, 
  LogOut,
  FolderOpen,
  Menu,
  Activity,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  Map,
  CheckSquare,
  Presentation as PresentationIcon,
  Sun,
  Moon,
  Layers,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  projectId?: number;
}

interface DashboardUser {
  imageUrl?: string;
  fullName?: string | null;
  firstName?: string | null;
  emailAddress?: string;
}

interface DashboardLayoutContentProps extends DashboardLayoutProps {
  user: DashboardUser;
  signOut: () => void | Promise<void>;
}

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDark(isDark);
  };
  return { dark, toggle };
}

function DashboardLayoutContent({ children, projectId, user, signOut }: DashboardLayoutContentProps) {
  const [location] = useLocation();
  const { dark, toggle } = useDarkMode();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "New Project", href: "/projects/new", icon: FolderPlus },
  ];

  const projectNavigation = projectId ? [
    { name: "Overview", href: `/projects/${projectId}`, icon: FolderOpen },
    { name: "Sources", href: `/projects/${projectId}/sources`, icon: Layers },
    { name: "Analysis", href: `/projects/${projectId}/analyze`, icon: Activity },
    { name: "Insights", href: `/projects/${projectId}/insights`, icon: Lightbulb },
    { name: "Problems", href: `/projects/${projectId}/problems`, icon: AlertCircle },
    { name: "Recommendations", href: `/projects/${projectId}/recommendations`, icon: TrendingUp },
    { name: "Journeys", href: `/projects/${projectId}/journeys`, icon: Map },
    { name: "Features", href: `/projects/${projectId}/features`, icon: Star },
    { name: "Tasks", href: `/projects/${projectId}/tasks`, icon: CheckSquare },
    { name: "Presentations", href: `/projects/${projectId}/presentations`, icon: PresentationIcon },
  ] : [];

  const LogoMark = ({ size = 36 }: { size?: number }) => (
    <div
      className="flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <img
        src="/build-this-logo.png"
        alt=""
        style={{
          height: size,
          width: "auto",
          objectFit: "cover",
          objectPosition: "left center",
          display: "block",
        }}
      />
    </div>
  );

  const Sidebar = () => (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border relative overflow-hidden">
      {/* Subtle ambient glow in sidebar */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-32 bg-primary/10 blur-3xl pointer-events-none" />
      
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-sidebar-border/50 relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <LogoMark />
          <span className="text-lg font-black tracking-tight text-white truncate mt-0.5">Build-This</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-5 relative z-10">
        <nav className="grid gap-1 px-3 relative">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <span className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  isActive 
                    ? "text-white" 
                    : "text-sidebar-foreground/70 hover:text-white"
                }`}>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-sidebar-accent/80 rounded-xl -z-10 shadow-[0_4px_12px_rgba(24,147,247,0.1)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-sidebar-accent/0 rounded-xl -z-10 transition-colors duration-300 group-hover:bg-sidebar-accent/40" />
                  )}
                  {isActive && <motion.div layoutId="nav-indicator" className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(24,147,247,0.6)]" />}
                  <item.icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-primary scale-110' : 'opacity-70 group-hover:scale-110 group-hover:text-primary/70'}`} />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {projectId && (
          <div className="mt-8">
            <div className="px-6 mb-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 font-mono">
              Project Pipeline
            </div>
            <nav className="grid gap-0.5 px-3 relative">
              {projectNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <span className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-300 ${
                      isActive 
                        ? "text-primary font-bold"
                        : "text-sidebar-foreground/70 font-semibold hover:text-white"
                    }`}>
                      {isActive && (
                        <motion.div 
                          layoutId="project-active-pill"
                          className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 bg-sidebar-accent/0 rounded-lg -z-10 transition-colors duration-300 group-hover:bg-sidebar-accent/40" />
                      )}
                      {isActive && <motion.div layoutId="project-nav-indicator" className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(24,147,247,0.6)]" />}
                      <item.icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-primary scale-110' : 'opacity-50 group-hover:scale-110 group-hover:text-primary/70'}`} />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border/50 space-y-2 relative z-10 bg-sidebar/50 backdrop-blur-md">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          className="w-full group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-sidebar-foreground/70 hover:text-white transition-all duration-300"
        >
          <div className="absolute inset-0 bg-sidebar-accent/0 rounded-xl -z-10 transition-colors duration-300 group-hover:bg-sidebar-accent/50" />
          <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            {dark ? <Sun className="h-4 w-4 flex-shrink-0 group-hover:text-amber-400 transition-colors" /> : <Moon className="h-4 w-4 flex-shrink-0 group-hover:text-blue-300 transition-colors" />}
          </motion.div>
          {dark ? "Light mode" : "Dark mode"}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 rounded-xl group transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors -z-10" />
              <Avatar className="h-8 w-8 border border-sidebar-border flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-sm group-hover:shadow-[0_0_12px_rgba(24,147,247,0.3)]">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-black">{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="text-sm font-bold truncate text-white w-full">{user?.fullName}</span>
                <span className="text-xs text-sidebar-foreground/60 font-mono truncate w-full group-hover:text-sidebar-foreground/80 transition-colors">{user.emailAddress}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-sans rounded-xl shadow-lg border-border">
            <DropdownMenuLabel className="font-bold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer group font-semibold rounded-lg">
              <LogOut className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background font-sans selection:bg-primary/30 selection:text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-50">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 hover:bg-primary/10 hover:text-primary transition-colors">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-sidebar-border">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="transition-transform duration-300 group-hover:scale-105">
                <LogoMark size={32} />
              </div>
              <span className="font-black text-lg tracking-tight group-hover:text-primary transition-colors mt-0.5">Build-This</span>
            </Link>
            <button
              onClick={toggle}
              className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
            >
              <motion.div whileTap={{ rotate: 180 }}>
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.main 
            key={location}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 flex flex-col relative"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ClerkDashboardLayout(props: DashboardLayoutProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <DashboardLayoutContent
      {...props}
      user={{
        imageUrl: user?.imageUrl,
        fullName: user?.fullName,
        firstName: user?.firstName,
        emailAddress: user?.primaryEmailAddress?.emailAddress,
      }}
      signOut={signOut}
    />
  );
}

export function DashboardLayout(props: DashboardLayoutProps) {
  if (import.meta.env.VITE_TEAM_REVIEW_TEST_MODE === "true") {
    return (
      <DashboardLayoutContent
        {...props}
        user={{
          fullName: "Team Review Owner",
          firstName: "Team",
          emailAddress: "team-review-owner@example.com",
        }}
        signOut={() => undefined}
      />
    );
  }

  return <ClerkDashboardLayout {...props} />;
}
