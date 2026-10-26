import type { CrmPort } from "@/application/compartido/crm";
import { crmMotor } from "@/infrastructure/env";
import { crmLocal } from "@/infrastructure/integraciones/crm/local";

export function crmParaIntegraciones(): CrmPort {
  switch (crmMotor()) {
    case "local":
      return crmLocal((registro) => { console.info("crm-local", registro); });
  }
}
