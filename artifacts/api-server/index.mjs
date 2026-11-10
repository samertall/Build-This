// Vercel's Express entrypoint loads the already-bundled server after build.
// This keeps its runtime compiler from re-emitting the TypeScript workspace graph.
import './dist/index.mjs';
