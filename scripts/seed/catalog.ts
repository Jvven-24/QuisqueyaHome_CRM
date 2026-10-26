import { FINANCIAL_PERMISSION_RESOURCES, PERMISSION_ACTIONS } from '../../src/domain/catalogs.ts';

/**
 * M40: matriz cerrada por defecto. §4.1 exige aprobar las concesiones por rol
 * antes de sembrarlas; incluye admin y jobs, sin inferir privilegios humanos.
 * La ausencia de fila también deniega en RBAC. No modifica el seed comercial.
 */
export const FINANCIAL_PERMISSION_DEFAULTS = FINANCIAL_PERMISSION_RESOURCES.flatMap(resource =>
  PERMISSION_ACTIONS.map(action => ({ resource, action, scope: 'none' as const })),
);

/** Fixtures versionadas, no datos comerciales vigentes. Se materializan en tablas. */
export const SEED = 20261004;
export const BASE_ID = 1_000_000;
export const AS_OF = '2026-10-04T16:00:00.000Z';
export const VOLUMES = { projects: 20, units: 400, contacts: 450, leads: 640, deals: 176, activities: 1800, brokers: 12, agencies: 3, campaigns: 8 } as const;
export const ZONES = ['Punta Cana', 'Bávaro', 'Cap Cana', 'Uvero Alto', 'Las Terrenas', 'Juan Dolio', 'Piantini', 'Naco', 'Serrallés', 'Santiago', 'Puerto Plata', 'Sosúa', 'Bayahíbe'] as const;
export const SOURCES = ['Meta Ads', 'Portal web', 'WhatsApp', 'Referido', 'Instagram', 'Google', 'Ferias de la diáspora', 'Broker externo'] as const;
/** Agrupación de campañas simuladas sobre los canales ya administrados. */
export const SOURCE_SLUGS = ['meta_lead_ads', 'portal_web', 'whatsapp', 'referido', 'instagram', 'portal_web', 'referido', 'referido'] as const;
export const LOSS_SLUGS = ['precio', 'sin_financiamiento', 'otro', 'otra_opcion', 'solo_consultaba'] as const;
export const PAYMENTS = ['Contado', 'Financiamiento bancario', 'Plan del desarrollador'] as const;
export const INVENTORY = [
  { slug: 'available', name: 'Disponible', legacyStatus: 'available' },
  { slug: 'held', name: 'Retenida', legacyStatus: 'reserved' },
  { slug: 'reserved', name: 'Reservada', legacyStatus: 'reserved' },
  { slug: 'sold', name: 'Vendida', legacyStatus: 'sold' },
  { slug: 'blocked', name: 'Bloqueada', legacyStatus: 'unavailable' },
] as const;
export const STAGES = [
  { slug: 'nuevo', name: 'Nuevo', kind: 'open' },
  { slug: 'contactado', name: 'Contactado', kind: 'open' },
  { slug: 'presentacion', name: 'Presentación', kind: 'open' },
  { slug: 'preseleccion', name: 'Preselección', kind: 'open' },
  { slug: 'negociacion', name: 'Negociación', kind: 'open' },
  { slug: 'cierre', name: 'Cierre', kind: 'won' },
  { slug: 'perdido', name: 'Perdido', kind: 'lost' },
] as const;
export const FUNNEL = { opportunities: 176, visits: 88, quotations: 53, reservations: 19, contracts: 15, lost: 64 } as const;
/** Rangos exclusivos de v1 y v2; incluye los catálogos v1 que hay que retirar. */
export const SEED_RANGES = {
  zones: ZONES.length, agencies: VOLUMES.agencies, paymentMethods: PAYMENTS.length,
  unitInventoryStates: INVENTORY.length, leadSources: SOURCES.length, lossReasons: LOSS_SLUGS.length,
  pipelineStages: STAGES.length, users: VOLUMES.brokers, brokerProfiles: VOLUMES.brokers,
  marketingCampaigns: VOLUMES.campaigns, campaignSpend: VOLUMES.campaigns * 19,
  projects: VOLUMES.projects, units: VOLUMES.units, contacts: VOLUMES.contacts,
  leads: VOLUMES.leads, deals: VOLUMES.deals, dealProperties: VOLUMES.deals,
  dealStageHistory: FUNNEL.opportunities * 2 + FUNNEL.visits + FUNNEL.quotations + FUNNEL.reservations + FUNNEL.contracts + FUNNEL.lost,
  activities: VOLUMES.activities, commissions: FUNNEL.contracts, goals: 19 * (VOLUMES.brokers + 1),
} as const;
export const INSERT_ORDER = ['zones', 'agencies', 'paymentMethods', 'unitInventoryStates', 'users', 'brokerProfiles', 'marketingCampaigns', 'campaignSpend', 'projects', 'units', 'contacts', 'leads', 'deals', 'dealProperties', 'dealStageHistory', 'activities', 'commissions', 'goals'] as const;
export const CLEAN_ORDER: readonly (keyof typeof SEED_RANGES)[] = [...[...INSERT_ORDER].reverse(), 'pipelineStages', 'lossReasons', 'leadSources'];
export const CATALOG_KEYS = ['roles', 'pipelineStages', 'leadSources', 'lossReasons', 'zones', 'agencies', 'paymentMethods', 'unitInventoryStates'] as const;
export const BROKER_WEIGHTS = [22, 17, 13, 11, 9, 7, 6, 5, 4, 3, 2, 1] as const;
export const RESIDENCES = [
  { country: 'DO', city: 'Santo Domingo', prefix: '1809', first: ['María', 'José', 'Altagracia', 'Rafael'], last: ['Peña', 'Rodríguez', 'Santos', 'De la Cruz'], weight: 28 },
  { country: 'US', city: 'New York, NY', prefix: '1212', first: ['Ana', 'Michael', 'Carolina', 'David'], last: ['García', 'Johnson', 'Martínez', 'Smith'], weight: 15 },
  { country: 'US', city: 'Newark, NJ', prefix: '1973', first: ['Luis', 'Jennifer', 'Daniel', 'Rosa'], last: ['Fernández', 'Brown', 'Reyes', 'Davis'], weight: 9 },
  { country: 'US', city: 'Miami, FL', prefix: '1305', first: ['Carmen', 'Robert', 'Sofía', 'Juan'], last: ['Hernández', 'Miller', 'López', 'Wilson'], weight: 10 },
  { country: 'US', city: 'Boston, MA', prefix: '1617', first: ['Elena', 'James', 'Patricia', 'Carlos'], last: ['Torres', 'Anderson', 'Díaz', 'Moore'], weight: 5 },
  { country: 'CA', city: 'Toronto', prefix: '1416', first: ['Emma', 'Liam', 'Olivia', 'Noah'], last: ['Tremblay', 'Roy', 'Martin', 'Gagnon'], weight: 9 },
  { country: 'ES', city: 'Madrid', prefix: '346', first: ['Lucía', 'Javier', 'Isabel', 'Álvaro'], last: ['Romero', 'Navarro', 'Serrano', 'Ruiz'], weight: 8 },
  { country: 'FR', city: 'Paris', prefix: '336', first: ['Camille', 'Louis', 'Chloé', 'Hugo'], last: ['Dubois', 'Laurent', 'Bernard', 'Moreau'], weight: 5 },
  { country: 'IT', city: 'Milano', prefix: '39320', first: ['Giulia', 'Marco', 'Sofia', 'Luca'], last: ['Rossi', 'Bianchi', 'Romano', 'Ricci'], weight: 5 },
  { country: 'PR', city: 'San Juan', prefix: '1787', first: ['Valeria', 'Miguel', 'Adriana', 'Pedro'], last: ['Rivera', 'Ortiz', 'Santiago', 'Cruz'], weight: 6 },
] as const;
/** Nombre/ubicación/rango de Olea y Araya verificados en la migración del portal
 * 20260906193000_drive_catalog_enrichment.sql. Los demás rangos son supuestos
 * de simulación; los nombres que contienen Demo son completamente ficticios.
 * Confotur siempre es una hipótesis de fixture, no una certificación legal. */
