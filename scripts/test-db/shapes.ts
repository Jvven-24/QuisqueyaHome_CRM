import { z } from 'zod';
const number = z.number().finite();
const count = number.int().nonnegative();
const cents = number.int().nonnegative().safe();
const id = number.int().positive();
const text = z.string();
export const negociosResumenShape = z.array(z.object({
  stageId: id, kind: z.enum(['open', 'won', 'lost']), currency: text,
  count, amountCents: cents.optional(),
}).strict());
const funnel = z.object({ stageId: id, label: text, kind: z.enum(['open', 'won', 'lost']), position: number.int(), count, reachedCount: count, previousReachedCount: count.nullable(), passedFromPreviousCount: count.nullable() }).strict();
export const dashboardShape = z.object({
  fullName: text, myLeads: count, monthLeads: count, activeDeals: count, pipelineCents: cents,
  monthWon: count, unassignedLeads: count, todayMeetings: count, weekMeetings: count, pendingTasks: count,
  goal: z.object({ achieved: count, target: count }).strict().nullable(), level: text.nullable(),
  recentLeads: z.array(z.object({ id, name: text, project: text, source: text, stage: text, next: text }).strict()),
  activities: z.array(z.object({ id, title: text, startsAt: text, location: text.nullable() }).strict()),
  projects: z.array(z.object({ id, name: text, leads: count }).strict()),
  academy: z.object({ title: text, progressPercent: number }).strict().nullable(), funnel: z.array(funnel),
}).strict();
export const reportShape = z.object({
  totalLeads: count, totalDeals: count, funnel: z.array(funnel),
  sources: z.array(z.object({ sourceId: id.nullable(), source: text, count, deals: count, won: count, revenueCents: cents, spendCents: cents.nullable() }).strict()),
  zones: z.array(z.object({ zoneId: id.nullable(), label: text, count }).strict()),
  lossReasons: z.array(z.object({ reasonId: id.nullable(), label: text, count }).strict()),
  trend: z.array(z.object({ month: text, leads: count, deals: count, won: count, revenueCents: cents }).strict()),
  brokers: z.array(z.object({ brokerId: id.nullable(), name: text, leads: count, deals: count, won: count, volumeCents: cents }).strict()),
  velocity: z.object({ sampleSize: count, medianDays: number.nullable(), p75Days: number.nullable() }).strict(),
  inventory: z.array(z.object({ state: text, count, medianAgeDays: number.nullable(), p75AgeDays: number.nullable() }).strict()),
  commissions: z.array(z.object({ month: text.nullable(), count, totalCents: cents, brokerCents: cents, agencyCents: cents, paidCents: cents }).strict()),
  projection: z.object({ totalWeightedCents: cents, knownAmountCents: cents, missingProbabilityCount: count, missingAmountCount: count, points: z.array(z.object({ month: text.nullable(), amountCents: cents }).strict()) }).strict(),
}).strict();
