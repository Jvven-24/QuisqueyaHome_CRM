"use client";
import { useRef, useState } from "react";
import { IMPORT_FIELDS, IMPORT_LIMITS, parseCsv, suggestMapping, validateImport, importErrorReport, type ImportField, type ImportMapping, type ImportRow } from "@/application/leads/importacion";
import { generarCsv } from "@/domain/csv";
import { readExcel } from "../_componentes/excel";
import { Desk, Dialog, Preview, download, s } from "../_componentes/desk";
import { IMPORT_EXAMPLE } from "../_ejemplo";
export function ImportVista() {
    const [fileName, setFileName] = useState("");
    const [sheets, setSheets] = useState<{
        name: string;
        rows: string[][];
    }[]>([]);
    const [sheet, setSheet] = useState(0);
    const [mapping, setMapping] = useState<ImportMapping>({});
    const [report, setReport] = useState<ImportRow[] | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [done, setDone] = useState(false);
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const version = useRef(0);
    const rows = sheets[sheet]?.rows ?? [];
    const errors = report?.filter(r => r.errors.length) ?? [];
    const filtered = report?.filter(r => filter === "all" || (filter === "errors" ? r.errors.length : !r.errors.length)) ?? [];
    function load(list: typeof sheets) { setSheets(list); setSheet(0); setMapping(suggestMapping(list[0]!.rows[0]!)); setReport(null); setError(""); setDone(false); setPage(1); }
    async function read(file: File | undefined) { if (!file)
        return; setFileName(file.name);
        const token = ++version.current; setBusy(true); setError(""); setReport(null); setSheets([]); setDone(false); try {
        if (file.size > IMPORT_LIMITS.bytes)
            throw new Error("El archivo supera 5 MB.");
        const list = /\.xlsx$/i.test(file.name) ? await readExcel(await file.arrayBuffer()) : /\.csv$/i.test(file.name) ? [{ name: file.name, rows: parseCsv(await file.text()) }] : (() => { throw new Error("Selecciona un archivo CSV o Excel .xlsx. Convierte los .xls antiguos antes de importarlos."); })();
        if (token === version.current)
            load(list);
    }
    catch (e) {
        if (token === version.current)
            setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    }
    finally {
        if (token === version.current)
            setBusy(false);
    } }
    function validate() { setError(""); setDone(false); try {
        setReport(validateImport(rows, mapping));
        setPage(1);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "Revisa el mapeo.");
    } }
    return <Desk title="Importación y migración" subtitle="Prepara tus datos, revisa el mapeo y resuelve los errores antes de incorporarlos.">
    <Preview falta="procesamiento transaccional por lotes, historial de importaciones y reversión auditada">
    <ol className={s.toolbar} aria-label="Etapas de importación">
    <li>1. Archivo</li>
    <li>2. Mapeo</li>
    <li>3. Validación</li>
    <li>4. Resumen</li>
    </ol>
    <section className={s.panel}>
    <h2>1. Selecciona el archivo</h2>
    <p>CSV UTF-8 con coma, punto y coma o tabulador; Excel .xlsx con encabezados. Máximo 5 MB, 2000 filas y 60 columnas. Teléfonos como texto internacional. Las fórmulas y macros no se ejecutan.</p>
    <div className={s.toolbar}>
    <label>Archivo CSV o Excel<span className={s.filePicker}><span aria-hidden="true">{fileName || "Seleccionar archivo"}</span><input type="file" aria-label="Seleccionar archivo CSV o Excel" title="Seleccionar archivo CSV o Excel" accept=".csv,.xlsx" disabled={busy} onClick={e => {e.currentTarget.value = "";}} onChange={e => void read(e.target.files?.[0])}/></span>
    </label>
    <button className={s.button} onClick={() => { version.current++; setBusy(false); setFileName("Ejemplo local"); load([{ name: "Ejemplo", rows: parseCsv(IMPORT_EXAMPLE) }]); }}>Cargar ejemplo</button>
    <button className={s.button} onClick={() => download("plantilla-leads.csv", generarCsv(["Nombre", "Teléfono", "Correo", "Proyecto", "Zona"], []))}>Descargar plantilla CSV</button>
    </div>{busy && <p role="status" aria-busy="true">Leyendo y comprobando el archivo…</p>}{error && <p role="alert" className={s.error}>{error} Tus datos no se han enviado.</p>}</section>{rows.length > 0 && <section className={s.panel}>
        <h2>2. Mapea las columnas</h2>
        <label>Hoja<select aria-label="Hoja" value={sheet} onChange={e => { const i = Number(e.target.value); setSheet(i); setMapping(suggestMapping(sheets[i]!.rows[0]!)); setReport(null); setDone(false); }}>{sheets.map((item, i) => <option key={i} value={i}>{item.name} · {item.rows.length - 1} filas</option>)}</select>
        </label>
        <div className={s.grid}>{(Object.entries(IMPORT_FIELDS) as [
                ImportField,
                string
            ][]).map(([field, label]) => <label key={field}>{label}{field === "fullName" ? " (obligatorio)" : ""}<select value={mapping[field] ?? ""} aria-required={field === "fullName"} onChange={e => { setMapping(previous => { const next = { ...previous }; if (e.target.value === "")
                delete next[field];
            else
                next[field] = Number(e.target.value); return next; }); setReport(null); setDone(false); }}>
            <option value="">No importar esta columna</option>{rows[0]!.map((h, i) => <option key={i} value={i}>{h}</option>)}</select>
            </label>)}</div>
        <p>Los presupuestos se expresan en centavos enteros; la moneda usa tres letras, por ejemplo USD o DOP. Los campos sin columna se mantienen vacíos.</p>
        <h3>Primeras cinco filas del archivo</h3>
        <div className={s.table} tabIndex={0} aria-label="Vista previa del archivo">
        <table>
        <thead>
        <tr>{rows[0]!.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{rows.slice(1, 6).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell || "—"}</td>)}</tr>)}</tbody>
        </table>
        </div>
        <button className={s.primary} onClick={validate}>Validar filas</button>
        </section>}{report && <section className={s.panel}>
        <h2>3. Resultado de validación</h2>
        <div className={s.grid}>
        <p>
        <strong className={s.stat}>{report.length}</strong>
        <br />Filas analizadas</p>
        <p>
        <strong className={s.stat}>{report.length - errors.length}</strong>
        <br />Sin errores locales</p>
        <p>
        <strong className={s.stat}>{errors.length}</strong>
        <br />Requieren corrección</p>
        </div>
        <p>Se detectan duplicados dentro de este archivo por teléfono normalizado y correo. Falta contrastar con los contactos del CRM antes de una importación real.</p>
        <div className={s.toolbar}>
        <label>Mostrar<select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
        <option value="all">Todas las filas</option>
        <option value="errors">Solo errores</option>
        <option value="valid">Sin errores</option>
        </select>
        </label>
        <button className={s.button} onClick={() => download("errores-importacion.csv", importErrorReport(report))}>Descargar informe de errores</button>
        </div>{!filtered.length ? <p className={s.empty}>No hay filas para este filtro.</p> : <div className={s.table} tabIndex={0} aria-label="Informe por fila">
            <table>
            <thead>
            <tr>
            <th>Fila</th>
            <th>Nombre</th>
            <th>Resultado</th>
            </tr>
            </thead>
            <tbody>{filtered.slice((page - 1) * 20, page * 20).map(row => <tr key={row.row}>
                <td>{row.row}</td>
                <td>{row.values.fullName || "Sin nombre"}</td>
                <td>{row.errors.length ? <ul>{row.errors.map((msg, i) => <li key={i}>{msg}</li>)}</ul> : "Sin errores locales"}</td>
                </tr>)}</tbody>
            </table>
            </div>}<div className={s.toolbar}>
        <button className={s.button} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
        <span>Página {page} de {Math.max(1, Math.ceil(filtered.length / 20))}</span>
        <button className={s.button} disabled={page * 20 >= filtered.length} onClick={() => setPage(p => p + 1)}>Siguiente</button>
        </div>
        <p>{errors.length ? "Corrige las filas señaladas y vuelve a cargar el archivo para continuar." : report.length ? "El archivo pasó la validación local. Revisa el resumen para preparar el lote." : "El archivo solo tiene encabezados. Añade al menos una fila."}</p>{report.length > 0 && errors.length === 0 && <button className={s.primary} onClick={() => setConfirm(true)}>Revisar lote</button>}{done && <p role="status" className={s.preview}>Lote revisado: {report.length} filas. No se importó ningún registro. Falta el backend transaccional de importaciones y el contraste de duplicados con el CRM.</p>}</section>}{confirm && <Dialog title="4. Resumen de importación" onClose={() => setConfirm(false)}>
        <p>{report?.length} filas de la hoja «{sheets[sheet]!.name}». Mapeo de {Object.keys(mapping).length} campos. Política: detener el lote ante errores; no fusionar duplicados.</p>
        <p className={s.preview}>Esta vista prepara el lote. Falta el backend de importación; no se escribirá ningún registro.</p>
        <button className={s.primary} onClick={() => { setConfirm(false); setDone(true); }}>Finalizar revisión del lote</button>
        </Dialog>}</Preview>
    </Desk>;
}
