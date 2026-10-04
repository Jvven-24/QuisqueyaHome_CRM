import assert from 'node:assert/strict';
import { after, test } from 'node:test';

// El script rápido conserva su glob, pero aquí no registra casos ni abre DB.
if ((globalThis as typeof globalThis & { [key: symbol]: unknown })[Symbol.for('qh.test-db')]) {
  const { db, connection, actorFor, rowShape, checked, rollback, visibleCount } = await import('../../../scripts/test-db/fixture.ts');
  const { dashboardShape, reportShape } = await import('../../../scripts/test-db/shapes.ts');
  const tables = await import('./schema.ts');
  const { eq, and, sql } = await import('drizzle-orm');
  const { PgDialect } = await import('drizzle-orm/pg-core');
  const { scopeFor } = await import('../../domain/rbac.ts');
  const { dashboardScopes, dashboardQuery } = await import('../../application/dashboard/consultas.ts');
  const { reportQuery } = await import('../../application/reportes/consultas.ts');
  const { AS_OF, VOLUMES, FUNNEL } = await import('../../../scripts/seed/catalog.ts');
  const { repositorioDashboard } = await import('./repos/dashboard.ts');
  const { crearConsultaReportes, repositorioReportes } = await import('./repos/reportes.ts');
  const { repositorioLeads } = await import('./repos/leads.ts');
  const { lecturaContactos, repositorioContactos } = await import('./repos/contactos.ts');
  const { repositorioPipeline } = await import('./repos/pipeline.ts');
  const { repositorioProyectos } = await import('./repos/proyectos.ts');
  const { repositorioComisiones } = await import('./repos/comisiones.ts');
  const { repositorioMetas } = await import('./repos/metas.ts');
  const { repositorioBrokers } = await import('./repos/brokers.ts');
  const actors = await Promise.all(['admin', 'broker', 'assistant'].map(actorFor));
  const admin = actors[0]!;
  const now = new Date(AS_OF);
  after(async () => { await connection.end({ timeout: 5 }); });

  // Nombrar cada consulta; una excepción SQL identifica la rama que la produjo.
  const check = (name: string, fn: () => Promise<unknown>) => test(`DB ${name}`, { concurrency: false }, async () => { await checked(fn); });

  for (const actor of actors) {
    const label = actor.roleSlug;
    const scope = scopeFor(actor, 'dashboard', 'view');
    assert.ok(scope !== 'none');
    const own = scope !== 'all';
    const contactScope = scopeFor(actor, 'contacts', 'view');
    const [lead] = await db.select().from(tables.leads).where(own ? eq(tables.leads.brokerId, actor.userId) : undefined).limit(1);
    const [contact] = await db.select().from(tables.contacts).where(own ? eq(tables.contacts.brokerId, actor.userId) : undefined).limit(1);
    const [deal] = await db.select().from(tables.deals).where(own ? eq(tables.deals.brokerId, actor.userId) : undefined).limit(1);
    const [project] = await db.select().from(tables.projects).where(own ? eq(tables.projects.brokerId, actor.userId) : undefined).limit(1);
    const [unit] = await db.select().from(tables.units).where(eq(tables.units.projectId, project!.id)).limit(1);
    const [commission] = await db.select().from(tables.commissions).where(own ? eq(tables.commissions.brokerId, actor.userId) : undefined).limit(1);
    assert.ok(lead && contact && deal && project && unit && commission);

    check(`dashboard.obtenerMetricasDashboard / ${label} (alias y alcance)`, async () => {
      const result = await repositorioDashboard(db).obtenerMetricasDashboard(actor, scope, dashboardScopes(actor, scope), dashboardQuery({}, now));
      assert.ok(dashboardShape.safeParse(result).success, 'forma DashboardSnapshot');
      assert.equal(result.funnel.reduce((sum, stage) => sum + stage.count, 0), await visibleCount(tables.deals, 'brokerId', actor, scope));
      const reference = await repositorioDashboard(db).obtenerMetricasDashboard(admin, 'all', dashboardScopes(admin, 'all'), dashboardQuery({}, now));
      assert.ok(result.activeDeals <= reference.activeDeals);
      assert.ok(result.monthLeads <= reference.monthLeads);
      for (const row of result.recentLeads) {
        const [stored] = await db.select().from(tables.leads).where(eq(tables.leads.id, row.id));
        assert.ok(stored);
        if (own) assert.equal(stored.brokerId, actor.userId, 'no lead ajeno');
      }
      for (const row of result.activities) {
        const [stored] = await db.select().from(tables.activities).where(eq(tables.activities.id, row.id));
        assert.ok(stored);
        if (own) assert.equal(stored.assigneeId, actor.userId, 'no actividad ajena');
      }
      for (const row of result.projects) {
        const [stored] = await db.select().from(tables.projects).where(eq(tables.projects.id, row.id));
        assert.ok(stored);
        if (own) assert.equal(stored.brokerId, actor.userId, 'no proyecto ajeno');
      }
    });
    check(`reportes.obtenerMetricasBi / ${label} (condición spend SQL)`, async () => {
      // Reportes exige ReadScope; broker no tiene reports.view en el catálogo.
      // Se prueba el puerto con own; no se le concede permiso de página/API.
      const query = reportQuery({}, now);
      const compiled = new PgDialect().sqlToQuery(crearConsultaReportes(actor, scope, query));
      for (const match of compiled.sql.matchAll(/\b(?:where|and|or|when)\s+\$(\d+)(?=\s|$)/gi)) {
        assert.ok(typeof compiled.params[Number(match[1]) - 1] !== 'boolean', 'reportes: booleano JS directo en condición SQL; usar fragmento sql');
      }
      const result = await repositorioReportes(db).obtenerMetricasBi(actor, scope, query);
      assert.ok(reportShape.safeParse(result).success, 'forma ReportSnapshot');
      assert.equal(result.totalDeals, await visibleCount(tables.deals, 'brokerId', actor, scope));
      assert.equal(result.totalLeads, await visibleCount(tables.leads, 'brokerId', actor, scope));
      assert.equal(result.funnel.reduce((sum, row) => sum + row.count, 0), result.totalDeals);
      assert.equal(result.sources.reduce((sum, row) => sum + row.count, 0), result.totalLeads);
      assert.equal(result.sources.reduce((sum, row) => sum + row.deals, 0), result.totalDeals);
      assert.equal(result.zones.reduce((sum, row) => sum + row.count, 0), result.totalLeads);
      assert.equal(result.brokers.reduce((sum, row) => sum + row.deals, 0), result.totalDeals);
      if (own) {
        assert.ok(result.totalDeals < VOLUMES.deals);
        assert.ok(result.brokers.every(row => row.brokerId === actor.userId));
        assert.ok(result.sources.every(row => row.spendCents === null));
      } else {
        assert.equal(result.totalLeads, VOLUMES.leads);
        assert.equal(result.totalDeals, VOLUMES.deals);
        assert.equal(result.lossReasons.reduce((sum, row) => sum + row.count, 0), FUNNEL.lost);
        assert.equal(result.commissions.reduce((sum, row) => sum + row.count, 0), FUNNEL.contracts);
      }
    });
    for (const filters of [{ projectId: project.id }, { brokerId: actor.userId }, { desde: '2026-01-01', hasta: '2026-09-30' }, { projectId: 2147483647 }]) {
      const filterLabel = Object.keys(filters).join('+');
      check(`dashboard+reportes filtros ${filterLabel} / ${label}`, async () => {
        const dashboard = await repositorioDashboard(db).obtenerMetricasDashboard(actor, scope, dashboardScopes(actor, scope), dashboardQuery(filters, now));
        const report = await repositorioReportes(db).obtenerMetricasBi(actor, scope, reportQuery(filters, now));
        assert.ok(dashboardShape.safeParse(dashboard).success);
        assert.ok(reportShape.safeParse(report).success);
        assert.equal(report.funnel.reduce((sum, row) => sum + row.count, 0), report.totalDeals);
        if (filters.projectId === 2147483647) { assert.equal(report.totalDeals, 0); assert.equal(report.totalLeads, 0); assert.equal(dashboard.recentLeads.length, 0); }
        if (own) assert.ok(report.brokers.every(row => row.brokerId === actor.userId));
        if ('projectId' in filters || 'brokerId' in filters || own) assert.ok(report.sources.every(row => row.spendCents === null));
      });
    }

    const lr = repositorioLeads(db);
    const cr = repositorioContactos(db);
    for (const [name, repo] of [['leads', lr], ['contactos', cr]] as const) {
      check(`${name}.candidatosDuplicados / ${label}`, async () => {
        const result = await repo.candidatosDuplicados({ phone: contact.phone, email: contact.email }, actor, contactScope);
        assert.equal(result.existe, true); assert.ok(result.candidatos.some(row => row.id === contact.id));
        for (const row of result.candidatos) { assert.equal(typeof row.fullName, 'string'); if (own) { const [c] = await db.select().from(tables.contacts).where(eq(tables.contacts.id, row.id)); assert.equal(c!.brokerId, actor.userId); } }
        const denied = await repo.candidatosDuplicados({ phone: contact.phone, email: contact.email }, actor, 'none');
        assert.equal(denied.existe, true); assert.deepEqual(denied.candidatos, []);
      });
    }
    check(`leads.contactoExiste / ${label}`, async () => { assert.equal(await lr.contactoExiste(contact.id), true); assert.equal(await lr.contactoExiste(2147483647), false); });
    check(`leads.candidatosBroker / ${label}`, async () => { const rows = await lr.candidatosBroker(); assert.equal(rows.length, VOLUMES.brokers); for (const row of rows) { assert.equal(typeof row.fullName, 'string'); assert.equal(typeof row.annualSalesCents, 'number'); } });
    check(`leads.buscarLead / ${label}`, async () => { const row = await lr.buscarLead(lead.id); rowShape(tables.leads, row); assert.equal(row!.id, lead.id); });
    check(`leads.buscarLeadParaConversion / ${label}`, async () => rollback(async tx => {
      const row = await repositorioLeads(tx, true).buscarLeadParaConversion(lead.id, actor, scope);
      rowShape(tables.leads, row); assert.equal(row!.id, lead.id);
    }));
    check(`leads.bloquearCapturaExterna / ${label}`, async () => rollback(async tx => { assert.equal(await repositorioLeads(tx, true).bloquearCapturaExterna('qa-missing-capture', 'fixture'), undefined); }));
    check(`leads.buscarContactoPorTelefonoOCorreo / ${label}`, async () => { assert.equal((await lr.buscarContactoPorTelefonoOCorreo({ phone: contact.phone, email: null }))!.id, contact.id); });
    check(`leads.primeraEtapaAbierta / ${label}`, async () => { const row = await lr.primeraEtapaAbierta(); const [first] = await db.select().from(tables.pipelineStages).where(eq(tables.pipelineStages.kind, 'open')).orderBy(tables.pipelineStages.position).limit(1); assert.equal(row!.id, first!.id); });
    check(`contactos.buscarVisible / ${label}`, async () => { const row = await cr.buscarVisible(actor, contactScope, contact.id); rowShape(tables.contacts, row); assert.equal(row!.id, contact.id); assert.equal(await cr.buscarVisible(actor, 'none', contact.id), undefined); });
    check(`contactos.listado / ${label}`, async () => {
      const result = await lecturaContactos(db).listado(actor, contactScope, { q: '', pagina: 1, tamanioPagina: 1000, incluirBrokers: !own, contactoId: contact.id });
      assert.equal(result.total, await visibleCount(tables.contacts, 'brokerId', actor, contactScope));
      assert.equal(result.contactos.length, result.total); assert.equal(result.contactoSeleccionado!.id, contact.id);
      assert.ok(result.canales.length > 0); assert.equal(result.brokers.length, own ? 0 : VOLUMES.brokers);
      for (const row of result.contactos) { assert.equal(typeof row.fullName, 'string'); assert.ok(row.lastInteractionAt === null || row.lastInteractionAt instanceof Date); if (own) assert.equal(row.brokerId, actor.userId); }
      const filtered = await lecturaContactos(db).listado(actor, contactScope, { q: contact.email!, sourceId: contact.sourceId!, pagina: 1, tamanioPagina: 10, incluirBrokers: false });
      assert.equal(filtered.total, 1); assert.equal(filtered.contactos[0]!.id, contact.id);
    });

    const pipelineCase = (name: string, fn: (repo: ReturnType<typeof repositorioPipeline>) => Promise<unknown>) => check(`pipeline.${name} / ${label}`, () => rollback(tx => fn(repositorioPipeline(tx))));
    pipelineCase('buscarNegocio', async repo => { const row = await repo.buscarNegocio(deal.id); rowShape(tables.deals, row); assert.equal(row!.id, deal.id); });
    pipelineCase('buscarEtapa', async repo => { rowShape(tables.pipelineStages, await repo.buscarEtapa(deal.stageId)); });
    pipelineCase('buscarEtapaActiva', async repo => { rowShape(tables.pipelineStages, await repo.buscarEtapaActiva(deal.stageId)); assert.equal(await repo.buscarEtapaActiva(2147483647), undefined); });
    pipelineCase('tieneActividadDeContacto', async repo => {
      const [expected] = await db.select({ count: sql<number>`count(*)::int` }).from(tables.activities).where(and(eq(tables.activities.dealId, deal.id), eq(tables.activities.status, 'completed'), sql`${tables.activities.activityType} in ('call', 'whatsapp', 'meeting', 'email')`));
      assert.equal(await repo.tieneActividadDeContacto(deal.id), expected!.count > 0);
    });
    pipelineCase('buscarProximaAccionVigente', async repo => { const [activity] = await db.select().from(tables.activities).where(and(eq(tables.activities.status, 'pending'), own ? eq(tables.activities.assigneeId, actor.userId) : undefined)).limit(1); assert.ok(activity); const row = await repo.buscarProximaAccionVigente(activity.id); assert.equal(row!.responsableId, activity.assigneeId); assert.equal(row!.fecha, activity.startsAt!.toISOString()); assert.equal(await repo.buscarProximaAccionVigente(2147483647), null); });
    pipelineCase('propiedadesDelNegocio', async repo => { const rows = await repo.propiedadesDelNegocio(deal.id); assert.equal(rows.length, 1); for (const row of rows) { rowShape(tables.dealProperties, row); assert.equal(row.dealId, deal.id); } });
    pipelineCase('bloquearNegocio', async repo => { rowShape(tables.deals, await repo.bloquearNegocio(deal.id)); });
    pipelineCase('buscarPerfilDeBroker', async repo => { assert.equal((await repo.buscarPerfilDeBroker(lead.brokerId!))!.userId, lead.brokerId); });
    pipelineCase('totalGanadoDelAnio', async repo => { const [expected] = await db.select({ total: sql`coalesce(sum(${tables.deals.amountCents}),0)` }).from(tables.deals).innerJoin(tables.pipelineStages, eq(tables.pipelineStages.id, tables.deals.stageId)).where(and(eq(tables.deals.brokerId, lead.brokerId!), eq(tables.pipelineStages.kind, 'won'), sql`extract(year from ${tables.deals.closedAt} at time zone 'America/Santo_Domingo') = 2026`)); assert.equal(await repo.totalGanadoDelAnio(lead.brokerId!, 2026), Number(expected!.total)); });
    pipelineCase('buscarNegocioConEtapa', async repo => { const row = await repo.buscarNegocioConEtapa(deal.id); rowShape(tables.deals, row!.negocio); assert.ok(['open', 'won', 'lost'].includes(row!.etapaKind)); });
    pipelineCase('proyectoVisible', async repo => { assert.equal((await repo.proyectoVisible(actor, scope, project.id))!.id, project.id); assert.equal(await repo.proyectoVisible(actor, 'none', project.id), undefined); });
    pipelineCase('unidadDelProyecto', async repo => { assert.equal((await repo.unidadDelProyecto(unit.id, project.id))!.id, unit.id); assert.equal(await repo.unidadDelProyecto(unit.id, 2147483647), undefined); });
    pipelineCase('buscarPropiedad', async repo => { const [property] = await db.select().from(tables.dealProperties).where(eq(tables.dealProperties.dealId, deal.id)); rowShape(tables.dealProperties, await repo.buscarPropiedad(deal.id, property!.id)); assert.equal(await repo.buscarPropiedad(2147483647, property!.id), undefined); });

    const pr = repositorioProyectos(db);
    check(`proyectos.proyectoVisible / ${label}`, async () => { rowShape(tables.projects, await pr.proyectoVisible(actor, scope, project.id)); assert.equal(await pr.proyectoVisible(actor, 'none', project.id), undefined); await rollback(async tx => { rowShape(tables.projects, await repositorioProyectos(tx).proyectoVisible(actor, scope, project.id, true)); }); });
    check(`proyectos.unidadVisible / ${label}`, async () => { rowShape(tables.units, await pr.unidadVisible(actor, scope, project.id, unit.id)); assert.equal(await pr.unidadVisible(actor, 'none', project.id, unit.id), undefined); });
    for (const method of ['fasesDelProyecto', 'faseVisible', 'fotosDeFase', 'fotoVisible'] as const) {
      check(`proyectos.${method} / ${label}`, async () => {
        // Fase adicional pertenece al primer proyecto: elegir alcance válido.
        if (method === 'fasesDelProyecto') { const rows = await pr.fasesDelProyecto(project.id); assert.ok(Array.isArray(rows)); rows.forEach(row => { assert.equal(typeof row.position, 'number'); assert.equal(typeof row.progressPercent, 'number'); }); }
        if (method === 'faseVisible') { const row = await pr.faseVisible(actor, scope, 1000000, 900001); if (own && actor.userId !== 1000000) assert.equal(row, undefined); else rowShape(tables.constructionPhases, row); }
        if (method === 'fotosDeFase') { const rows = await pr.fotosDeFase(900001); assert.equal(rows.length, 1); rowShape(tables.files, rows[0]); }
        if (method === 'fotoVisible') { rowShape(tables.files, await pr.fotoVisible(900001, 900001)); assert.equal(await pr.fotoVisible(2147483647, 900001), undefined); }
      });
    }
    check(`comisiones.bloquearComision / ${label}`, async () => rollback(async tx => { const row = await repositorioComisiones(tx).bloquearComision(commission.id); rowShape(tables.commissions, row!.comision); assert.equal(row!.comision.id, commission.id); assert.equal(row!.negocioBorradoEn, null); }));
    check(`metas.existePerfilDeBroker / ${label}`, async () => rollback(async tx => { assert.equal(await repositorioMetas(tx).existePerfilDeBroker(lead.brokerId!), true); assert.equal(await repositorioMetas(tx).existePerfilDeBroker(2147483647), false); }));
    for (const brokerId of [lead.brokerId!, null]) {
      check(`metas.fijarMetaMensual lectura anterior ${brokerId === null ? 'compañía' : 'broker'} / ${label}`, async () => rollback(async tx => {
        const repo = repositorioMetas(tx);
        const result = await repo.fijarMetaMensual({ brokerId, year: 2026, month: 10, targetDeals: 123, actorId: actor.userId });
        rowShape(tables.goals, result.meta); rowShape(tables.goals, result.anterior);
        assert.equal(result.meta.targetDeals, 123); assert.equal(result.meta.achievedDeals, result.anterior!.achievedDeals);
        assert.equal(result.meta.achievedAmountCents, result.anterior!.achievedAmountCents);
      }));
    }
    check(`brokers.buscarBroker / ${label}`, async () => rollback(async tx => { const row = await repositorioBrokers(tx).buscarBroker(lead.brokerId!); assert.equal(row!.userId, lead.brokerId); assert.equal(row!.isActive, true); assert.equal(row!.deletedAt, null); }));
    for (const requested of [[], [project.id]]) {
      check(`brokers.proyectosRelevantes ${requested.length ? 'con ids' : 'sin ids'} / ${label}`, async () => rollback(async tx => {
        const rows = await repositorioBrokers(tx).proyectosRelevantes(lead.brokerId!, requested);
        assert.ok(rows.length > 0); rows.forEach(row => { rowShape(tables.projects, row); assert.ok(row.brokerId === lead.brokerId || requested.includes(row.id)); assert.equal(row.deletedAt, null); assert.equal(row.isActive, true); });
      }));
    }
    if (own) {
      check(`own rechaza IDs ajenos en contactos/leads/proyectos/pipeline / ${label}`, async () => {
        const [foreignContact] = await db.select().from(tables.contacts).where(sql`${tables.contacts.brokerId} <> ${actor.userId}`).limit(1);
        const [foreignLead] = await db.select().from(tables.leads).where(sql`${tables.leads.brokerId} <> ${actor.userId}`).limit(1);
        const [foreignProject] = await db.select().from(tables.projects).where(sql`${tables.projects.brokerId} <> ${actor.userId}`).limit(1);
        assert.ok(foreignContact && foreignLead && foreignProject);
        assert.equal(await cr.buscarVisible(actor, scope, foreignContact.id), undefined);
        assert.equal(await pr.proyectoVisible(actor, scope, foreignProject.id), undefined);
        const list = await lecturaContactos(db).listado(actor, scope, { q: '', pagina: 1, tamanioPagina: 20, contactoId: foreignContact.id, incluirBrokers: false });
        assert.equal(list.contactoSeleccionado, null);
        await rollback(async tx => { assert.equal(await repositorioLeads(tx, true).buscarLeadParaConversion(foreignLead.id, actor, scope), undefined); });
        await rollback(async tx => { assert.equal(await repositorioPipeline(tx).proyectoVisible(actor, scope, foreignProject.id), undefined); });
      });
    }
  }
}
