import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useAuth, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { basePath } from "@/lib/routing";
import { PresentationOrderTestPage } from "@/pages/project-presentations";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { PrivacyPage, TermsPage, SupportPage } from "@/pages/legal";

import LandingPage from "@/pages/landing";
const SignInPage = lazy(() => import("@/pages/sign-in"));
const SignUpPage = lazy(() => import("@/pages/sign-up"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const NewProjectPage = lazy(() => import("@/pages/project-new"));
const ProjectOverviewPage = lazy(() => import("@/pages/project-overview"));
const ProjectSourcesPage = lazy(() => import("@/pages/project-sources"));
const ProjectAnalyzePage = lazy(() => import("@/pages/project-analyze"));
const ProjectInsightsPage = lazy(() => import("@/pages/project-insights"));
const ProjectProblemsPage = lazy(() => import("@/pages/project-problems"));
const ProjectRecommendationsPage = lazy(() => import("@/pages/project-recommendations"));
const ProjectJourneysPage = lazy(() => import("@/pages/project-journeys"));
const ProjectFeaturesPage = lazy(() => import("@/pages/project-features"));
const ProjectTasksPage = lazy(() => import("@/pages/project-tasks"));
const ProjectPresentationsPage = lazy(() => import("@/pages/project-presentations"));

const queryClient = new QueryClient();
const presentationOrderTestMode =
  import.meta.env.VITE_PRESENTATION_ORDER_TEST_MODE === "true";
const teamReviewTestMode =
  import.meta.env.VITE_TEAM_REVIEW_TEST_MODE === "true";

// Only measure public pages. Project paths and authentication URLs can contain
// private IDs, tokens, or query strings that must not reach analytics.
const publicAnalyticsPaths = new Set(["/", "/privacy", "/terms", "/support"]);
function publicPageAnalyticsOnly(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);
    if (!publicAnalyticsPaths.has(url.pathname)) return null;
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey && !presentationOrderTestMode && !teamReviewTestMode) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "#1893F7",
    colorForeground: "hsl(215 50% 15%)",
    colorMutedForeground: "hsl(215 25% 45%)",
    colorDanger: "hsl(350 84% 60%)",
    colorBackground: "hsl(212 100% 98%)",
    colorInput: "hsl(212 30% 88%)",
    colorInputForeground: "hsl(215 50% 15%)",
    colorNeutral: "hsl(212 30% 88%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-[0_16px_40px_rgba(24,147,247,0.1)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-black tracking-tight text-3xl",
    headerSubtitle: "text-muted-foreground font-medium",
    socialButtonsBlockButtonText: "text-foreground font-bold",
    formFieldLabel: "text-foreground font-bold text-sm",
    footerActionLink: "text-primary hover:text-primary/80 font-bold",
    footerActionText: "text-muted-foreground font-medium",
    dividerText: "text-muted-foreground text-xs font-bold uppercase tracking-wider",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-foreground",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md",
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

/**
 * API routes run in a separate Vercel project behind the frontend rewrite.
 * Passing Clerk's short-lived session JWT explicitly prevents login UI state
 * from succeeding while the backend sees every API request as anonymous.
 * React layout effects configure the shared API client before page queries.
 */
function ClerkApiSessionBridge() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useLayoutEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setAuthTokenGetter(null);
      return;
    }

    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded, isSignedIn]);

  return null;
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
        <ClerkApiSessionBridge />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <MotionConfig reducedMotion="user">
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Switch>
                <Route path="/" component={HomeRedirect} />
                <Route path="/sign-in/*?" component={SignInPage} />
                <Route path="/sign-up/*?" component={SignUpPage} />
                <Route path="/privacy" component={PrivacyPage} />
                <Route path="/terms" component={TermsPage} />
                <Route path="/support" component={SupportPage} />

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
            </Suspense>
          </MotionConfig>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function PresentationOrderTestRoutes() {
  return (
    <Switch>
      <Route
        path="/projects/:id/presentations"
        component={PresentationOrderTestPage}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function BrowserTestRoutes() {
  return (
    <Switch>
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/support" component={SupportPage} />
      <Route
        path="/projects/:id/presentations"
        component={PresentationOrderTestPage}
      />
      <Route path="/projects/:id" component={ProjectOverviewPage} />
      <Route path="/projects/:id/insights" component={ProjectInsightsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function BrowserTestModeWithRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MotionConfig reducedMotion="user">
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <BrowserTestRoutes />
          </Suspense>
        </MotionConfig>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  useEffect(() => {
    // Restore theme from localStorage, default to light
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <WouterRouter base={basePath}>
      {presentationOrderTestMode || teamReviewTestMode ? (
        <BrowserTestModeWithRoutes />
      ) : (
        <ClerkProviderWithRoutes />
      )}
      {!presentationOrderTestMode && !teamReviewTestMode && (
        <Analytics beforeSend={publicPageAnalyticsOnly} />
      )}
    </WouterRouter>
  );
}

export default App;
