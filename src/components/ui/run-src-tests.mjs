import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function listarPruebas(directorio) {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) return listarPruebas(ruta);
    return entrada.isFile() && entrada.name.endsWith(".test.ts") ? [ruta] : [];
  });
}

const archivos = listarPruebas("src").sort();
if (archivos.length === 0) {
  console.error("No se encontraron pruebas .test.ts bajo src/.");
  process.exitCode = 1;
} else {
  const resultado = spawnSync(process.execPath, ["--test", ...archivos], { stdio: "inherit" });
  process.exitCode = resultado.status ?? 1;
}
