import type { Demand, InventoryCandidate } from "@/application/contactos/matching";
export type CompanyExample = {
    id: string;
    name: string;
    rnc: string;
    sector: string;
    owner: string;
    email: string;
    people: {
        name: string;
        role: string;
    }[];
    deals: number;
};
export const COMPANIES: CompanyExample[] = [{ id: "EMP-EJ-01", name: "Inversiones Costa Ejemplo", rnc: "Ejemplo · sin registro fiscal", sector: "Inversión inmobiliaria", owner: "Asesor de ejemplo A", email: "costa@example.com", people: [{ name: "Marina Ejemplo", role: "Representante legal" }, { name: "Luis Ejemplo", role: "Apoderado" }], deals: 2 }, { id: "EMP-EJ-02", name: "Grupo Palma Ejemplo", rnc: "Ejemplo · sin registro fiscal", sector: "Administración patrimonial", owner: "Asesor de ejemplo B", email: "palma@example.com", people: [{ name: "Ana Ejemplo", role: "Contacto comercial" }], deals: 1 }];
export const DEMANDS: Demand[] = [{ id: "DEM-EJ-01", name: "Residencia de inversión", contact: "Marina Ejemplo", zone: "Punta Cana", currency: "USD", minCents: 18000000, maxCents: 30000000, bedrooms: 2, areaMin: 90, operation: "sale", priority: "alta", status: "activa" }, { id: "DEM-EJ-02", name: "Apartamento para renta", contact: "Luis Ejemplo", zone: "Santo Domingo", currency: "USD", minCents: 80000, maxCents: 180000, bedrooms: 1, areaMin: 60, operation: "rent", priority: "normal", status: "activa" }];
export const INVENTORY: InventoryCandidate[] = [{ id: "UNI-EJ-01", project: "Costa Clara (ejemplo)", unit: "A-201", zone: "Punta Cana", currency: "USD", priceCents: 24500000, bedrooms: 2, area: 105, operation: "sale", available: true }, { id: "UNI-EJ-02", project: "Costa Clara (ejemplo)", unit: "B-302", zone: "Punta Cana", currency: "USD", priceCents: 32500000, bedrooms: 3, area: 140, operation: "sale", available: true }, { id: "UNI-EJ-03", project: "Palma Urbana (ejemplo)", unit: "C-101", zone: "Santo Domingo", currency: "USD", priceCents: 140000, bedrooms: 1, area: 72, operation: "rent", available: true }, { id: "UNI-EJ-04", project: "Costa Clara (ejemplo)", unit: "A-202", zone: "Punta Cana", currency: "USD", priceCents: 23000000, bedrooms: 2, area: 100, operation: "sale", available: false }];
export const RELATIONS = { timeline: [{ date: "2026-10-16", title: "Solicitud recibida", detail: "Consulta de ejemplo por portal." }, { date: "2026-10-17", title: "Llamada de calificación", detail: "Conversación de ejemplo sobre presupuesto y zona." }], businesses: [{ id: "NEG-EJ-01", title: "Inversión Costa Clara", stage: "Negociación", unit: "A-201", amount: "USD 245,000" }], documents: [{ name: "Propuesta de ejemplo.pdf", status: "Pendiente de aprobación", version: "v1" }], communications: [{ channel: "Correo", subject: "Presentación del proyecto", status: "Ejemplo sin envío" }], people: [{ name: "Inversiones Costa Ejemplo", relation: "Empresa relacionada" }] } as const;
