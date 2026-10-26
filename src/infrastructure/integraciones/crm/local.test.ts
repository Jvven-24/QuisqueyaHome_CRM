import { contratoCrm } from "../../../application/testing/contratos.ts";
import { crmEnMemoria } from "../../../application/testing/crm-en-memoria.ts";
import { crmLocal } from "./local.ts";

contratoCrm("crm memoria", () => {
  const crm = crmEnMemoria();
  return { crm, contar: () => crm.registros.length };
});
contratoCrm("crm local", () => {
  let registros = 0;
  return { crm: crmLocal(() => { registros++; }), contar: () => registros };
});
