/**
 * Stack de desarrollo aislado en la VPS (proyecto Compose «qh-dev», ver ops/vps-dev/).
 * Se modifica aquí, en local, y se sube; la VPS compila y sirve. No toca nada más de la VPS.
 *
 *   npm run vps -- subir    empaqueta el árbol real (con cambios sin commit), lo sube, compila y reinicia la app
 *   npm run vps -- datos    copia la base local del CRM a la base `crm` del stack (reemplaza la de la VPS)
 *   npm run vps -- tunel    abre el túnel: CRM :3201, auth :54331, Moodle :9330 en 127.0.0.1 de esta máquina
 *   npm run vps -- estado   estado y consumo de los contenedores qh-dev
 *
 * Requiere el alias SSH `hostinger` (~/.ssh/config). Los secretos se generan y quedan en la VPS (/opt/qh-dev/.env).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const HOST = process.env.QH_VPS_HOST || "hostinger";
const REMOTO = "/opt/qh-dev";
const [orden = "estado"] = process.argv.slice(2);

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", ...opts });
const ssh = (remoto) => sh("ssh", ["-o", "BatchMode=yes", HOST, remoto]);
// scp y GNU tar leen «C:\...» como host remoto: se copia desde la carpeta del archivo con su nombre relativo.
const scp = (origen, destino) => sh("scp", ["-q", "-o", "BatchMode=yes", path.basename(origen), `${HOST}:${destino}`],
  { cwd: path.dirname(path.resolve(origen)) });
const TAR = process.platform === "win32" ? "C:/Windows/System32/tar.exe" : "tar";

// Nunca se suben secretos, evidencia de agentes ni compilaciones locales.
const EXCLUIR = [/^\.env/, /^\.viltrum\//, /^node_modules\//, /^\.next/, /^referencia-prototipo\//, /\.patch$/];

function paquete(dir) {
  const snapshot = execFileSync("git", ["stash", "create"], { encoding: "utf8" }).trim() || "HEAD";
  const tar = path.join(dir, "codigo.tar");
  sh("git", ["archive", "--format=tar", "-o", tar, snapshot]);
  const nuevos = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" })
    .split(/\r?\n/).filter((f) => f && !EXCLUIR.some((r) => r.test(f)) && existsSync(f));
  if (nuevos.length) {
    const lista = path.join(dir, "nuevos.txt");
    writeFileSync(lista, nuevos.join("\n"));
    sh(TAR, ["-rf", tar, "-T", lista]);
  }
  // Los `.env*` rastreados por error tampoco viajan.
  return tar;
}

function subirOps() {
  ssh(`mkdir -p ${REMOTO}/initdb ${REMOTO}/app`);
  for (const f of ["docker-compose.yml", "Caddyfile", "remoto.sh"]) scp(path.join("ops/vps-dev", f), `${REMOTO}/${f}`);
  scp("ops/vps-dev/initdb/01-bases.sql", `${REMOTO}/initdb/01-bases.sql`);
}

if (orden === "subir") {
  const dir = mkdtempSync(path.join(tmpdir(), "qh-dev-"));
  try {
    const tar = paquete(dir);
    subirOps();
    scp(tar, `${REMOTO}/codigo.tar`);
    // Se conserva node_modules entre subidas (npm ci lo reconcilia); el resto del código se reemplaza.
    ssh(`cd ${REMOTO} && find app -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} + && ` +
        `tar -xf codigo.tar -C app && rm codigo.tar && sh remoto.sh preparar && sh remoto.sh construir && ` +
        `docker compose -p qh-dev up -d && docker compose -p qh-dev restart app && sh remoto.sh estado`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
} else if (orden === "datos") {
  process.loadEnvFile(".env");
  const url = new URL(process.env.DATABASE_URL);
  const dir = mkdtempSync(path.join(tmpdir(), "qh-dev-"));
  const volcado = path.join(dir, "crm.dump");
  try {
    const pgDump = process.env.PG_DUMP || "C:/Program Files/PostgreSQL/15/bin/pg_dump.exe";
    sh(pgDump, ["-Fc", "--no-owner", "--no-acl", "-h", url.hostname, "-p", url.port || "5432",
      "-U", decodeURIComponent(url.username), "-f", volcado, url.pathname.slice(1)],
      { env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) } });
    scp(volcado, `${REMOTO}/crm.dump`);
    ssh(`cd ${REMOTO} && docker compose -p qh-dev exec -T db sh -c ` +
        `'dropdb -U postgres --if-exists crm && createdb -U postgres crm && pg_restore -U postgres -d crm --no-owner' < crm.dump; ` +
        `rm -f crm.dump`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
} else if (orden === "tunel") {
  console.log("Túnel abierto: CRM http://localhost:3201 · Moodle http://localhost:9330 (Ctrl+C para cerrar)");
  spawnSync("ssh", ["-N", "-o", "ExitOnForwardFailure=yes", "-o", "ServerAliveInterval=30", "-o", "ServerAliveCountMax=6", "-L", "3201:127.0.0.1:3201",
    "-L", "54331:127.0.0.1:54331", "-L", "9330:127.0.0.1:9330", HOST], { stdio: "inherit" });
} else if (orden === "estado") {
  ssh(`cd ${REMOTO} && sh remoto.sh estado`);
} else {
  console.error("Uso: npm run vps -- subir|datos|tunel|estado");
  process.exit(2);
}
