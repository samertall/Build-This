import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db, projectsTable, projectMembersTable, type Project } from "@workspace/db";
import { and, eq, or } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      project?: Project;
      projectRole?: "owner" | "editor" | "reviewer";
      projectMemberId?: number;
    }
  }
}

function getAuthenticatedUserId(req: Request): string | null {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  return typeof userId === "string" ? userId : null;
}

function getAuthenticatedUserEmail(req: Request): string | null {
  const auth = getAuth(req);
  const claims = auth?.sessionClaims as Record<string, unknown> | undefined;
  const email = claims?.email;
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const claimEmail = getAuthenticatedUserEmail(req);
    const user = claimEmail ? null : await clerkClient.users.getUser(userId);
    req.userId = userId;
    req.userEmail = (claimEmail ?? user?.primaryEmailAddress?.emailAddress)?.trim().toLowerCase();
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to resolve authenticated user");
    res.status(500).json({ error: "Unable to resolve user identity" });
  }
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

    const email = req.userEmail;
    const activeCondition = email
      ? or(eq(projectMembersTable.userId, userId), eq(projectMembersTable.email, email))
      : eq(projectMembersTable.userId, userId);
    const [membership] = await db.select().from(projectMembersTable).where(and(
      eq(projectMembersTable.projectId, id),
      eq(projectMembersTable.status, "active"),
      activeCondition,
    ));

    const [pendingInvitation] = membership || !email
      ? []
      : await db.select().from(projectMembersTable).where(and(
        eq(projectMembersTable.projectId, id),
        eq(projectMembersTable.status, "invited"),
        eq(projectMembersTable.email, email),
      ));
    const invitedMembership = membership ?? pendingInvitation;

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