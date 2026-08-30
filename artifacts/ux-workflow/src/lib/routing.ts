const configuredBasePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const artifactMountPath = "/ux-workflow";
const currentPath = window.location.pathname;
const isMountedAtArtifactPath =
  currentPath === artifactMountPath ||
  currentPath.startsWith(`${artifactMountPath}/`);

export const basePath =
  configuredBasePath ||
  (isMountedAtArtifactPath ? artifactMountPath : "");