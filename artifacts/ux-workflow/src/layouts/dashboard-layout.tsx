import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FolderPlus, 
  Settings, 
  LogOut,
  FolderOpen,
  ChevronRight,
  Menu
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
    { name: "Overview", href: `/projects/${projectId}` },
    { name: "Sources", href: `/projects/${projectId}/sources` },
    { name: "Analysis", href: `/projects/${projectId}/analyze` },
    { name: "Insights", href: `/projects/${projectId}/insights` },
    { name: "Problems", href: `/projects/${projectId}/problems` },
    { name: "Recommendations", href: `/projects/${projectId}/recommendations` },
    { name: "Journeys", href: `/projects/${projectId}/journeys` },
    { name: "Features", href: `/projects/${projectId}/features` },
    { name: "Tasks", href: `/projects/${projectId}/tasks` },
    { name: "Presentations", href: `/projects/${projectId}/presentations` },
  ] : [];

  const Sidebar = () => (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-primary">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-xl shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            u
          </div>
          <span className="text-xl font-bold tracking-tight text-white">uxflow</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}>
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {projectId && (
          <div className="mt-8">
            <div className="px-6 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Project Workspace
            </div>
            <nav className="grid gap-1 px-4">
              {projectNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <span className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive 
                        ? "bg-sidebar-primary/10 text-sidebar-primary font-medium" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}>
                      {isActive && <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-5 bg-sidebar-primary rounded-r-full" />}
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 ml-1"></span>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1 truncate">
                <span className="text-sm font-medium truncate">{user?.fullName}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
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
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                u
              </div>
              <span className="font-bold">uxflow</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
