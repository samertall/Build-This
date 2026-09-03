import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db, projectsTable, projectMembersTable, type Project } from "@workspace/db";
import { and, eq, or } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      resolveUserEmail?: () => Promise<string | undefined>;
      project?: Project;
      projectRole?: "owner" | "editor" | "reviewer";
      projectMemberId?: number;
    }
  }
}

export interface AuthIdentityProvider {
  getUserId(req: Request): string | null;
  getPrimaryEmail(userId: string): Promise<string | undefined>;
}

function getAuthenticatedUserId(req: Request): string | null {
  if (process.env.TEAM_REVIEW_TEST_MODE === "true") {
    return req.header("x-test-user-id") ?? null;
  }

  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  return typeof userId === "string" ? userId : null;
}

const clerkIdentityProvider: AuthIdentityProvider = {
  getUserId: getAuthenticatedUserId,
  async getPrimaryEmail(userId) {
    const user = await clerkClient.users.getUser(userId);
    return user.primaryEmailAddress?.emailAddress;
  },
};

export function createRequireAuth(identityProvider: AuthIdentityProvider = clerkIdentityProvider) {
  return async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const userId = identityProvider.getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let emailPromise: Promise<string | undefined> | undefined;
    req.userId = userId;
    if (process.env.TEAM_REVIEW_TEST_MODE === "true") {
      const testEmail = req.header("x-test-session-email")?.trim().toLowerCase();
      if (testEmail) {
        req.userEmail = testEmail;
        emailPromise = Promise.resolve(testEmail);
      }
    }
    req.resolveUserEmail = () => {
      if (!emailPromise) {
        // Session claims do not reliably contain a verified email and can be
        // stale after a user changes their primary address. Use Clerk's
        // server-side user resource as the source of truth only when an
        // email-based invitation needs to be matched.
        emailPromise = identityProvider.getPrimaryEmail(userId).then((primaryEmail) => {
          req.userEmail = primaryEmail?.trim().toLowerCase();
          return req.userEmail;
        });
      }
      return emailPromise;
    };
    next();
  };
}

export const requireAuth = createRequireAuth();

async function resolveUserEmail(req: Request): Promise<string | undefined> {
  if (req.userEmail !== undefined) return req.userEmail;
  return req.resolveUserEmail?.();
}

export async function requireProjectAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.userId;
  const rawId = req.params.id;
  const id = Number.parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id));

    if (!project) {
      // Deliberately use 404 for both missing and non-owned projects so this
      // endpoint cannot be used to enumerate another user's project IDs.
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (project.ownerId === userId) {
      req.project = project;
      req.projectRole = "owner";
      next();
      return;
    }

    const [membership] = await db.select().from(projectMembersTable).where(and(
      eq(projectMembersTable.projectId, id),
      eq(projectMembersTable.status, "active"),
      eq(projectMembersTable.userId, userId),
    ));

    let invitedMembership = membership;
    if (!invitedMembership) {
      const email = await resolveUserEmail(req);
      if (email) {
        const [emailMembership] = await db.select().from(projectMembersTable).where(and(
          eq(projectMembersTable.projectId, id),
          or(
            eq(projectMembersTable.status, "active"),
            eq(projectMembersTable.status, "invited"),
          ),
          eq(projectMembersTable.email, email),
        ));
        invitedMembership = emailMembership;
      }
    }

    if (!invitedMembership) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (invitedMembership.status === "invited") {
      await db.update(projectMembersTable)
        .set({ userId, status: "active", updatedAt: new Date() })
        .where(eq(projectMembersTable.id, invitedMembership.id));
    }
    req.project = project;
    req.projectRole = invitedMembership.role as "editor" | "reviewer";
    req.projectMemberId = invitedMembership.id;
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to authorize project");
    res.status(500).json({ error: "Internal server error" });
  }
}

export const requireOwnedProject = requireProjectAccess;

export function requireProjectRole(...roles: Array<"owner" | "editor" | "reviewer">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.projectRole || !roles.includes(req.projectRole)) {
      res.status(403).json({ error: "You do not have permission to change this project" });
      return;
    }
    next();
  };
}