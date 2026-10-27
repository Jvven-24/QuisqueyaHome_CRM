import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const accordion = readFileSync(new URL("./accordion.tsx", import.meta.url), "utf8");
const collapsible = readFileSync(new URL("./collapsible.tsx", import.meta.url), "utf8");

test("Accordion usa Radix, conserva semántica de estado y no supera 220 ms", () => {
  assert.match(accordion, /Accordion as AccordionPrimitive/);
  assert.match(accordion, /AccordionPrimitive\.Trigger/);
  assert.match(accordion, /duration-200/);
  assert.match(accordion, /motion-reduce:animate-none/);
  assert.match(accordion, /focus-visible:ring-2/);
});

test("Collapsible delega teclado y aria-expanded a Radix y respeta movimiento reducido", () => {
  assert.match(collapsible, /Collapsible as CollapsiblePrimitive/);
  assert.match(collapsible, /CollapsiblePrimitive\.Trigger/);
  assert.match(collapsible, /motion-reduce:animate-none/);
  assert.match(collapsible, /focus-visible:ring-2/);
});
