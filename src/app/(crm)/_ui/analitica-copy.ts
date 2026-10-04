/** Catálogo compartido de contenido de Inicio/Reportes, idioma actual es-DO.
 * El repositorio no tiene runtime de i18n: no declarar soporte multilingüe.
 */
export const analyticsCopy = {
  common: {
    loading: "Cargando métricas…", empty: "No hay datos visibles para este periodo.",
    error: "No se pudieron cargar las métricas.", retry: "Reintentar", offline: "Sin conexión. Los datos visibles corresponden a la última consulta recibida; no se están actualizando.",
    permission: "No tienes permiso para consultar esta información.", filters: "Filtros", apply: "Aplicar filtros", clear: "Limpiar filtros", close: "Cerrar", detail: "Ver detalle", range: "Periodo de análisis",
    all: "Todo el historial", quarter: "Últimos 90 días", year: "Este año", from: "Desde", to: "Hasta", project: "Proyecto", broker: "Broker", allProjects: "Todos los proyectos visibles", allBrokers: "Todos los brokers visibles", selectedProject: "Proyecto seleccionado", selectedBroker: "Broker seleccionado", noDate: "Sin fecha", noBase: "Sin base", noData: "Sin datos", leads: "Leads", deals: "Negocios", won: "Cierres", amount: "Importe USD", count: "Cantidad", days: "Días", received: "Consulta recibida", values: "Valores de la gráfica", scope: "Datos dentro de tu alcance autorizado", filtered: "Los filtros se aplican al volver a consultar el servidor.", export: "Exportar embudo a CSV", exportDone: "CSV del embudo preparado para descarga.", exportError: "No se pudo preparar el CSV. Reintenta la descarga.", exportDenied: "Tu permiso permite consultar, pero no exportar.", noLocation: "Sin ubicación", previousMissing: "Comparación anterior no disponible", projectsPartial: "Lista de proyectos visibles con demanda registrada.",
  },
  inicio: {
    title: "Inicio", greeting: "Hola", subtitle: "Tu operación, las próximas actividades y el estado del embudo.", summary: "Resumen", funnel: "Embudo", agenda: "Agenda", tabs: "Secciones de Inicio", viewLeads: "Ver leads", viewAgenda: "Ver agenda", viewPipeline: "Ver pipeline", createLead: "Registrar lead", attention: "Leads recientes", attentionContext: "Ordenados por ingreso reciente; revisa la próxima acción de cada registro.", activities: "Próximas actividades", activitiesContext: "Próximas actividades, hora de Santo Domingo", noLeads: "Sin leads recientes visibles.", noActivities: "Sin próximas actividades visibles.", monthLeads: "Leads del mes", active: "Negocios activos", pipeline: "Pipeline USD", monthWon: "Cierres del mes", conversion: "Conversión del mes", month: "Mes actual", current: "Negocios abiertos visibles", conversionContext: "Cierres del mes / leads del mes", myLeads: "Mis leads", meetings: "Citas esta semana", goal: "Meta del mes", level: "Mi nivel", unassigned: "Leads sin asignar", today: "Citas de hoy", pending: "Tareas pendientes", review: "Avances por revisar", reviewMissing: "Sin registro de revisión", goalContext: "Cumplimiento de la meta recibida", portfolio: "Cartera asignada visible", funnelContext: "Alcanzaron cada etapa; tasa de paso sobre la etapa anterior", reached: "Alcanzaron", pass: "Tasa de paso", currentCount: "Actuales", demand: "Proyectos con demanda", demandContext: "Leads visibles por proyecto", academy: "Capacitación en progreso", academyEmpty: "Sin cursos en progreso.", complete: "Completado",
  },
  reportes: {
    title: "Reportes", subtitle: "Conversión y rendimiento comercial dentro de tu alcance.", tabs: "Secciones de Reportes", funnel: "Embudo", channels: "Canales", trend: "Tendencia", zones: "Zonas", brokers: "Brokers", velocity: "Velocidad", inventory: "Inventario", commissions: "Comisiones", forecast: "Pronóstico", funnelContext: "Etapas alcanzadas y tasa de paso sobre la etapa anterior", channelsContext: "Distribución de captación y retorno atribuido por canal", roi: "ROI", revenue: "Ingresos USD", spend: "Gasto USD", roiMissing: "No atribuible o sin gasto", trendContext: "Leads, negocios y cierres por mes. Ventana de 18 meses de la consulta.", trendOverlap: "Son conteos de eventos distintos; el total apilado no representa personas únicas.", zonesContext: "Interés por zona de los leads visibles", brokersContext: "Volumen cerrado USD por broker", velocityContext: "Tiempo de lead a cierre de los negocios medidos", median: "Mediana", p75: "Percentil 75", samples: "Cierres medidos", velocityMissing: "Distribución de tiempos no disponible. Se muestran mediana y percentil 75 de los cierres medidos.", inventoryContext: "Unidades visibles por estado y antigüedad desde alta", inventoryMissing: "La consulta agrupa por estado; no entrega desglose por proyecto para barras apiladas.", commissionsContext: "Distribución de comisiones por mes de cierre, en USD", agency: "Agencia", brokerShare: "Broker", paid: "Pagadas", forecastContext: "Pipeline abierto ponderado por probabilidad de cierre, en USD", forecastMissing: "Intervalo de confianza no disponible. La línea muestra la proyección ponderada.", weighted: "Pipeline ponderado", probability: "Probabilidad ponderada", missingProbability: "Sin probabilidad", missingAmount: "Sin monto", losses: "Motivos de pérdida", lossContext: "Pérdidas registradas dentro de tu alcance", available: "Disponible", reserved: "Reservado", sold: "Vendido", blocked: "Bloqueado", unavailable: "No disponible",
  },
} as const;

export const reportTabs = [
  { id: "embudo", label: analyticsCopy.reportes.funnel }, { id: "canales", label: analyticsCopy.reportes.channels },
  { id: "tendencia", label: analyticsCopy.reportes.trend }, { id: "zonas", label: analyticsCopy.reportes.zones },
  { id: "brokers", label: analyticsCopy.reportes.brokers }, { id: "velocidad", label: analyticsCopy.reportes.velocity },
  { id: "inventario", label: analyticsCopy.reportes.inventory }, { id: "comisiones", label: analyticsCopy.reportes.commissions },
  { id: "pronostico", label: analyticsCopy.reportes.forecast },
] as const;
export const inicioTabs = [
  { id: "resumen", label: analyticsCopy.inicio.summary }, { id: "embudo", label: analyticsCopy.inicio.funnel }, { id: "agenda", label: analyticsCopy.inicio.agenda },
] as const;
export const reportPeriods = [
  { id: "todo", label: analyticsCopy.common.all }, { id: "90d", label: analyticsCopy.common.quarter }, { id: "ano", label: analyticsCopy.common.year },
] as const;
export const inventoryLabels: Readonly<Record<string, string>> = {
  available: analyticsCopy.reportes.available, reserved: analyticsCopy.reportes.reserved, sold: analyticsCopy.reportes.sold, blocked: analyticsCopy.reportes.blocked, unavailable: analyticsCopy.reportes.unavailable,
};
