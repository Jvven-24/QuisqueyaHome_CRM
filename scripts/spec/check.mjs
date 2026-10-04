import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STATUSES = ['DRAFT', 'REVIEW', 'READY', 'BUILT', 'VERIFIED'];
const READY_RANK = new Map(STATUSES.map((status, index) => [status, index]));
const TYPE_DIRS = ['modulos', 'globales', 'integraciones'];
const REQUIRED = ['estado', 'riesgo', 'owner', 'revisores', 'actualizado'];
const MARK_START = '<!-- spec:avance:start -->';
const MARK_END = '<!-- spec:avance:end -->';

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/\s+#.*$/, '').trim();
}

function parseHeader(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { values: {}, error: 'falta cabecera YAML entre ---' };
  const values = {};
  let currentListKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentListKey) {
      values[currentListKey].push(parseScalar(listItem[1]));
      continue;
    }
    const entry = line.match(/^([\w-]+):(?:\s*(.*))?$/);
    if (!entry) { currentListKey = null; continue; }
    const [, key, raw = ''] = entry;
    if (raw.trim() === '') {
      values[key] = [];
      currentListKey = key;
    } else if (raw.trim().startsWith('[') && raw.trim().endsWith(']')) {
      values[key] = raw.trim().slice(1, -1).split(',').map(parseScalar).filter(Boolean);
      currentListKey = null;
    } else {
      values[key] = parseScalar(raw);
      currentListKey = null;
    }
  }
  return { values, error: null };
}

function sectionsFor(source, count) {
  const lines = source.split(/\r?\n/);
  const missing = [];
  for (let number = 1; number <= count; number += 1) {
    const index = lines.findIndex((line) => new RegExp(`^##\\s+${number}\\.`).test(line));
    if (index < 0) { missing.push(number); continue; }
    let content = '';
    for (let cursor = index + 1; cursor < lines.length && !/^##\s+\d+\./.test(lines[cursor]); cursor += 1) content += `${lines[cursor]}\n`;
    const meaningful = content.replace(/<!--[^]*?-->/g, '').replace(/^\s*---\s*$/gm, '').trim();
    if (!meaningful || /\bTODO\b/i.test(meaningful)) missing.push(number);
  }
  return missing;
}

function expectedId(filename, type) {
  const prefix = type === 'modulos' ? 'M' : type === 'globales' ? 'G' : 'I';
  return path.basename(filename).match(new RegExp(`^(${prefix}\\d+)-.+\\.md$`, 'i'))?.[1] ?? null;
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(dir, entry.name)).sort();
}

function typeName(directory) {
  return directory === 'modulos' ? 'Módulo' : directory === 'globales' ? 'Global' : 'Integración';
}

function formatMarkdownTable(stats) {
  const rows = [
    '| Tipo | Total | DRAFT | REVIEW | READY | BUILT | VERIFIED | % READY+ |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const directory of TYPE_DIRS) {
    const item = stats.byType[directory];
    rows.push(`| ${typeName(directory)} | ${item.total} | ${item.DRAFT} | ${item.REVIEW} | ${item.READY} | ${item.BUILT} | ${item.VERIFIED} | ${item.percentReady}% |`);
  }
  rows.push(`| **Total** | **${stats.total}** | **${stats.byStatus.DRAFT}** | **${stats.byStatus.REVIEW}** | **${stats.byStatus.READY}** | **${stats.byStatus.BUILT}** | **${stats.byStatus.VERIFIED}** | **${stats.percentReady}%** |`);
  return rows.join('\n');
}

