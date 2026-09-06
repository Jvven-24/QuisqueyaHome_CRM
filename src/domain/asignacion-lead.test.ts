/**
 * Pruebas de la asignación sugerida por especialidad (M2, decisión #21).
 * Sin base de datos: los candidatos se arman a mano, igual que `rbac.test.ts`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { sugerirBroker, type BrokerCandidato } from "./asignacion-lead.ts";

const brokerPlanos: BrokerCandidato = {
  userId: 1,
  specialty: "Proyectos en planos",
  handlesRentals: false,
  annualSalesCents: 500_000_00,
};

const brokerAlquileres: BrokerCandidato = {
  userId: 2,
  specialty: "Alquileres",
  handlesRentals: true,
  annualSalesCents: 200_000_00,
};

const brokerSinEspecialidad: BrokerCandidato = {
  userId: 3,
  specialty: null,
  handlesRentals: false,
  annualSalesCents: 0,
};

test("coincide por especialidad contra el proyecto o la zona de interés", () => {
  const sugerido = sugerirBroker(
    { projectInterestText: "Praderas de Punta Cana — en planos", zoneInterest: null, operationType: "sale" },
    [brokerPlanos, brokerAlquileres, brokerSinEspecialidad],
  );
  assert.equal(sugerido, brokerPlanos.userId);
});

test("coincide por handlesRentals cuando la operación es de alquiler, aunque la especialidad no calce", () => {
  const sugerido = sugerirBroker(
    { projectInterestText: null, zoneInterest: "Bávaro", operationType: "rent" },
    [brokerPlanos, brokerAlquileres],
  );
  assert.equal(sugerido, brokerAlquileres.userId);
});

test("sin ningún candidato que coincida, devuelve null", () => {
  const sugerido = sugerirBroker(
    { projectInterestText: "Villas de lujo en Cap Cana", zoneInterest: "Cap Cana", operationType: "sale" },
    [brokerAlquileres, brokerSinEspecialidad],
  );
  assert.equal(sugerido, null);
});

test("sin candidatos, devuelve null sin lanzar", () => {
  assert.equal(
    sugerirBroker({ projectInterestText: "Cualquiera", zoneInterest: null, operationType: "sale" }, []),
    null,
  );
});

test("con varios candidatos que coinciden, desempata por menor annualSalesCents (reparte carga)", () => {
  const brokerPlanosConMenosVentas: BrokerCandidato = {
    userId: 4,
    specialty: "planos",
    handlesRentals: false,
    annualSalesCents: 100_000_00,
  };
  const sugerido = sugerirBroker(
    { projectInterestText: "Proyecto en planos, fase 2", zoneInterest: null, operationType: "sale" },
    [brokerPlanos, brokerPlanosConMenosVentas],
  );
  assert.equal(sugerido, brokerPlanosConMenosVentas.userId);
});

test("empate exacto en annualSalesCents conserva el primero del orden recibido", () => {
  const candidatoA: BrokerCandidato = { userId: 10, specialty: "planos", handlesRentals: false, annualSalesCents: 300_00 };
  const candidatoB: BrokerCandidato = { userId: 11, specialty: "planos", handlesRentals: false, annualSalesCents: 300_00 };
  const sugerido = sugerirBroker(
    { projectInterestText: "planos", zoneInterest: null, operationType: "sale" },
    [candidatoA, candidatoB],
  );
  assert.equal(sugerido, candidatoA.userId);
});

test("operationType null u operación de venta no activa la coincidencia por handlesRentals", () => {
  const sugerido = sugerirBroker(
    { projectInterestText: null, zoneInterest: null, operationType: "sale" },
    [brokerAlquileres],
  );
  assert.equal(sugerido, null);
});
