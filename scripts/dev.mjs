/**
 * Run the Vite CPA UI (port 3000) and the Express hybrid extractor (port 8787).
 * Vite proxies /api to Express so Submit Client Documents hits POST /api/documents/upload.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = (name) => path.join(root, "node_modules", ".bin", name);

const children = [];

function start(label, cmd, args, extraEnv = {}) {
  console.log(`[dev] starting ${label}: ${cmd} ${args.join(" ")}`);
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv }
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`[dev] ${label} exited ${code}`);
      shutdown();
      process.exit(code);
    }
  });
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

start("api", bin("tsx"), ["server.ts"], { API_ONLY: "true", PORT: "8787" });
start("ui", bin("vite"), ["--host", "0.0.0.0", "--port", "3000"]);
