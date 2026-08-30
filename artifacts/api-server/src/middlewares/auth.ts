import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db, projectsTable, type Project } from "@workspace/db";
import { and, eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      project?: Project;
    }
  }
}

function getAuthenticatedUserId(req: Request): string | null {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  return typeof userId === "string" ? userId : null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = userId;
  next();
}

export async function requireOwnedProject(
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
      .where(and(eq(projectsTable.id, id), eq(projectsTable.ownerId, userId)));

    if (!project) {
      // Deliberately use 404 for both missing and non-owned projects so this
      // endpoint cannot be used to enumerate another user's project IDs.
      res.status(404).json({ error: "Not found" });
      return;
    }

    req.project = project;
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to authorize project");
    res.status(500).json({ error: "Internal server error" });
  }
}