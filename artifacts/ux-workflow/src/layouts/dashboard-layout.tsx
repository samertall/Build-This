import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  FolderPlus, 
  Settings, 
  LogOut,
  FolderOpen,
  ChevronRight,
  Menu,
  Activity,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  Map,
  Layers,
  CheckSquare,
  Presentation as PresentationIcon
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  projectId?: number;
}

export function DashboardLayout({ children, projectId }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

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
    { name: "Features", href: `/projects/${projectId}/features`, icon: LayoutDashboard },
    { name: "Tasks", href: `/projects/${projectId}/tasks`, icon: CheckSquare },
    { name: "Presentations", href: `/projects/${projectId}/presentations`, icon: PresentationIcon },
  ] : [];

  const Sidebar = () => (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 text-sidebar-primary">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-[0_0_15px_rgba(255,87,34,0.3)]">
            u
          </div>
          <span className="text-xl font-bold tracking-tight text-white">uxflow</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <span className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-sidebar-accent text-white" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-white"
                }`}>
                  {isActive && <motion.div layoutId="nav-indicator" className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />}
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {projectId && (
          <div className="mt-8">
            <div className="px-6 mb-3 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 font-mono">
              Pipeline Workspace
            </div>
            <nav className="grid gap-1 px-3">
              {projectNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <span className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 ${
                      isActive 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                    }`}>
                      {isActive && <motion.div layoutId="project-nav-indicator" className="absolute left-0 w-1 h-full bg-primary rounded-r-full" />}
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'opacity-50'}`} />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12">
              <Avatar className="h-8 w-8 border border-sidebar-border">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                <AvatarFallback className="bg-primary/20 text-primary">{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1 truncate">
                <span className="text-sm font-semibold truncate text-white">{user?.fullName}</span>
                <span className="text-xs text-sidebar-foreground/60 font-mono truncate">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-sans">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-50">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/80 backdrop-blur px-4 sm:gap-x-6 sm:px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-sidebar-border">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-[0_0_10px_rgba(255,87,34,0.3)]">
                u
              </div>
              <span className="font-bold text-lg tracking-tight">uxflow</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.main 
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
