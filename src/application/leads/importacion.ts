import { CrearLeadInput } from "./entrada.ts";
import { generarCsv } from "../../domain/csv.ts";
export const IMPORT_LIMITS = { bytes: 5 * 1024 * 1024, rows: 2000, columns: 60, cell: 5000 } as const;
export const IMPORT_FIELDS = { fullName: "Nombre completo", phone: "Teléfono", email: "Correo", projectInterestText: "Proyecto de interés", zoneInterest: "Zona", operationType: "Operación (sale/rent)", budgetMinCents: "Presupuesto mínimo (centavos)", budgetMaxCents: "Presupuesto máximo (centavos)", currency: "Moneda" } as const;
export type ImportField = keyof typeof IMPORT_FIELDS;
export type ImportMapping = Partial<Record<ImportField, number>>;
export type ImportRow = {
    row: number;
    values: Record<string, string>;
    errors: string[];
    duplicateOf: number | null;
};
export function parseCsv(text: string): string[][] {
    if (new TextEncoder().encode(text).length > IMPORT_LIMITS.bytes)
        throw new Error("El archivo supera los 5 MB permitidos.");
    const input = text.replace(/^﻿/, "");
    const first = (input.split(/\r?\n/, 1)[0] ?? "");
    const separators = new Map([[",", 0], [";", 0], ["\t", 0]]);
    let headerQuoted = false;
    for (let i = 0; i < first.length; i++) {
        const c = first[i]!;
        if (c === '"') {
            if (headerQuoted && first[i + 1] === '"') {
                i++;
                continue;
            }
            headerQuoted = !headerQuoted;
        }
        else if (!headerQuoted && separators.has(c))
            separators.set(c, separators.get(c)! + 1);
    }
    const separator = [...separators].sort((a, b) => b[1] - a[1])[0]![0];
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;
    let closed = false;
    function pushCell() { if (cell.length > IMPORT_LIMITS.cell)
        throw new Error("Una celda supera los 5000 caracteres."); row.push(cell); cell = ""; closed = false; if (row.length > IMPORT_LIMITS.columns)
        throw new Error("El archivo tiene más de 60 columnas."); }
    function pushRow() { pushCell(); if (row.some(v => v.trim()))
        rows.push(row); row = []; if (rows.length > IMPORT_LIMITS.rows + 1)
        throw new Error("El archivo supera las 2000 filas permitidas."); }
    for (let i = 0; i < input.length; i++) {
        const ch = input[i]!;
        if (quoted) {
            if (ch === '"') {
                if (input[i + 1] === '"') {
                    cell += '"';
                    i++;
                }
                else {
                    quoted = false;
                    closed = true;
                }
            }
            else
                cell += ch;
        }
        else if (ch === '"') {
            if (cell || closed)
                throw new Error("Comillas inesperadas en el CSV.");
            quoted = true;
        }
        else if (ch === separator)
            pushCell();
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && input[i + 1] === '\n')
                i++;
            pushRow();
        }
        else {
            if (closed && ch.trim())
                throw new Error("Contenido después de cerrar una celda entre comillas.");
            if (!closed)
                cell += ch;
        }
    }
    if (quoted)
        throw new Error("El CSV tiene una celda entre comillas sin cerrar.");
    if (cell || row.length || closed)
        pushRow();
    if (!rows.length)
        throw new Error("El archivo no contiene encabezados.");
    if (rows[0]!.some(v => !v.trim()) || new Set(rows[0]!.map(v => v.trim().toLowerCase())).size !== rows[0]!.length)
        throw new Error("Los encabezados deben ser únicos y no estar vacíos.");
    return rows;
}
export function suggestMapping(headers: string[]): ImportMapping {
    const aliases: Record<ImportField, string[]> = { fullName: ["nombre", "nombre completo", "fullname"], phone: ["telefono", "teléfono", "phone"], email: ["email", "correo"], projectInterestText: ["proyecto", "projectinteresttext"], zoneInterest: ["zona", "zoneinterest"], operationType: ["operacion", "operación", "operationtype"], budgetMinCents: ["budgetmincents", "presupuesto minimo centavos"], budgetMaxCents: ["budgetmaxcents", "presupuesto maximo centavos"], currency: ["moneda", "currency"] };
    const mapping: ImportMapping = {};
    for (const field of Object.keys(aliases) as ImportField[]) {
        const index = headers.findIndex(h => aliases[field].includes(h.trim().toLowerCase()));
        if (index >= 0)
            mapping[field] = index;
    }
    return mapping;
}
export function validateImport(rows: string[][], mapping: ImportMapping): ImportRow[] {
    if (rows.length > IMPORT_LIMITS.rows + 1)
        throw new Error("El archivo supera las 2000 filas permitidas.");
    if (mapping.fullName === undefined)
        throw new Error("Mapea la columna Nombre completo.");
    const indices = Object.values(mapping);
    if (indices.length !== new Set(indices).size)
        throw new Error("Cada columna solo puede asignarse a un campo.");
    if (indices.some(i => !Number.isInteger(i) || i < 0 || i >= rows[0]!.length))
        throw new Error("El mapeo contiene una columna inválida.");
    const identities = new Map<string, number>();
    return rows.slice(1).map((cells, index) => {
        const values: Record<string, string> = {};
        for (const [field, column] of Object.entries(mapping))
            values[field] = (cells[column!] ?? "").trim();
        const parsed = CrearLeadInput.safeParse(values);
        const errors = parsed.success ? [] : parsed.error.issues.map(issue => (IMPORT_FIELDS[issue.path[0] as ImportField] ?? "Fila") + ": " + issue.message);
        if (cells.length !== rows[0]!.length)
            errors.push("La fila tiene una cantidad de columnas distinta al encabezado.");
        if (cells.some(c => c.length > IMPORT_LIMITS.cell))
            errors.push("Una celda supera los 5000 caracteres.");
        if (values.phone?.startsWith("=") || values.email?.startsWith("="))
            errors.push("No se permiten fórmulas en datos de contacto.");
        const keys: string[] = [];
        if (parsed.success) {
            if (parsed.data.phone)
                keys.push("phone:" + parsed.data.phone);
            if (parsed.data.email)
                keys.push("email:" + parsed.data.email.toLowerCase());
        }
        const duplicateOf = keys.map(k => identities.get(k)).find(n => n !== undefined) ?? null;
        if (duplicateOf !== null)
            errors.push("Posible duplicado de la fila " + duplicateOf + ". Requiere revisión; no se fusiona automáticamente.");
        if (parsed.success)
            for (const key of keys)
                if (!identities.has(key))
                    identities.set(key, index + 2);
        return { row: index + 2, values, errors, duplicateOf };
    });
}
export function importErrorReport(rows: ImportRow[]): string { return generarCsv(["Fila", "Nombre", "Teléfono", "Correo", "Errores"], rows.filter(r => r.errors.length).map(r => [r.row, r.values.fullName ?? "", r.values.phone ?? "", r.values.email ?? "", r.errors.join(" | ")])); }
