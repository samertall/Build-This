import type { RequestHandler } from "express";

export function previewDatabaseIsUnsafe(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.VERCEL_ENV === "preview" || env.VERCEL_TARGET_ENV === "preview")
    && env.PREVIEW_DATABASE_ISOLATED !== "true";
}

/** Prevent Preview traffic from touching the shared Production database. */
export const previewDatabaseGuard: RequestHandler = (req, res, next) => {
  if (previewDatabaseIsUnsafe() && req.path !== "/healthz") {
    res.status(503).json({
      error: "Preview API is disabled until a separate staging database is configured",
    });
    return;
  }
  next();
};
