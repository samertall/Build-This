import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import DashboardPage from "@/pages/dashboard";
import NewProjectPage from "@/pages/project-new";
import ProjectOverviewPage from "@/pages/project-overview";
import ProjectSourcesPage from "@/pages/project-sources";
import ProjectAnalyzePage from "@/pages/project-analyze";
import ProjectInsightsPage from "@/pages/project-insights";
import ProjectProblemsPage from "@/pages/project-problems";
import ProjectRecommendationsPage from "@/pages/project-recommendations";
import ProjectJourneysPage from "@/pages/project-journeys";
import ProjectFeaturesPage from "@/pages/project-features";
import ProjectTasksPage from "@/pages/project-tasks";
import ProjectPresentationsPage from "@/pages/project-presentations";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(195 100% 40%)",
    colorForeground: "hsl(222 84% 10%)",
    colorMutedForeground: "hsl(220 9% 46%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(220 14% 96%)",
    colorInputForeground: "hsl(222 84% 10%)",
    colorNeutral: "hsl(220 13% 91%)",
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-semibold tracking-tight text-xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium text-sm",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-600",
    alertText: "text-foreground",
  },
};

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
            <Route path="/projects/new"><ProtectedRoute component={NewProjectPage} /></Route>
            <Route path="/projects/:id"><ProtectedRoute component={ProjectOverviewPage} /></Route>
            <Route path="/projects/:id/sources"><ProtectedRoute component={ProjectSourcesPage} /></Route>
            <Route path="/projects/:id/analyze"><ProtectedRoute component={ProjectAnalyzePage} /></Route>
            <Route path="/projects/:id/insights"><ProtectedRoute component={ProjectInsightsPage} /></Route>
            <Route path="/projects/:id/problems"><ProtectedRoute component={ProjectProblemsPage} /></Route>
            <Route path="/projects/:id/recommendations"><ProtectedRoute component={ProjectRecommendationsPage} /></Route>
            <Route path="/projects/:id/journeys"><ProtectedRoute component={ProjectJourneysPage} /></Route>
            <Route path="/projects/:id/features"><ProtectedRoute component={ProjectFeaturesPage} /></Route>
            <Route path="/projects/:id/tasks"><ProtectedRoute component={ProjectTasksPage} /></Route>
            <Route path="/projects/:id/presentations"><ProtectedRoute component={ProjectPresentationsPage} /></Route>

            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  // Set dark mode default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
