import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runCheck } from './check.mjs';

const moduleSections = Array.from({ length: 9 }, (_, index) => `## ${index + 1}. Sección ${index + 1}\nContenido verificado para esta sección.`).join('\n\n');
const integrationSections = Array.from({ length: 10 }, (_, index) => `## ${index + 1}. Sección ${index + 1}\nContenido verificado para esta sección.`).join('\n\n');

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-check-'));
  for (const directory of ['modulos', 'globales', 'integraciones']) fs.mkdirSync(path.join(root, '.viltrum', 'vre-os', 'spec', directory), { recursive: true });
  fs.mkdirSync(path.join(root, '.viltrum', 'vre-os', 'tareas'), { recursive: true });
  fs.writeFileSync(path.join(root, '.viltrum', 'vre-os', 'spec', '00-indice.md'), '# Índice\n\n<!-- spec:avance:start -->\n<!-- spec:avance:end -->\n');
  return root;
}

function moduleSpec({ id = 'M01', status = 'READY', sectionBody = moduleSections, extra = '' } = {}) {
  return `---\nid: ${id}\nnombre: Leads\nestado: ${status}\nriesgo: R2\nowner: D10\nrevisores: [D14]\nactualizado: 2026-10-04\n---\n\n# ${id} · Leads\n\n${sectionBody}\n${extra}`;
}

function integrationSpec(id) {
  return `---\nid: ${id}\nsistema: CRM\nestado: DRAFT\nriesgo: R2\nowner: D19\nrevisores: [D12, D14]\nactualizado: 2026-10-04\n---\n\n${integrationSections}`;
}

function writeSpec(root, directory, filename, source) {
  const target = path.join(root, '.viltrum', 'vre-os', 'spec', directory, filename);
  fs.writeFileSync(target, source);
  const now = new Date();
  fs.utimesSync(target, now, now);
}

test('acepta ficha completa y ficha de integración con sus secciones', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeSpec(root, 'modulos', 'M01-leads.md', moduleSpec());
  writeSpec(root, 'integraciones', 'I01-crm.md', `---\nid: I01\nsistema: CRM\nrepo: local\nlicencia: MIT\nmodo: RUN\npuerto: CrmPort\nestado: VERIFIED\nriesgo: R2\nowner: D19\nrevisores: [D12, D14]\nactualizado: 2026-10-04\n---\n\n${integrationSections}`);
  const result = runCheck({ root });
  assert.equal(result.stats.total, 2);
  assert.equal(result.stats.percentReady, 100);
  assert.deepEqual(result.findings, []);
});

test('reporta campos obligatorios y secciones incompletas', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeSpec(root, 'modulos', 'M01-leads.md', `---\nid: M01\nnombre: Leads\nestado: DRAFT\n---\n\n## 1. Propósito\nTODO\n`);
  const result = runCheck({ root });
  assert.ok(result.findings.some((finding) => finding.includes('falta campo obligatorio riesgo')));
  assert.ok(result.findings.some((finding) => finding.includes('secciones vacías, con TODO o ausentes')));
});

test('READY con huecos o UNKNOWN en criterios es un bloqueo', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const sections = moduleSections.replace('## 7. Sección 7\nContenido verificado para esta sección.', '## 7. Sección 7\n').replace('## 8. Sección 8\nContenido verificado para esta sección.', '## 8. Criterios\nUNKNOWN criterio');
  writeSpec(root, 'modulos', 'M01-leads.md', moduleSpec({ sectionBody: sections }));
  const result = runCheck({ root });
  assert.ok(result.findings.some((finding) => finding.includes('secciones vacías')));
  assert.ok(result.findings.some((finding) => finding.includes('no permite UNKNOWN en §8')));
});

test('la prosa española con todo no es TODO; los marcadores explícitos siguen bloqueando', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const contenido = 'Contenido verificado para esta sección.';
  for (const prosa of ['En todo endpoint se valida el alcance antes de consultar.', 'Se comprueba todo el contrato.', 'Todo usuario recibe permisos efectivos.']) {
    writeSpec(root, 'modulos', 'M01-leads.md', moduleSpec({ sectionBody: moduleSections.replace(contenido, prosa) }));
    assert.deepEqual(runCheck({ root }).findings, [], prosa);
  }
  for (const marcador of ['TODO', 'TODO: falta contrato', 'Pendiente TODO de revisión', 'todo', 'todo: falta contrato', '- [ ] todo: validar alcance', '**todo**']) {
    writeSpec(root, 'modulos', 'M01-leads.md', moduleSpec({ sectionBody: moduleSections.replace(contenido, marcador) }));
    assert.ok(runCheck({ root }).findings.some((f) => f.includes('secciones vacías, con TODO o ausentes')), marcador);
  }
});

