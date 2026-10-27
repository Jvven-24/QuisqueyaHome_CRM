import assert from "node:assert/strict";
import { test } from "node:test";
import { mostrarDemo } from "./flags.ts";

test("mostrarDemo solo se activa con el valor público exacto 1", () => {
  const original = process.env.NEXT_PUBLIC_CRM_DEMO;
  try {
    process.env.NEXT_PUBLIC_CRM_DEMO = "1";
    assert.equal(mostrarDemo(), true);
    for (const value of [undefined, "0", "true", "01"]) {
      if (value === undefined) delete process.env.NEXT_PUBLIC_CRM_DEMO;
      else process.env.NEXT_PUBLIC_CRM_DEMO = value;
      assert.equal(mostrarDemo(), false);
    }
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_CRM_DEMO;
    else process.env.NEXT_PUBLIC_CRM_DEMO = original;
  }
});