export const PROJECTS = [
  { name: 'Olea at Cap Cana', zone: 2, min: 349250, max: 789500, areaMin: 76, areaMax: 275, provenance: 'portal:20260906193000:olea-at-cap-cana' },
  { name: 'Araya Punta Cana', zone: 1, min: 139500, max: 170650, areaMin: 85.6, areaMax: 133.6, provenance: 'portal:20260906193000:araya-punta-cana' },
  { name: 'Garden Paradise', zone: 12, min: 97000, max: 161000, areaMin: 37, areaMax: 76, provenance: 'portal:20260906193000:garden-paradise (reported)' },
  { name: 'Velero at Bayahíbe', zone: 12, min: 115000, max: 390000, areaMin: 40.97, areaMax: 142.61, provenance: 'portal:20260906193000:velero-at-bayahibe; precio simulado' },
  { name: 'Demo Palma Punta Cana', zone: 0, min: 155000, max: 330000, areaMin: 65, areaMax: 150, provenance: 'simulado' },
  { name: 'Demo Coral Bávaro', zone: 1, min: 125000, max: 300000, areaMin: 60, areaMax: 140, provenance: 'simulado' },
  { name: 'Demo Lago Cap Cana', zone: 2, min: 360000, max: 950000, areaMin: 100, areaMax: 260, provenance: 'simulado' },
  { name: 'Demo Arena Uvero Alto', zone: 3, min: 190000, max: 470000, areaMin: 80, areaMax: 195, provenance: 'simulado' },
  { name: 'Demo Bonita Las Terrenas', zone: 4, min: 210000, max: 620000, areaMin: 80, areaMax: 225, provenance: 'simulado' },
  { name: 'Demo Costa Juan Dolio', zone: 5, min: 150000, max: 380000, areaMin: 70, areaMax: 170, provenance: 'simulado' },
  { name: 'Demo Skyline Piantini', zone: 6, min: 280000, max: 720000, areaMin: 95, areaMax: 250, provenance: 'simulado' },
  { name: 'Demo Jardín Naco', zone: 7, min: 210000, max: 490000, areaMin: 85, areaMax: 205, provenance: 'simulado' },
  { name: 'Demo Parque Serrallés', zone: 8, min: 230000, max: 540000, areaMin: 90, areaMax: 215, provenance: 'simulado' },
  { name: 'Demo Mirador Santiago', zone: 9, min: 110000, max: 290000, areaMin: 70, areaMax: 175, provenance: 'simulado' },
  { name: 'Demo Atlántico Puerto Plata', zone: 10, min: 145000, max: 390000, areaMin: 75, areaMax: 190, provenance: 'simulado' },
  { name: 'Demo Bahía Sosúa', zone: 11, min: 170000, max: 460000, areaMin: 75, areaMax: 200, provenance: 'simulado' },
  { name: 'Demo Brisa Punta Cana', zone: 0, min: 165000, max: 410000, areaMin: 75, areaMax: 180, provenance: 'simulado' },
  { name: 'Demo Sol Bávaro', zone: 1, min: 135000, max: 310000, areaMin: 65, areaMax: 145, provenance: 'simulado' },
  { name: 'Demo Mar Las Terrenas', zone: 4, min: 240000, max: 680000, areaMin: 90, areaMax: 245, provenance: 'simulado' },
  { name: 'Demo Centro Santiago', zone: 9, min: 120000, max: 310000, areaMin: 75, areaMax: 180, provenance: 'simulado' },
] as const;
