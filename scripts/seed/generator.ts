import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolveCatalogs, type CatalogReferences } from './catalog-guards.ts';
import type * as schema from '../../src/infrastructure/db/schema.ts';
import { AS_OF, BASE_ID, BROKER_WEIGHTS, FUNNEL, INVENTORY, LOSS_SLUGS, PAYMENTS, PROJECTS, RESIDENCES, SEED, SOURCES, SOURCE_SLUGS, STAGES, VOLUMES, ZONES } from './catalog.ts';

export type Dataset = { [K in 'zones' | 'agencies' | 'paymentMethods' | 'unitInventoryStates' | 'leadSources' | 'lossReasons' | 'pipelineStages' | 'users' | 'brokerProfiles' | 'marketingCampaigns' | 'campaignSpend' | 'projects' | 'units' | 'contacts' | 'leads' | 'deals' | 'dealProperties' | 'dealStageHistory' | 'activities' | 'commissions' | 'goals']: (typeof schema)[K]['$inferInsert'][] };
export const id = (n: number) => BASE_ID + n;
export const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function prng(seed: number) {
  let state = seed >>> 0;
  if (!state) throw new Error('La semilla no puede ser cero');
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
export function allocate(total: number, weights: readonly number[]): number[] {
  assert.ok(Number.isInteger(total) && total >= 0 && weights.length > 0 && weights.every(w => Number.isFinite(w) && w > 0));
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => total * w / sum);
  const counts = raw.map(Math.floor);
  const order = raw.map((v, i) => ({ i, remainder: v - Math.floor(v) })).sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  const remaining = total - counts.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) counts[order[i]!.i]!++;
  return counts;
}
const at = <T>(list: readonly T[], index: number): T => { const item = list[index]; assert.ok(item !== undefined); return item; };
const plusDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);
const publicId = (kind: string, n: number) => { const h = createHash('sha256').update(`vre-v1:${kind}:${n}`).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`; };
export function generateDataset(references: CatalogReferences, seed = SEED): Dataset {
  const catalogsFromDb = resolveCatalogs(references);
  const stage = (step: number) => at(catalogsFromDb.pipelineStages, step);
  const sourceId = (index: number) => catalogsFromDb.leadSources.find(s => s.slug === at(SOURCE_SLUGS, index))!.id;
  const lossReasonId = (index: number) => catalogsFromDb.lossReasons.find(s => s.slug === at(LOSS_SLUGS, index))!.id;
  const random = prng(seed);
  const pick = <T>(list: readonly T[]) => at(list, Math.floor(random() * list.length));
  const shuffle = <T>(list: T[]) => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [list[i], list[j]] = [at(list, j), at(list, i)]; } return list; };
  const reference = new Date(AS_OF);
  const created = new Date('2025-04-01T16:00:00Z');
  const stamps = { createdAt: created, updatedAt: reference };
  const catalogs = (names: readonly string[], kind: string) => names.map((name, i) => ({ id: id(i), publicId: publicId(kind, i), slug: `vre-${slug(name)}`, name, position: i, isActive: true, ...stamps }));
  const d: Dataset = {
    // `agencies` no tiene columna `position` (schema.ts): se omite para que la relectura coincida.
    zones: catalogs(ZONES, 'zone'), agencies: catalogs(['Demo Quisqueya Este', 'Demo Caribe Capital', 'Demo Atlántico Norte'], 'agency').map(({ position: _position, ...agency }) => agency),
    paymentMethods: catalogs(PAYMENTS, 'payment'), unitInventoryStates: INVENTORY.map((s, i) => ({ ...s, id: id(i), publicId: publicId('inventory', i), position: i, isActive: true, ...stamps })),
    leadSources: catalogsFromDb.leadSources,
    lossReasons: catalogsFromDb.lossReasons,
    pipelineStages: catalogsFromDb.pipelineStages,
    users: [], brokerProfiles: [], marketingCampaigns: [], campaignSpend: [], projects: [], units: [], contacts: [], leads: [], deals: [], dealProperties: [], dealStageHistory: [], activities: [], commissions: [], goals: [],
  };
  for (let i = 0; i < VOLUMES.brokers; i++) {
    d.users.push({ id: id(i), roleId: catalogsFromDb.brokerRoleId, fullName: `Demo ${pick(RESIDENCES[0].first)} ${pick(RESIDENCES[0].last)} ${i + 1}`, email: `broker.${i + 1}@vre.example.invalid`, initials: `B${i + 1}`, jobTitle: 'Broker · simulación', isActive: true, ...stamps });
    d.brokerProfiles.push({ userId: id(i), agencyId: id(i % 3), specialty: 'Inversión inmobiliaria', handlesRentals: false, level: i < 3 ? 'top_producer' : i < 7 ? 'senior' : 'junior', annualSalesCents: 0, monthlyTargetDeals: i < 3 ? 3 : 1, ...stamps });
  }
  // Abr-2025 → Oct-2026 inclusivos: 19 buckets, octubre parcial hasta el día 4.
  const months = Array.from({ length: 19 }, (_, i) => new Date(Date.UTC(2025, 3 + i, 1)));
  const weights = months.map((m, i) => i === 18 ? 0.12 : [10, 11, 0, 1, 2].includes(m.getUTCMonth()) ? 1.65 : 1);
  for (let i = 0; i < VOLUMES.campaigns; i++) {
    d.marketingCampaigns.push({ id: id(i), publicId: publicId('campaign', i), slug: `vre-campaign-${i}`, name: `${at(SOURCES, i)} · Demo inversión RD`, sourceId: sourceId(i), startsOn: '2025-04-01', endsOn: '2026-10-31', ...stamps });
    for (let j = 0; j < months.length; j++) d.campaignSpend.push({ id: id(i * 19 + j), publicId: publicId('spend', i * 19 + j), campaignId: id(i), month: at(months, j).toISOString().slice(0, 10), amountCents: [2, 3, 7].includes(i) ? 0 : Math.round((550 + random() * 1800) * at(weights, j)) * 100, currency: 'USD', ...stamps });
  }
  for (let i = 0; i < PROJECTS.length; i++) {
    const p = at(PROJECTS, i);
    d.projects.push({ id: id(i), slug: `vre-${slug(p.name)}`, name: p.name, zoneId: id(p.zone), zone: at(ZONES, p.zone), confoturEligible: ![6, 7, 8, 9].includes(p.zone), description: `FIXTURE SIMULADA; ${p.provenance}. Confotur hipotético.`, developer: 'Desarrollador demo', projectType: 'under_construction', operationType: 'sale', estimatedDeliveryDate: '2027-12-01', currency: 'USD', publicRangeMinCents: p.min * 100, publicRangeMaxCents: p.max * 100, brokerId: id(i % 12), isPublished: false, ...stamps });
    for (let j = 0; j < 20; j++) {
      const fraction = j / 19;
      const area = Math.round((p.areaMin + (p.areaMax - p.areaMin) * fraction) * 10) / 10;
      const price = Math.round(p.min + (p.max - p.min) * fraction) * 100;
      const state = j === 18 ? 1 : j === 19 ? 4 : 0;
      d.units.push({ id: id(i * 20 + j), projectId: id(i), code: `${j < 10 ? 'A' : 'B'}-${String((j % 10) + 101)}`, tower: j < 10 ? 'A' : 'B', floorLevel: Math.floor((j % 10) / 2) + 1, unitType: area < 55 ? 'Estudio' : area > 190 ? 'Penthouse' : 'Apartamento', bedrooms: area < 55 ? 0 : area < 95 ? 1 : area < 160 ? 2 : 3, bathrooms: area < 95 ? 1.5 : 2.5, builtAreaM2: area, operationType: 'sale', currency: 'USD', realPriceCents: price, publicRangeMinCents: price, publicRangeMaxCents: price, status: at(INVENTORY, state).legacyStatus, inventoryStateId: id(state), brokerId: id(i % 12), ...stamps });
    }
  }
  const residences = shuffle(allocate(VOLUMES.contacts, RESIDENCES.map(r => r.weight)).flatMap((n, i) => Array.from({ length: n }, () => at(RESIDENCES, i))));
  for (let i = 0; i < VOLUMES.contacts; i++) {
    const r = at(residences, i);
    // E.164 sintáctico y longitud nacional; no se asegura que el número no exista.
    const length = r.country === 'IT' ? 12 : 11;
    const suffix = String(5550100 + i).padStart(length - r.prefix.length, '0').slice(-(length - r.prefix.length));
    d.contacts.push({ id: id(i), fullName: `${pick(r.first)} ${pick(r.last)}`, phone: `+${r.prefix}${suffix}`, email: `investor.${i + 1}@vre.example.invalid`, country: r.country, city: r.city, notes: 'Persona ficticia. No contactar.', consentAt: created, consentSource: 'fixture-simulada', ...stamps });
  }
  const brokerAssignments = shuffle(allocate(VOLUMES.leads, BROKER_WEIGHTS).flatMap((n, i) => Array.from({ length: n }, () => i)));
  const leadDates = allocate(VOLUMES.leads, weights).flatMap((n, i) => Array.from({ length: n }, () => {
    const m = at(months, i); const last = i === 18 ? 3 : new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), 1 + Math.floor(random() * last), 16));
  }));
  for (let i = 0; i < VOLUMES.leads; i++) {
    const project = at(d.projects, Math.floor(random() * d.projects.length));
    const source = Math.floor(random() * SOURCES.length);
    const received = at(leadDates, i);
    const first = plusDays(received, 1 + Math.floor(random() * 3));
    const contacted = first <= reference;
    d.leads.push({ id: id(i), contactId: id(i % VOLUMES.contacts), projectId: project.id, projectInterestText: project.name, zoneInterestId: project.zoneId, zoneInterest: project.zone, sourceId: sourceId(source), campaignId: id(source), deliveryHorizonMonths: pick([6, 12, 18, 24, 36]), paymentMethodId: id(Math.floor(random() * PAYMENTS.length)), confoturInterest: random() < 0.7, budgetMinCents: Math.round(Number(project.publicRangeMinCents) * 0.9), budgetMaxCents: Math.round(Number(project.publicRangeMaxCents) * 1.1), currency: 'USD', operationType: 'sale', brokerId: id(at(brokerAssignments, i)), status: contacted ? 'contacted' : 'assigned', externalId: `vre-v1-lead-${i}`, receivedAt: received, firstContactedAt: contacted ? first : null, createdAt: received, updatedAt: reference });
  }
  const candidates = shuffle(d.leads.filter(l => l.receivedAt! < new Date('2026-08-01T00:00:00Z'))).slice(0, VOLUMES.deals);
  const lost = new Set(shuffle(Array.from({ length: FUNNEL.opportunities - FUNNEL.reservations }, (_, i) => i + FUNNEL.reservations)).slice(0, FUNNEL.lost));
  const saleUnits = shuffle(d.units.filter(u => u.inventoryStateId === id(0)));
  for (let i = 0; i < candidates.length; i++) {
    const l = at(candidates, i);
    const u = at(saleUnits, i);
    const p = at(d.projects, Number(u.projectId) - BASE_ID);
    // Coherencia del interés y del presupuesto con la opción seleccionada.
    l.projectId = p.id; l.projectInterestText = p.name; l.zoneInterestId = p.zoneId; l.zoneInterest = p.zone;
    l.budgetMinCents = Math.round(Number(u.realPriceCents) * 0.9); l.budgetMaxCents = Math.round(Number(u.realPriceCents) * 1.15);
    const rank = i < FUNNEL.contracts ? 5 : i < FUNNEL.reservations ? 4 : i < FUNNEL.quotations ? 3 : i < FUNNEL.visits ? 2 : 1;
    const terminal = lost.has(i) ? 6 : rank;
    let previous: number | null = null;
    let changed = l.receivedAt!;
    for (const step of [...Array.from({ length: rank + 1 }, (_, k) => k), ...(lost.has(i) ? [6] : [])]) {
      changed = plusDays(changed, 2 + Math.floor(random() * 7));
      d.dealStageHistory.push({ id: id(d.dealStageHistory.length), dealId: id(i), fromStageId: previous, toStageId: stage(step).id, changedBy: l.brokerId, changedAt: changed });
      previous = stage(step).id;
    }
    const closed = terminal >= 5;
    const deal: typeof schema.deals.$inferInsert = { id: id(i), leadId: l.id, contactId: l.contactId!, brokerId: l.brokerId, sourceId: l.sourceId, title: `Demo inversión · ${p.name}`, stageId: stage(terminal).id, currency: 'USD', operationType: 'sale', amountCents: u.realPriceCents, probability: stage(terminal).defaultProbability, commissionBasisPoints: 450, lossReasonId: lost.has(i) ? lossReasonId(i % LOSS_SLUGS.length) : null, closedAt: closed ? changed : null, stageChangedAt: changed, expectedCloseDate: closed ? changed.toISOString().slice(0, 10) : '2026-12-15', createdAt: plusDays(l.receivedAt!, 1), updatedAt: changed };
    d.deals.push(deal);
    l.status = 'converted'; l.convertedDealId = deal.id;
    d.dealProperties.push({ id: id(i), dealId: id(i), projectId: u.projectId!, unitId: u.id, isPrimary: true, createdAt: deal.createdAt });
    if (rank === 5) { u.status = 'sold'; u.inventoryStateId = id(3); }
    else if (rank === 4) { u.status = 'reserved'; u.inventoryStateId = id(2); }
    if (terminal === 5) {
      const amount = Number(deal.amountCents); const total = Math.round(amount * 450 / 10000); const broker = Math.floor(total / 2);
      d.commissions.push({ id: id(i), dealId: id(i), brokerId: l.brokerId, currency: 'USD', saleAmountCents: amount, commissionBasisPoints: 450, totalCommissionCents: total, brokerShareBasisPoints: 5000, agencyShareBasisPoints: 5000, brokerAmountCents: broker, agencyAmountCents: total - broker, status: i < 8 ? 'paid' : i < 12 ? 'approved' : 'pending', closedDate: changed.toISOString().slice(0, 10), approvedBy: i < 12 ? l.brokerId : null, approvedAt: i < 12 ? plusDays(changed, 1) : null, paidAt: i < 8 ? plusDays(changed, 2) : null, createdAt: changed, updatedAt: reference });
    }
  }
  const dealByLead = new Map(d.deals.map(deal => [deal.leadId, deal]));
  for (let i = 0; i < VOLUMES.activities; i++) {
    const l = pick(d.leads); const deal = dealByLead.get(l.id);
    const isClosed = deal?.closedAt != null;
    const completed = isClosed || i % 5 < 3;
    const proposed = completed ? plusDays(l.receivedAt!, Math.floor(random() * Math.max(1, Math.floor((Number(isClosed ? deal!.closedAt : reference) - Number(l.receivedAt)) / 86400000)))) : plusDays(reference, i % 5 === 3 ? -3 : 7);
    const start = new Date(Math.max(Number(proposed), Number(l.receivedAt)));
    const type = pick(['call', 'whatsapp', 'meeting', 'note'] as const);
    d.activities.push({ id: id(i), leadId: l.id, contactId: l.contactId, dealId: deal?.id, projectId: l.projectId, assigneeId: l.brokerId, activityType: type, title: `Demo ${type === 'meeting' ? 'Visita al proyecto' : type === 'call' ? 'Seguimiento telefónico' : type === 'whatsapp' ? 'Seguimiento WhatsApp' : 'Nota de inversión'}`, startsAt: start, endsAt: plusDays(start, 1 / 48), status: completed ? 'completed' : 'pending', completedAt: completed ? plusDays(start, 1 / 48) : null, priority: i % 7 === 0 ? 'high' : 'normal', createdAt: l.receivedAt, updatedAt: reference });
  }
  for (const c of d.contacts) {
    const interactions = d.activities.filter(a => a.contactId === c.id && a.status === 'completed').map(a => a.completedAt!);
    c.lastInteractionAt = interactions.length ? new Date(Math.max(...interactions.map(Number))) : null;
    c.brokerId = d.leads.find(l => l.contactId === c.id)?.brokerId;
    c.sourceId = d.leads.find(l => l.contactId === c.id)?.sourceId;
  }
  for (const b of d.brokerProfiles) b.annualSalesCents = d.deals.filter(deal => deal.brokerId === b.userId && deal.stageId === stage(5).id && deal.closedAt!.getUTCFullYear() === 2026).reduce((sum, deal) => sum + Number(deal.amountCents), 0);
  for (const month of months) for (const brokerId of [null, ...d.users.map(u => u.id!)]) {
    const won = d.deals.filter(deal => deal.stageId === stage(5).id && (brokerId === null || deal.brokerId === brokerId) && new Date(deal.closedAt!.getTime() - 4 * 3600000).toISOString().slice(0, 7) === month.toISOString().slice(0, 7));
    d.goals.push({ id: id(d.goals.length), brokerId, year: month.getUTCFullYear(), month: month.getUTCMonth() + 1, targetDeals: brokerId === null ? 12 : 2, targetAmountCents: (brokerId === null ? 3000000 : 500000) * 100, achievedDeals: won.length, achievedAmountCents: won.reduce((sum, deal) => sum + Number(deal.amountCents), 0), currency: 'USD', ...stamps });
  }
  validateDataset(d);
  return d;
}

/** Mismas comprobaciones en memoria y sobre filas releídas dentro de la transacción. */
export function validateDataset(d: Dataset) {
  for (const [key, value] of Object.entries(VOLUMES)) if (key !== 'brokers' && key !== 'campaigns') assert.equal(d[key as keyof Dataset].length, value, `volumen ${key}`);
  assert.equal(d.users.length, VOLUMES.brokers); assert.equal(d.brokerProfiles.length, VOLUMES.brokers); assert.equal(d.marketingCampaigns.length, VOLUMES.campaigns);
  const map = <K extends keyof Dataset>(key: K): Map<number | undefined | null, Dataset[K][number]> => new Map(d[key].map(row => ['id' in row ? row.id : 'userId' in row ? row.userId : undefined, row as Dataset[K][number]]));
  const contacts = map('contacts'), leads = map('leads'), projects = map('projects'), units = map('units'), brokers = map('users'), campaigns = map('marketingCampaigns');
  const stages = new Map(d.pipelineStages.map(s => [s.id, s]));
  const reasons = new Set<number | null | undefined>(d.lossReasons.map(r => r.id));
  for (const [table, rows] of Object.entries(d)) assert.equal(new Set(rows.map(row => 'id' in row ? row.id : 'userId' in row ? row.userId : undefined)).size, rows.length, `IDs únicos ${table}`);
  for (const c of d.contacts) { assert.match(c.phone!, /^\+[1-9]\d{7,14}$/); assert.ok(RESIDENCES.some(r => r.country === c.country && r.city === c.city && c.phone!.startsWith(`+${r.prefix}`)), 'residencia/teléfono'); }
  const activeMonths = new Map<string, number>();
  for (const l of d.leads) {
    assert.ok(contacts.has(l.contactId) && brokers.has(l.brokerId) && projects.has(l.projectId), 'FK lead');
    assert.ok(campaigns.has(l.campaignId)); assert.equal(campaigns.get(l.campaignId)!.sourceId, l.sourceId);
    assert.ok(Number.isSafeInteger(l.budgetMinCents) && Number.isSafeInteger(l.budgetMaxCents) && l.budgetMinCents! >= 0 && l.budgetMinCents! <= l.budgetMaxCents!, 'presupuesto');
    assert.ok(l.receivedAt! >= new Date('2025-04-01T00:00:00Z') && l.receivedAt! <= new Date(AS_OF));
    assert.ok(!l.firstContactedAt || l.firstContactedAt >= l.receivedAt! && l.firstContactedAt <= new Date(AS_OF));
    const month = l.receivedAt!.toISOString().slice(0, 7); activeMonths.set(month, (activeMonths.get(month) ?? 0) + 1);
    assert.ok(d.zones.some(z => z.id === l.zoneInterestId && z.name === l.zoneInterest));
    assert.ok(d.paymentMethods.some(p => p.id === l.paymentMethodId));
  }
  assert.equal(activeMonths.size, 19);
  const winter = [...activeMonths].filter(([m]) => ['11','12','01','02','03'].includes(m.slice(-2)));
  const summer = [...activeMonths].filter(([m]) => ['04','05','06','07','08','09'].includes(m.slice(-2)));
  assert.ok(winter.reduce((s, [, n]) => s + n, 0) / winter.length > summer.reduce((s, [, n]) => s + n, 0) / summer.length, 'estacionalidad');
  const stageId = (step: number) => d.pipelineStages.find(s => s.slug === at(STAGES, step).slug)!.id;
  const reached = (step: number) => new Set(d.dealStageHistory.filter(h => h.toStageId === stageId(step)).map(h => h.dealId)).size;
  assert.deepEqual([reached(1), reached(2), reached(3), reached(4), reached(5)], [176, 88, 53, 19, 15]);
  assert.ok(reached(5) <= reached(4) && reached(4) <= reached(3) && reached(3) <= d.leads.length, 'cierres ≤ reservas ≤ cotizaciones ≤ leads');
  const lost = d.deals.filter(deal => stages.get(deal.stageId)?.kind === 'lost');
  assert.equal(lost.filter(deal => reasons.has(deal.lossReasonId)).length, lost.length, 'suma motivos = perdidos'); assert.equal(lost.length, 64);
  for (const deal of d.deals) {
    const l = leads.get(deal.leadId)!;
    assert.ok(l); assert.equal(l.contactId, deal.contactId); assert.equal(l.convertedDealId, deal.id); assert.equal(l.status, 'converted'); assert.equal(l.brokerId, deal.brokerId);
    assert.ok(deal.createdAt! >= l.receivedAt! && deal.closedAt! <= new Date(AS_OF));
    const history = d.dealStageHistory.filter(h => h.dealId === deal.id).sort((a, b) => Number(a.changedAt) - Number(b.changedAt));
    assert.equal(history.at(-1)!.toStageId, deal.stageId); assert.equal(Number(history.at(-1)!.changedAt), Number(deal.stageChangedAt));
    for (let i = 0; i < history.length; i++) { assert.equal(history[i]!.fromStageId, i === 0 ? null : history[i - 1]!.toStageId); assert.ok(history[i]!.changedAt! >= deal.createdAt!); }
    if (stages.get(deal.stageId)!.kind !== 'open') assert.ok(deal.closedAt); else assert.equal(deal.closedAt, null);
  }
  for (const u of d.units) {
    const p = projects.get(u.projectId)!; assert.ok(p);
    assert.ok(d.zones.some(z => z.id === p.zoneId && z.name === p.zone));
    assert.ok(Number.isSafeInteger(u.realPriceCents) && u.realPriceCents! >= p.publicRangeMinCents! && u.realPriceCents! <= p.publicRangeMaxCents!);
    const fixture = at(PROJECTS, Number(p.id) - BASE_ID);
    assert.ok(u.builtAreaM2! >= fixture.areaMin && u.builtAreaM2! <= fixture.areaMax + 0.05);
    assert.ok(u.realPriceCents! / 100 / u.builtAreaM2! >= 900 && u.realPriceCents! / 100 / u.builtAreaM2! <= 5000, 'USD/m² plausible');
    assert.equal(d.unitInventoryStates.find(s => s.id === u.inventoryStateId)!.legacyStatus, u.status);
    const won = d.dealProperties.filter(dp => dp.unitId === u.id && d.deals.some(deal => deal.id === dp.dealId && stages.get(deal.stageId)!.kind === 'won'));
    assert.equal(won.length, u.status === 'sold' ? 1 : 0, 'SOLD tiene exactamente un ganado');
  }
  for (const dp of d.dealProperties) { assert.equal(units.get(dp.unitId)!.projectId, dp.projectId); assert.ok(d.deals.some(deal => deal.id === dp.dealId && deal.amountCents === units.get(dp.unitId)!.realPriceCents)); }
  for (const a of d.activities) { const l = leads.get(a.leadId)!; assert.ok(l); assert.equal(a.contactId, l.contactId); assert.ok(a.startsAt! >= l.receivedAt! && a.endsAt! > a.startsAt!); if (a.dealId) assert.ok(d.deals.some(deal => deal.id === a.dealId && deal.leadId === a.leadId)); }
  assert.ok(d.activities.some(a => a.status === 'pending' && a.startsAt! < new Date(AS_OF)) && d.activities.some(a => a.status === 'pending' && a.startsAt! > new Date(AS_OF)), 'vencidas y futuras');
  for (const c of d.commissions) { const deal = d.deals.find(deal => deal.id === c.dealId)!; assert.equal(deal.stageId, stageId(5)); assert.equal(c.saleAmountCents, deal.amountCents); assert.equal(c.totalCommissionCents, Math.round(c.saleAmountCents * c.commissionBasisPoints / 10000)); assert.equal(c.brokerAmountCents! + c.agencyAmountCents!, c.totalCommissionCents); }
  assert.equal(d.commissions.length, reached(5));
  for (const g of d.goals) { const won = d.deals.filter(deal => deal.stageId === stageId(5) && (g.brokerId === null || deal.brokerId === g.brokerId) && new Date(deal.closedAt!.getTime() - 4 * 3600000).getUTCFullYear() === g.year && new Date(deal.closedAt!.getTime() - 4 * 3600000).getUTCMonth() + 1 === g.month); assert.equal(g.achievedDeals, won.length); assert.equal(g.achievedAmountCents, won.reduce((s, deal) => s + Number(deal.amountCents), 0)); }
  for (const spend of d.campaignSpend) { const c = campaigns.get(spend.campaignId)!; assert.ok(c); assert.ok(spend.month.endsWith('-01') && spend.amountCents >= 0 && spend.currency === 'USD'); assert.ok(spend.month >= c.startsOn && spend.month <= c.endsOn); }
  const workload = d.users.map(b => d.leads.filter(l => l.brokerId === b.id).length); assert.ok(Math.max(...workload) > Math.min(...workload) * 5, 'brokers desiguales');
}
