/**
 * Servidor de producción local para medir la velocidad real (sin compilación por visita).
 *
 *   npm run prod:build            compila en .next-prod (no toca el .next del servidor de desarrollo)
 *   npm run prod:start [puerto]   sirve esa compilación; por defecto en 9302
 *
 * En producción el acceso de evaluación está desactivado (`evaluationLoginAllowed` exige
 * NODE_ENV=development): se entra con usuarios reales de Supabase local.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// `next build` reescribe tsconfig.json para incluir `.next-prod/types`, cuyos tipos globales chocan con los de `.next`
// (typecheck falla en validator.ts). Se restaura el original al terminar; `.next-prod` está en `exclude`.
const tsconfig = readFileSync("tsconfig.json", "utf8");

const [accion = "start", puerto = "9302"] = process.argv.slice(2);
if (accion !== "build" && accion !== "start") {
  console.error("Uso: node scripts/prod.mjs build|start [puerto]");
  process.exit(2);
}
const args = accion === "build" ? ["build"] : ["start", "-p", puerto];
// Una sola cadena (argumentos fijos, sin entrada externa): con shell y lista de argumentos Node 24 avisa DEP0190.
const hijo = spawn(`npx next ${args.join(" ")}`, {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-prod" },
});
hijo.on("exit", (codigo) => {
  if (accion === "build") writeFileSync("tsconfig.json", tsconfig);
  process.exit(codigo ?? 1);
});
