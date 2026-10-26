import { IMPORT_LIMITS } from "@/application/leads/importacion";
// Lector acotado de OOXML: no evalúa fórmulas, macros ni relaciones externas.
export async function readExcel(buffer: ArrayBuffer): Promise<{
    name: string;
    rows: string[][];
}[]> {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const decoder = new TextDecoder();
    if (bytes.length > IMPORT_LIMITS.bytes)
        throw new Error("El archivo supera los 5 MB permitidos.");
    let end = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
        if (view.getUint32(i, true) === 0x06054b50) {
            end = i;
            break;
        }
    if (end < 0)
        throw new Error("El archivo no es un libro .xlsx válido. Convierte los .xls antiguos a .xlsx o CSV.");
    const entries = view.getUint16(end + 10, true);
    if (entries > 400)
        throw new Error("El libro contiene demasiados archivos internos.");
    const files = new Map<string, {
        offset: number;
        size: number;
        expanded: number;
        method: number;
    }>();
    let offset = view.getUint32(end + 16, true);
    let expandedTotal = 0;
    for (let i = 0; i < entries; i++) {
        if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50)
            throw new Error("El libro está dañado.");
        const flags = view.getUint16(offset + 8, true), method = view.getUint16(offset + 10, true), size = view.getUint32(offset + 20, true), expanded = view.getUint32(offset + 24, true), nameLength = view.getUint16(offset + 28, true), extra = view.getUint16(offset + 30, true), comment = view.getUint16(offset + 32, true), local = view.getUint32(offset + 42, true);
        const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
        if (flags & 1 || ![0, 8].includes(method))
            throw new Error("No se admiten libros cifrados ni compresión especial.");
        expandedTotal += expanded;
        if (expandedTotal > 25 * 1024 * 1024 || expanded > 10 * 1024 * 1024)
            throw new Error("El contenido descomprimido del libro supera el límite de seguridad.");
        if (name.includes("..") || name.startsWith("/") || files.has(name))
            throw new Error("El libro contiene rutas internas inválidas.");
        files.set(name, { offset: local, size, expanded, method });
        offset += 46 + nameLength + extra + comment;
    }
    async function xml(name: string): Promise<Document> {
        const file = files.get(name);
        if (!file)
            throw new Error("Falta una parte del libro: " + name);
        if (file.offset + 30 > bytes.length || view.getUint32(file.offset, true) !== 0x04034b50)
            throw new Error("El libro está dañado.");
        const start = file.offset + 30 + view.getUint16(file.offset + 26, true) + view.getUint16(file.offset + 28, true);
        if (start + file.size > bytes.length)
            throw new Error("El libro está incompleto.");
        let data = bytes.slice(start, start + file.size);
        if (file.method === 8) {
            const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
            const reader = stream.getReader();
            const chunks: Uint8Array[] = [];
            let length = 0;
            while (true) {
                const part = await reader.read();
                if (part.done)
                    break;
                length += part.value.length;
                if (length > file.expanded || length > 10 * 1024 * 1024) {
                    await reader.cancel();
                    throw new Error("El libro excede el tamaño declarado.");
                }
                chunks.push(part.value);
            }
            data = new Uint8Array(length);
            let pos = 0;
            for (const chunk of chunks) {
                data.set(chunk, pos);
                pos += chunk.length;
            }
        }
        if (data.length !== file.expanded)
            throw new Error("El tamaño del libro no coincide con su contenido.");
        const text = decoder.decode(data);
        if (/<!DOCTYPE|<!ENTITY/i.test(text))
            throw new Error("El libro contiene entidades XML no permitidas.");
        const doc = new DOMParser().parseFromString(text, "application/xml");
        if (doc.querySelector("parsererror"))
            throw new Error("El libro contiene XML inválido.");
        return doc;
    }
    const workbook = await xml("xl/workbook.xml");
    const relations = await xml("xl/_rels/workbook.xml.rels");
    const strings = files.has("xl/sharedStrings.xml") ? Array.from((await xml("xl/sharedStrings.xml")).getElementsByTagName("si")).map(si => Array.from(si.getElementsByTagName("t")).map(t => t.textContent ?? "").join("")) : [];
    const sheets = Array.from(workbook.getElementsByTagName("sheet"));
    if (sheets.length > 20)
        throw new Error("Se admiten hasta 20 hojas por libro.");
    const result: {
        name: string;
        rows: string[][];
    }[] = [];
    for (const sheet of sheets) {
        const id = sheet.getAttribute("r:id");
        const relation = Array.from(relations.getElementsByTagName("Relationship")).find(r => r.getAttribute("Id") === id);
        if (!relation || relation.getAttribute("TargetMode") === "External")
            throw new Error("No se admiten hojas externas.");
        const target = relation.getAttribute("Target") ?? "";
        if (target.includes("..") || target.includes(":"))
            throw new Error("La hoja tiene una referencia inválida.");
        const path = target.startsWith("/") ? target.slice(1) : "xl/" + target;
        const doc = await xml(path);
        const rows: string[][] = [];
        for (const row of Array.from(doc.getElementsByTagName("row"))) {
            const cells: string[] = [];
            for (const cell of Array.from(row.getElementsByTagName("c"))) {
                const ref = cell.getAttribute("r") ?? "";
                const letters = ref.match(/^[A-Z]+/)?.[0];
                if (!letters)
                    throw new Error("Hay una celda sin coordenada válida.");
                let column = 0;
                for (const letter of letters)
                    column = column * 26 + letter.charCodeAt(0) - 64;
                if (column > IMPORT_LIMITS.columns)
                    throw new Error("La hoja supera las 60 columnas.");
                if (cell.getElementsByTagName("f").length)
                    throw new Error("La celda " + ref + " contiene una fórmula. Pega los valores antes de importar.");
                const type = cell.getAttribute("t");
                const value = cell.getElementsByTagName("v")[0]?.textContent ?? "";
                const text = type === "s" ? strings[Number(value)] ?? "" : type === "inlineStr" ? Array.from(cell.getElementsByTagName("t")).map(t => t.textContent ?? "").join("") : value;
                if (text.length > IMPORT_LIMITS.cell)
                    throw new Error("La celda " + ref + " supera los 5000 caracteres.");
                cells[column - 1] = text;
            }
            if (cells.some(c => c?.trim()))
                rows.push(Array.from({ length: cells.length }, (_, i) => cells[i] ?? ""));
            if (rows.length > IMPORT_LIMITS.rows + 1)
                throw new Error("La hoja supera las 2000 filas.");
        }
        if (rows.length) {
            const width = rows[0]!.length;
            for (const row of rows)
                while (row.length < width)
                    row.push("");
            if (rows[0]!.some(h => !h.trim()) || new Set(rows[0]!.map(h => h.trim().toLowerCase())).size !== width)
                throw new Error("Los encabezados de cada hoja deben ser únicos y no vacíos.");
            result.push({ name: sheet.getAttribute("name") ?? "Hoja", rows });
        }
    }
    if (!result.length)
        throw new Error("El libro no contiene hojas con datos.");
    return result;
}