test('tarea de hoy con Ficha DRAFT falla; tarea antigua sin Ficha queda como legado', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeSpec(root, 'modulos', 'M01-leads.md', moduleSpec({ status: 'DRAFT' }));
  const tasks = path.join(root, '.viltrum', 'vre-os', 'tareas');
  const draftTask = path.join(tasks, 'T-hoy.md');
  fs.writeFileSync(draftTask, '# Tarea\nFicha: M01\n');
  const now = new Date();
  fs.utimesSync(draftTask, now, now);
  const oldTask = path.join(tasks, 'T-legado.md');
  fs.writeFileSync(oldTask, '# Tarea sin ficha\n');
  const old = new Date(now.getTime() - 3 * 86400000);
  fs.utimesSync(oldTask, old, old);
  const oldReferencedTask = path.join(tasks, 'T-antigua-con-ficha.md');
  fs.writeFileSync(oldReferencedTask, '# Tarea antigua\nFicha: M01\n');
  fs.utimesSync(oldReferencedTask, old, old);
  const result = runCheck({ root, today: '2026-10-04', taskCreatedDate: (filename) => filename.includes('antigua') || filename.includes('legado') ? '2026-10-03' : '2026-10-04' });
  assert.ok(result.findings.some((finding) => finding.includes('ficha M01 está en DRAFT')));
  assert.ok(result.findings.some((finding) => finding.includes('T-legado.md: legado')));
  assert.ok(!result.findings.some((finding) => finding.includes('T-antigua-con-ficha.md')));
});

test('--md actualiza solo el contenido entre marcadores', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const indexPath = path.join(root, '.viltrum', 'vre-os', 'spec', '00-indice.md');
  fs.writeFileSync(indexPath, '# Índice\n\n<!-- spec:avance:start -->\ncontenido viejo\n<!-- spec:avance:end -->\n\nFinal.\n');
  const result = runCheck({ root, writeMarkdown: true });
  const index = fs.readFileSync(indexPath, 'utf8');
  assert.equal(result.stats.total, 0);
  assert.match(index, /\| \*\*Total\*\* \| \*\*0\*\*/);
  assert.ok(index.endsWith('\n\nFinal.\n'));
});

test('solo integraciones/CAPACIDADES.md se omite con aviso no probatorio y sin mutarlo', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const catalog = '# Catálogo histórico\nSin API verificada.\n';
  writeSpec(root, 'integraciones', 'CAPACIDADES.md', catalog);
  writeSpec(root, 'integraciones', 'I01-twenty.md', integrationSpec('I01'));
  writeSpec(root, 'integraciones', 'I02-moodle.md', integrationSpec('I02'));

  const result = runCheck({ root });
  assert.equal(result.stats.total, 2);
  assert.equal(result.stats.byType.integraciones.total, 2);
  assert.equal(result.stats.byStatus.DRAFT, 2);
  assert.deepEqual(result.findings, []);
  assert.equal(result.notices.length, 1);
  assert.match(result.notices[0], /integraciones\/CAPACIDADES\.md:.*no probatoria.*no acredita APIs verificadas/);
  assert.equal(fs.readFileSync(path.join(root, '.viltrum', 'vre-os', 'spec', 'integraciones', 'CAPACIDADES.md'), 'utf8'), catalog);
});

test('OTRO.md e I03 defectuosa siguen bloqueando con nombre, cabecera y secciones', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeSpec(root, 'integraciones', 'CAPACIDADES.md', '# Histórico\n');
  writeSpec(root, 'integraciones', 'I01-twenty.md', integrationSpec('I01'));
  writeSpec(root, 'integraciones', 'I02-moodle.md', integrationSpec('I02'));
  writeSpec(root, 'integraciones', 'OTRO.md', '# Incompleto\n');
  writeSpec(root, 'integraciones', 'I03-defectuosa.md', '# También incompleto\n');

  const result = runCheck({ root });
  assert.equal(result.stats.total, 4);
  assert.ok(result.findings.some((finding) => finding.includes('OTRO.md: nombre de archivo no sigue el patrón')));
  for (const name of ['OTRO.md', 'I03-defectuosa.md']) {
    assert.ok(result.findings.some((finding) => finding.includes(`${name}: falta cabecera YAML`)));
    assert.ok(result.findings.some((finding) => finding.includes(`${name}: secciones vacías`)));
  }

  const cli = spawnSync(process.execPath, [fileURLToPath(new URL('./check.mjs', import.meta.url))], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(cli.status, 1, cli.stderr);
  assert.match(cli.stdout, /Bloqueos: [1-9]/);
  assert.match(cli.stdout, /Aviso: .*CAPACIDADES\.md: catálogo histórico omitido/);
  assert.match(cli.stdout, /OTRO\.md: nombre de archivo no sigue el patrón/);
});

test('CAPACIDADES.md fuera de integraciones no queda exento', (t) => {
  const root = fixtureRoot();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeSpec(root, 'integraciones', 'CAPACIDADES.md', '# Histórico\n');
  writeSpec(root, 'modulos', 'CAPACIDADES.md', '# Incompleto\n');
  writeSpec(root, 'globales', 'CAPACIDADES.md', '# Incompleto\n');

  const result = runCheck({ root });
  assert.equal(result.stats.total, 2);
  assert.equal(result.notices.length, 1);
  assert.ok(result.findings.some((finding) => finding.includes('modulos/CAPACIDADES.md: nombre de archivo')));
  assert.ok(result.findings.some((finding) => finding.includes('globales/CAPACIDADES.md: nombre de archivo')));
});