export function runCheck({ root = process.cwd(), today = localDate(), writeMarkdown = false, taskCreatedDate = (filename) => {
  const stat = fs.statSync(filename);
  return localDate(Number.isNaN(stat.birthtime.getTime()) ? stat.mtime : stat.birthtime);
} } = {}) {
  const specRoot = path.join(root, '.viltrum', 'vre-os', 'spec');
  const findings = [];
  const records = [];
  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  const byType = Object.fromEntries(TYPE_DIRS.map((dir) => [dir, { total: 0, ...Object.fromEntries(STATUSES.map((status) => [status, 0])), percentReady: 0 }]));
  const ids = new Map();

  for (const directory of TYPE_DIRS) {
    for (const filename of listMarkdown(path.join(specRoot, directory))) {
      const relative = path.relative(root, filename).replaceAll(path.sep, '/');
      const source = fs.readFileSync(filename, 'utf8');
      const { values, error } = parseHeader(source);
      const expected = expectedId(filename, directory);
      const identifier = values.id;
      if (error) findings.push(`${relative}: ${error}`);
      const nameKey = directory === 'integraciones' ? 'sistema' : 'nombre';
      for (const key of [ ...(directory === 'integraciones' ? ['id', 'sistema'] : ['id', 'nombre']), ...REQUIRED ]) {
        if (values[key] === undefined || values[key] === '' || (Array.isArray(values[key]) && values[key].length === 0)) findings.push(`${relative}: falta campo obligatorio ${key}`);
      }
      if (!STATUSES.includes(values.estado)) findings.push(`${relative}: estado inválido ${values.estado ?? '(vacío)'}; permitido: ${STATUSES.join('|')}`);
      if (!expected) findings.push(`${relative}: nombre de archivo no sigue el patrón ${directory === 'modulos' ? 'M' : directory === 'globales' ? 'G' : 'I'}NN-descripcion.md`);
      if (expected && identifier && String(identifier).toUpperCase() !== expected.toUpperCase()) findings.push(`${relative}: id ${identifier} no coincide con el id ${expected} del archivo`);
      if (identifier) {
        const normalizedId = String(identifier).toUpperCase();
        if (ids.has(normalizedId)) findings.push(`${relative}: id duplicado ${normalizedId} (también en ${ids.get(normalizedId)})`);
        else ids.set(normalizedId, relative);
      }
      const sectionCount = directory === 'integraciones' ? 10 : 9;
      const missingSections = sectionsFor(source, sectionCount);
      if (missingSections.length) findings.push(`${relative}: secciones vacías, con TODO o ausentes: ${missingSections.map((number) => `§${number}`).join(', ')}`);
      if (READY_RANK.get(values.estado) >= READY_RANK.get('READY')) {
        if (missingSections.length) { /* Ya se informa arriba; esto enfatiza la regla de salida. */ }
        const criteriaLines = source.split(/\r?\n/);
        const criteriaStart = criteriaLines.findIndex((line) => /^##\s+8\./.test(line));
        let criteria = '';
        if (criteriaStart >= 0) {
          for (let cursor = criteriaStart + 1; cursor < criteriaLines.length && !/^##\s+\d+\./.test(criteriaLines[cursor]); cursor += 1) criteria += `${criteriaLines[cursor]}\n`;
        }
        if (/\bUNKNOWN\b/i.test(criteria)) findings.push(`${relative}: estado ${values.estado} no permite UNKNOWN en §8 (criterios)`);
      }
      records.push({ directory, relative, values, nameKey });
      if (STATUSES.includes(values.estado)) { byStatus[values.estado] += 1; byType[directory][values.estado] += 1; }
      byType[directory].total += 1;
    }
  }

  for (const directory of TYPE_DIRS) {
    const item = byType[directory];
    const readyCount = STATUSES.slice(2).reduce((total, status) => total + item[status], 0);
    item.percentReady = item.total ? Math.round((readyCount / item.total) * 100) : 0;
  }
  const total = records.length;
  const readyTotal = byStatus.READY + byStatus.BUILT + byStatus.VERIFIED;
  const stats = { total, byStatus, byType, percentReady: total ? Math.round((readyTotal / total) * 100) : 0 };

  const taskDir = path.join(root, '.viltrum', 'vre-os', 'tareas');
  for (const filename of listMarkdown(taskDir).filter((file) => /^T-.*\.md$/i.test(path.basename(file)))) {
    const source = fs.readFileSync(filename, 'utf8');
    const reference = source.match(/^\s*Ficha:\s*([\w-]+)\s*$/im)?.[1];
    const relative = path.relative(root, filename).replaceAll(path.sep, '/');
    if (!reference) { findings.push(`${relative}: legado (sin Ficha:)`); continue; }
    if (taskCreatedDate(filename) < today) continue;
    const record = records.find((item) => String(item.values.id).toUpperCase() === reference.toUpperCase());
    if (!record) findings.push(`${relative}: ficha ${reference} no existe`);
    else if (!STATUSES.includes(record.values.estado) || READY_RANK.get(record.values.estado) < READY_RANK.get('READY')) findings.push(`${relative}: ficha ${reference} está en ${record.values.estado ?? 'estado inválido'}, requiere READY o superior`);
  }

  if (writeMarkdown) {
    const indexPath = path.join(specRoot, '00-indice.md');
    if (!fs.existsSync(indexPath)) findings.push('.viltrum/vre-os/spec/00-indice.md: falta el índice para actualizar la tabla');
    else {
      const index = fs.readFileSync(indexPath, 'utf8');
      const start = index.indexOf(MARK_START);
      const end = index.indexOf(MARK_END);
      if (start < 0 || end < 0 || end < start) findings.push('.viltrum/vre-os/spec/00-indice.md: marcadores spec:avance inválidos o ausentes');
      else {
        const updated = `${index.slice(0, start + MARK_START.length)}\n${formatMarkdownTable(stats)}\n${index.slice(end)}`;
        fs.writeFileSync(indexPath, updated, 'utf8');
      }
    }
  }
  return { stats, findings, records };
}

function printResult(result) {
  const { stats, findings } = result;
  console.log(`Spec Pack: ${stats.total} fichas; listas READY o superior: ${stats.percentReady}%`);
  console.log(`Estados: ${STATUSES.map((status) => `${status} ${stats.byStatus[status]}`).join(' · ')}`);
  console.log(`Tipos: ${TYPE_DIRS.map((type) => `${typeName(type)} ${stats.byType[type].total}`).join(' · ')}`);
  const blockers = findings.filter((finding) => !finding.includes(': legado (sin Ficha:)'));
  console.log(`Bloqueos: ${blockers.length}`);
  if (findings.length) for (const finding of findings) console.log(`- ${finding}`);
  if (blockers.length === 0) console.log('Sin bloqueos.');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = runCheck({ writeMarkdown: process.argv.includes('--md') });
  printResult(result);
  if (result.findings.some((finding) => !finding.includes(': legado (sin Ficha:)'))) process.exitCode = 1;
}
