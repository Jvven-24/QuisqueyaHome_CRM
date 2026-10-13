if ((globalThis as typeof globalThis & { [key: symbol]: unknown })[Symbol.for("qh.test-db")]) {
  await import("../../../scripts/test-db/cierre.ts");
}
export {};
