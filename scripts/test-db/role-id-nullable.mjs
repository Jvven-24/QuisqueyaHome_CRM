// Diagnóstico de g2a exclusivamente en memoria: no modifica schema.ts ni emite código.
import assert from 'node:assert/strict';
import ts from 'typescript';
import { resolve, relative } from 'node:path';
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
const host = ts.createCompilerHost({ ...parsed.options, incremental: false, noEmit: true });
const schemaPath = resolve('src/infrastructure/db/schema.ts');
const read = host.readFile;
host.readFile = name => {
  const source = read(name);
  if (resolve(name) !== schemaPath || source === undefined) return source;
  const pattern = /roleId: integer\("role_id"\)\s*\.notNull\(\)/g;
  // users.roleId es el primer bloque; permissions.roleId mantiene NOT NULL.
  assert.equal([...source.matchAll(pattern)].length, 2, 'sitios roleId distintos; revisar simulación');
  return source.replace(pattern, (match, offset) => offset === source.search(pattern) ? 'roleId: integer("role_id")' : match);
};
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, incremental: false, noEmit: true }, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
const report = diagnostics.map(d => ({
  file: d.file ? relative('.', d.file.fileName).replaceAll('\\','/') : null,
  line: d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : null,
  code: d.code,
  message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
}));
console.log(JSON.stringify({ simulationOnly: true, schemaWritten: false, nullableUsersRoleId: true, diagnostics: report }, null, 2));
