// El glob de npm test no abre conexiones. El runner aislado activa estos casos.
if ((globalThis as typeof globalThis & { [key: symbol]: unknown })[Symbol.for('qh.test-db')]) {
  await import('../../../scripts/test-db/negocios.ts');
}
export {};
