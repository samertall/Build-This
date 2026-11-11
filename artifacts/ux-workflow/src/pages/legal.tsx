import { Link } from "wouter";
import { useEffect } from "react";
import { ArrowLeft, ArrowUpRight, LifeBuoy, LockKeyhole, Scale } from "lucide-react";

type Section = { heading: string; paragraphs: string[] };

function PublicInformationPage({
  title,
  description,
  icon: Icon,
  sections,
}: {
  title: string;
  description: string;
  icon: typeof LockKeyhole;
  sections: Section[];
}) {
  useEffect(() => {
    const originalTitle = document.title;
    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const originalDescription = metaDescription?.content;
    const originalCanonical = canonical?.href;
    document.title = `${title} | Build-This`;
    if (metaDescription) metaDescription.content = description;
    if (canonical) canonical.href = `https://app.samertall.com${window.location.pathname}`;
    return () => {
      document.title = originalTitle;
      if (metaDescription && originalDescription !== undefined) metaDescription.content = originalDescription;
      if (canonical && originalCanonical) canonical.href = originalCanonical;
    };
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/95">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Build-This homepage">
            <img src="/build-this-logo.png" alt="Build-This" className="h-8 w-auto" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon size={23} aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{description}</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Last updated: November 11, 2026
        </p>

        <div className="mt-12 space-y-9">
          {sections.map(({ heading, paragraphs }) => (
            <section key={heading} aria-labelledby={heading.replace(/\s+/g, "-").toLowerCase()}>
              <h2 id={heading.replace(/\s+/g, "-").toLowerCase()} className="mb-3 text-xl font-extrabold tracking-tight">{heading}</h2>
              {paragraphs.map((paragraph) => (
                <p key={paragraph} className="mb-3 text-[15px] leading-7 text-muted-foreground">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="text-base font-bold">Questions about Build-This?</h2>
          <p className="mb-3 mt-2 text-sm leading-6 text-muted-foreground">
            Please contact the product owner through the portfolio below. Include the subject of your request and the email associated with your account if applicable.
          </p>
          <a className="inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline" href="https://samertall.com" target="_blank" rel="noopener noreferrer">
            Samer Tallauze — Portfolio <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </main>

      <footer className="border-t border-border/70 px-6 py-7">
        <nav aria-label="Legal and support" className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary">Privacy</Link>
          <Link href="/terms" className="hover:text-primary">Terms</Link>
          <Link href="/support" className="hover:text-primary">Support</Link>
        </nav>
      </footer>
    </div>
  );
}

export function PrivacyPage() {
  return <PublicInformationPage title="Privacy policy" icon={LockKeyhole} description="How Build-This handles the information you provide when using its research and AI workflow." sections={[
    { heading: "Who operates the service", paragraphs: ["Build-This is a product developed by Samer Tallauze. This policy describes the current web application at app.samertall.com."] },
    { heading: "Information processed", paragraphs: ["When you create an account, our authentication provider processes sign-in information such as your email address and account identifiers. We also process the projects, research notes, sources, team invitations, comments, and other content you choose to submit.", "We may process technical data needed to keep the application working, such as request logs, errors, and essential authentication cookies."] },
    { heading: "How information is used", paragraphs: ["We use account data to provide access and protect workspaces. We use project content to store and display your work, support collaboration, and generate the outputs you explicitly request.", "When you run an AI analysis, relevant project context and source content are sent to the configured AI provider to generate a response. Do not upload sensitive personal, confidential, or regulated information unless you have appropriate authorization and have assessed this processing."] },
    { heading: "Service providers", paragraphs: ["Build-This uses Clerk for authentication, Neon for application data storage, Vercel for hosting and delivery, and OpenAI for AI generation. These providers process information only to the extent needed for their respective roles. Their own policies and applicable terms also govern their services."] },
    { heading: "Analytics and cookies", paragraphs: ["Essential authentication technologies are used to keep you signed in. If enabled, privacy-focused page-view analytics help us understand which public pages are used. We do not intentionally include your project text, research content, or account identifiers in analytics events."] },
    { heading: "Security and retention", paragraphs: ["We apply authentication and project-level access checks to protect user content, but no online service can guarantee absolute security. We retain application data for as long as it is needed to operate the service or meet applicable obligations. A fixed account-data retention period has not been established; contact the operator for deletion questions."] },
    { heading: "Your choices", paragraphs: ["You can edit or remove projects through features provided in the application. To request access, correction, or deletion of other personal data, contact the operator using the details below. Some requests may require identity verification and may be subject to legal obligations."] },
    { heading: "Changes", paragraphs: ["We may update this policy as the application evolves. Material changes will be reflected in this page's update date."] },
  ]} />;
}

export function TermsPage() {
  return <PublicInformationPage title="Terms of use" icon={Scale} description="Ground rules for using Build-This as a collaborative, AI-assisted product workflow." sections={[
    { heading: "About the service", paragraphs: ["Build-This helps product teams organize research, review AI-assisted findings, prioritize features, and prepare deliverables. Features may evolve or become unavailable while the product is developed."] },
    { heading: "Accounts and access", paragraphs: ["You are responsible for maintaining access to your account and for activity performed through it. Only invite people who are authorized to access the information in your workspace."] },
    { heading: "Your content and permissions", paragraphs: ["You remain responsible for the material you upload or submit. You confirm that you have the necessary rights and permissions to provide it. You grant Build-This permission to host, process, and transmit the content to relevant service providers to deliver the functions you request."] },
    { heading: "AI-generated results", paragraphs: ["AI outputs can be incomplete, inaccurate, or misleading. You must review and validate generated insights, decisions, priorities, and deliverables before relying on them. Build-This is an assistance tool; it does not replace professional judgment or research validation."] },
    { heading: "Acceptable use", paragraphs: ["Do not use the service to break the law, infringe others' rights, access projects without authorization, disrupt systems, or upload harmful code. Do not submit personal or regulated information unless you have a lawful basis and appropriate authorization."] },
    { heading: "Availability and limits", paragraphs: ["The service is offered on an evolving basis without a guaranteed uptime or service level. AI analysis may be restricted by daily usage limits to protect reliability and control operating costs. The application may temporarily restrict abusive or unsafe activity."] },
    { heading: "No professional advice", paragraphs: ["Generated analysis, prioritization, and templates are informational. You are responsible for the business, design, engineering, legal, and other decisions made using them."] },
    { heading: "Contact and changes", paragraphs: ["Contact the operator for questions about these terms. Terms may be updated as the product evolves, with the updated date shown above."] },
  ]} />;
}

export function SupportPage() {
  return <PublicInformationPage title="Help and support" icon={LifeBuoy} description="Quick answers and the best way to get help using Build-This." sections={[
    { heading: "Sign-in and account access", paragraphs: ["If you cannot sign in, first check that you are using the same email or social login method you originally used. If the issue persists, send the error message and approximate time to the product owner; never send passwords or one-time codes."] },
    { heading: "Running an AI analysis", paragraphs: ["Add a clear project brief and relevant sources, then select the analysis stages you need. AI analysis uses a shared service budget. If you reach a daily limit, retry the next day (UTC). If another analysis is running, wait for it to complete before trying again."] },
    { heading: "Review and export", paragraphs: ["Review and approve outputs before sharing with others. Confirm exported slide decks and reports reflect your actual project data and intended decisions."] },
    { heading: "Report a bug or request assistance", paragraphs: ["Describe the affected page, the steps to reproduce, what you expected, and what happened. A screenshot can help, but remove project secrets, personal data, and credentials before sharing it."] },
    { heading: "Privacy and data requests", paragraphs: ["For requests about access to or removal of personal information, contact the operator through the portfolio link below and identify the account involved. Do not include passwords or sensitive project content in the initial message."] },
  ]} />;
}
