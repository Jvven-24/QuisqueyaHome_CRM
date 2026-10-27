"use client";
import { Checkbox } from "@/components/ui/checkbox";

import { useMemo, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { calcularCotizacionConfotur } from "@/domain/confotur";
import {
  Calculator,
  CheckCircle2,
  FileText,
  MessageSquare,
  Printer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

type CotizadorConfoturModalProps = {
  tituloPropiedad: string;
  subtituloZona?: string | null;
  precioInicialCents: number;
  monedaInicial?: string;
  aplicaConfoturInicial?: boolean;
  clienteNombre?: string | null;
  clienteTelefono?: string | null;
  onClose: () => void;
};

const PLANES_ESTANDAR = [
  { id: "20-30-50", etiqueta: "20% / 30% / 50% · Estándar Preventa", inicial: 20, construccion: 30, entrega: 50 },
  { id: "10-40-50", etiqueta: "10% / 40% / 50% · Flexible Diáspora", inicial: 10, construccion: 40, entrega: 50 },
  { id: "30-40-30", etiqueta: "30% / 40% / 30% · Patrimonial", inicial: 30, construccion: 40, entrega: 30 },
  { id: "20-60-20", etiqueta: "20% / 60% / 20% · Obra Acelerada", inicial: 20, construccion: 60, entrega: 20 },
] as const;

function formatearMoneda(centavos: number, moneda: string): string {
  const codigo = moneda === "DOP" ? "DOP" : "USD";
  return new Intl.NumberFormat(codigo === "DOP" ? "es-DO" : "en-US", {
    style: "currency",
    currency: codigo,
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}

export function CotizadorConfoturModal({
  tituloPropiedad,
  subtituloZona,
  precioInicialCents,
  monedaInicial = "USD",
  aplicaConfoturInicial = true,
  clienteNombre,
  clienteTelefono,
  onClose,
}: CotizadorConfoturModalProps) {
  const modalRef = useFocusTrap<HTMLElement>({ onClose });

  const precioBaseUsd = Math.max(25000, Math.round((precioInicialCents || 18500000) / 100));
  const [precioVenta, setPrecioVenta] = useState<number>(precioBaseUsd);
  const [moneda, setMoneda] = useState<string>(monedaInicial || "USD");
  const [tasaDop, setTasaDop] = useState<number>(60.5);
  const [mostrarEquivalenteDop, setMostrarEquivalenteDop] = useState<boolean>(false);
  const [reservaMonto, setReservaMonto] = useState<number>(monedaInicial === "DOP" ? 100000 : 2000);
  const [pInicial, setPInicial] = useState<number>(20);
  const [pConstruccion, setPConstruccion] = useState<number>(30);
  const [pEntrega, setPEntrega] = useState<number>(50);
  const [mesesConstruccion, setMesesConstruccion] = useState<number>(24);
  const [aplicaConfotur, setAplicaConfotur] = useState<boolean>(aplicaConfoturInicial);
  const [roiAnualPorcentaje, setRoiAnualPorcentaje] = useState<number>(9);
  const [verTablaCuotas, setVerTablaCuotas] = useState<boolean>(false);
  const [sincronizadoApi, setSincronizadoApi] = useState<boolean>(false);

  const sumaPorcentajes = pInicial + pConstruccion + pEntrega;
  const porcentajesValidos = Math.abs(sumaPorcentajes - 100) < 0.01;

  const resultado = useMemo(() => {
    const pIni = porcentajesValidos ? pInicial : 20;
    const pCon = porcentajesValidos ? pConstruccion : 30;
    const pEnt = porcentajesValidos ? pEntrega : 50;
    return calcularCotizacionConfotur({
      precioVentaCents: Math.round(precioVenta * 100),
      moneda,
      reservaCents: Math.round(reservaMonto * 100),
      porcentajeInicial: pIni,
      porcentajeConstruccion: pCon,
      porcentajeContraEntrega: pEnt,
      mesesConstruccion: Math.max(1, mesesConstruccion),
      anosExencionIpi: 15,
      roiAnualEstimado: Math.max(0, Math.min(1, roiAnualPorcentaje / 100)),
    });
  }, [
    precioVenta,
    moneda,
    reservaMonto,
    pInicial,
    pConstruccion,
    pEntrega,
    porcentajesValidos,
    mesesConstruccion,
    roiAnualPorcentaje,
  ]);

  async function validarConServidor() {
    try {
      const res = await fetch("/api/cotizador/confotur", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          precioVentaCents: Math.round(precioVenta * 100),
          moneda,
          reservaCents: Math.round(reservaMonto * 100),
          porcentajeInicial: pInicial,
          porcentajeConstruccion: pConstruccion,
          porcentajeContraEntrega: pEntrega,
          mesesConstruccion,
          anosExencionIpi: 15,
          roiAnualEstimado: roiAnualPorcentaje / 100,
        }),
      });
      if (res.ok) {
        setSincronizadoApi(true);
      }
    } catch {
      // Mantiene cálculo determinista local del dominio
    }
  }

  function fmt(centavos: number): string {
    const base = formatearMoneda(centavos, moneda);
    if (mostrarEquivalenteDop && moneda === "USD") {
      const dopCents = Math.round(centavos * tasaDop);
      return `${base} (≈ ${formatearMoneda(dopCents, "DOP")})`;
    }
    return base;
  }

  const textoWhatsApp = useMemo(() => {
    const saludo = clienteNombre ? `Estimado/a ${clienteNombre}, le comparto` : "Le comparto";
    const lineas = [
      `*PROPUESTA PATRIMONIAL · QUISQUEYA HOME PRIVATE DESK*`,
      `Propiedad: *${tituloPropiedad}*${subtituloZona ? ` (${subtituloZona})` : ""}`,
      `${saludo} el plan de inversión estructurado:`,
      ``,
      `• *Valor de adquisición:* ${formatearMoneda(resultado.precioVentaCents, moneda)}`,
      `• *1. Reserva de unidad:* ${formatearMoneda(resultado.planDePago.reservaCents, moneda)}`,
      `• *2. Completivo inicial (${pInicial}%):* ${formatearMoneda(resultado.planDePago.separacionCents, moneda)}`,
      `• *3. Durante construcción (${pConstruccion}% en ${mesesConstruccion} cuotas):* ${formatearMoneda(resultado.planDePago.cuotaMensualConstruccionCents, moneda)} / mes`,
      `• *4. Contra entrega (${pEntrega}%):* ${formatearMoneda(resultado.planDePago.contraEntregaCents, moneda)}`,
    ];

    if (aplicaConfotur) {
      lineas.push(
        ``,
        `*BENEFICIOS FISCALES LEY 158-01 (CONFOTUR):*`,
        `• Exención 3% Transferencia: ${formatearMoneda(resultado.ahorroFiscal.ahorroTransferencia3PorcientoCents, moneda)}`,
        `• Exención 1% IPI anual (15 años): ${formatearMoneda(resultado.ahorroFiscal.ahorroIpiTotalPeriodoCents, moneda)}`,
        `• *Ahorro Fiscal Total:* ${formatearMoneda(resultado.ahorroFiscal.ahorroFiscalTotalCents, moneda)}`,
      );
    }

    lineas.push(
      ``,
      `• *Ingreso anual estimado (${roiAnualPorcentaje}% ROI):* ${formatearMoneda(resultado.ingresoBrutoAnualEstimadoCents, moneda)} / año`,
    );

    return lineas.join("\n");
  }, [
    clienteNombre,
    tituloPropiedad,
    subtituloZona,
    resultado,
    moneda,
    pInicial,
    pConstruccion,
    pEntrega,
    mesesConstruccion,
    aplicaConfotur,
    roiAnualPorcentaje,
  ]);

  const cleanPhone = clienteTelefono ? clienteTelefono.replace(/\D/g, "") : "";
  const urlWhatsApp = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textoWhatsApp)}`
    : `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={modalRef}
        tabIndex={-1}
        className="modal bg-surface border border-line rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cotizador-confotur-title"
      >
        {/* Header */}
        <div className="drawer-head flex items-center justify-between px-6 py-4 border-b border-line bg-navy-950 text-white sticky top-0 z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-gold-400">
              <Calculator className="size-4 text-gold-400" />
              Estructuración Financiera · Ley 158-01 (Confotur)
            </span>
            <h2 id="cotizador-confotur-title" className="font-heading font-extrabold text-lg md:text-xl text-white m-0">
              {tituloPropiedad}
              {subtituloZona ? <span className="font-normal text-gold-300"> · {subtituloZona}</span> : null}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar cotizador"
            className="min-h-12 min-w-12 inline-flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 grid gap-6">
          {/* Selector de esquemas predefinidos */}
          <div className="grid gap-2">
            <span className="text-[13px] font-bold uppercase tracking-wider text-ink-muted">
              Esquemas de pago habituales en República Dominicana
            </span>
            <div className="flex flex-wrap gap-2">
              {PLANES_ESTANDAR.map((plan) => {
                const activo =
                  pInicial === plan.inicial &&
                  pConstruccion === plan.construccion &&
                  pEntrega === plan.entrega;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setPInicial(plan.inicial);
                      setPConstruccion(plan.construccion);
                      setPEntrega(plan.entrega);
                    }}
                    className={`min-h-12 px-4 rounded-xl border text-[13.5px] font-bold transition-all cursor-pointer ${
                      activo
                        ? "bg-navy-950 text-white border-navy-950 shadow-xs"
                        : "bg-surface-alt text-navy-950 border-line hover:border-gold-500"
                    }`}
                  >
                    {plan.etiqueta}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parámetros de entrada */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 rounded-xl border border-line bg-surface-alt/70 p-4">
            <label className="grid gap-1 text-[13.5px] font-semibold text-ink">
              <span>Precio de venta ({moneda})</span>
              <input
                type="number"
                min={1000}
                step={1000}
                value={precioVenta}
                onChange={(e) => setPrecioVenta(Math.max(0, Number(e.target.value)))}
                className="min-h-12 rounded-lg border border-input-line bg-surface px-3.5 font-mono text-[14px] font-bold text-navy-950"
              />
            </label>

            <label className="grid gap-1 text-[13.5px] font-semibold text-ink">
              <span>Reserva de bloqueo ({moneda})</span>
              <input
                type="number"
                min={0}
                step={500}
                value={reservaMonto}
                onChange={(e) => setReservaMonto(Math.max(0, Number(e.target.value)))}
                className="min-h-12 rounded-lg border border-input-line bg-surface px-3.5 font-mono text-[14px] text-ink"
              />
            </label>

            <label className="grid gap-1 text-[13.5px] font-semibold text-ink">
              <span>Plazo de obra (meses)</span>
              <input
                type="number"
                min={1}
                max={72}
                value={mesesConstruccion}
                onChange={(e) => setMesesConstruccion(Math.max(1, Number(e.target.value)))}
                className="min-h-12 rounded-lg border border-input-line bg-surface px-3.5 font-mono text-[14px] text-ink"
              />
            </label>

            <label className="grid gap-1 text-[13.5px] font-semibold text-ink">
              <span>ROI anual estimado (%)</span>
              <input
                type="number"
                min={1}
                max={25}
                step={0.5}
                value={roiAnualPorcentaje}
                onChange={(e) => setRoiAnualPorcentaje(Math.max(0, Number(e.target.value)))}
                className="min-h-12 rounded-lg border border-input-line bg-surface px-3.5 font-mono text-[14px] text-ink"
              />
            </label>

            <label className="grid gap-1 text-[13.5px] font-semibold text-ink">
              <span>% Inicial (incluye reserva)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={pInicial}
                onChange={(e) => setPInicial(Number(e.target.value))}
                className="min-h-12 rounded-lg border border-input-line bg-surface px-3.5 font-mono text-[14px] text-ink"
              />
            </label>

            <label className="grid gap-1 text-[13.5px] font-semibold text-ink">
              <span>% Durante construcción</span>
              <input
                type="number"
                min={0}
                max={100}
                value={pConstruccion}
                onChange={(e) => setPConstruccion(Number(e.target.value))}
                className="min-h-12 rounded-lg border border-input-line bg-surface px-3.5 font-mono text-[14px] text-ink"
              />
            </label>

            <label className="grid gap-1 text-[13.5px] font-semibold text-ink">
              <span>% Contra entrega</span>
              <input
                type="number"
                min={0}
                max={100}
                value={pEntrega}
                onChange={(e) => setPEntrega(Number(e.target.value))}
                className="min-h-12 rounded-lg border border-input-line bg-surface px-3.5 font-mono text-[14px] text-ink"
              />
            </label>

            <div className="grid gap-1 text-[13.5px] font-semibold text-ink">
              <span>Moneda y conversión</span>
              <div className="flex items-center gap-2">
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  aria-label="Moneda de la cotización"
                  className="min-h-12 flex-1 rounded-lg border border-input-line bg-surface px-3 text-[13.5px] font-bold text-navy-950 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="DOP">DOP (RD$)</option>
                </select>
                {moneda === "USD" && (
                  <button
                    type="button"
                    onClick={() => setMostrarEquivalenteDop((v) => !v)}
                    className={`min-h-12 px-3 rounded-lg border text-[13px] font-bold cursor-pointer ${
                      mostrarEquivalenteDop
                        ? "bg-gold-600 text-navy-950 border-gold-600"
                        : "bg-surface text-ink border-line"
                    }`}
                    title={`Tasa: RD$ ${tasaDop}`}
                  >
                    + DOP
                  </button>
                )}
              </div>
            </div>

            {mostrarEquivalenteDop && moneda === "USD" && (
              <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60">
                <span className="text-[13px] text-ink-soft">
                  Mostrando doble moneda para comprador local/diáspora (USD + equivalente en Pesos Dominicanos).
                </span>
                <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-navy-950">
                  <span>Tasa USD → DOP:</span>
                  <input
                    type="number"
                    step={0.1}
                    min={40}
                    max={100}
                    value={tasaDop}
                    onChange={(e) => setTasaDop(Number(e.target.value) || 60.5)}
                    className="min-h-12 w-24 rounded-lg border border-input-line bg-surface px-2.5 font-mono text-[13.5px]"
                  />
                </label>
              </div>
            )}

            {!porcentajesValidos && (
              <div className="md:col-span-4 rounded-lg bg-danger-bg border border-danger/30 px-3.5 py-2.5 text-[13.5px] font-semibold text-danger">
                La suma de los porcentajes debe ser exactamente 100% (actual: {sumaPorcentajes}%). Ajusta los tramos para actualizar la tabla.
              </div>
            )}
          </div>

          {/* Desglose de Plan de Pagos + Escudo Fiscal Confotur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta 1: Hitos del Plan de Pago */}
            <div className="rounded-xl border border-line bg-surface p-5 shadow-xs grid gap-3.5">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <strong className="font-heading text-[15px] text-navy-950 flex items-center gap-2">
                  <FileText className="size-4 text-gold-600" />
                  Estructura del Plan de Pagos
                </strong>
                <span className="text-[13px] font-bold text-gold-700 bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-300/60">
                  {pInicial}% / {pConstruccion}% / {pEntrega}%
                </span>
              </div>

              <dl className="grid gap-2.5 text-[13.5px]">
                <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                  <dt className="text-ink-soft">1. Reserva de unidad (bloqueo)</dt>
                  <dd className="font-mono font-bold text-navy-950 tabular-nums">
                    {fmt(resultado.planDePago.reservaCents)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                  <dt className="text-ink-soft">2. Completivo firma de promesa ({pInicial}% menos reserva)</dt>
                  <dd className="font-mono font-bold text-navy-950 tabular-nums">
                    {fmt(resultado.planDePago.separacionCents)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                  <dt className="text-ink-soft">
                    3. Durante construcción ({pConstruccion}% en {mesesConstruccion} meses)
                  </dt>
                  <dd className="font-mono font-bold text-navy-950 tabular-nums">
                    {fmt(resultado.planDePago.duranteConstruccionCents)}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gold-50/50 border border-gold-400/40 px-3 py-2">
                  <dt className="font-bold text-navy-950">Cuota mensual de obra ({mesesConstruccion} cuotas)</dt>
                  <dd className="font-mono text-[15px] font-extrabold text-gold-800 tabular-nums">
                    {fmt(resultado.planDePago.cuotaMensualConstruccionCents)} / mes
                  </dd>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <dt className="text-ink-soft">4. Contra entrega / financiamiento ({pEntrega}%)</dt>
                  <dd className="font-mono font-bold text-navy-950 tabular-nums">
                    {fmt(resultado.planDePago.contraEntregaCents)}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => setVerTablaCuotas((v) => !v)}
                className="min-h-12 w-full rounded-xl border border-line bg-surface-alt text-[13.5px] font-semibold text-navy-950 hover:border-gold-500 transition-colors cursor-pointer"
              >
                {verTablaCuotas
                  ? "Ocultar cronograma mensual de cuotas"
                  : `Ver cronograma detallado (${mesesConstruccion} cuotas de construcción)`}
              </button>
            </div>

            {/* Tarjeta 2: Escudo Fiscal Ley 158-01 Confotur + ROI */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/20 p-5 shadow-xs grid gap-3.5">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                <label className="font-heading text-[15px] font-bold text-navy-950 flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={aplicaConfotur} onCheckedChange={(checked) => setAplicaConfotur(checked)} />
                  <ShieldCheck className="size-4 text-emerald-700" />
                  <span>Escudo Fiscal Confotur (Ley 158-01)</span>
                </label>
                <span className="text-[13px] font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {aplicaConfotur ? "Exento 15 años" : "Régimen ordinario"}
                </span>
              </div>

              {aplicaConfotur ? (
                <dl className="grid gap-2.5 text-[13.5px]">
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-500/20">
                    <dt className="text-ink-soft">Exención 3% Transferencia Inmobiliaria</dt>
                    <dd className="font-mono font-bold text-emerald-800 tabular-nums">
                      + {fmt(resultado.ahorroFiscal.ahorroTransferencia3PorcientoCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-500/20">
                    <dt className="text-ink-soft">Exención 1% IPI Anual (por año)</dt>
                    <dd className="font-mono font-semibold text-emerald-800 tabular-nums">
                      + {fmt(resultado.ahorroFiscal.ahorroIpiAnualCents)} / año
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-500/20">
                    <dt className="text-ink-soft">Exención IPI acumulada (15 años)</dt>
                    <dd className="font-mono font-bold text-emerald-800 tabular-nums">
                      + {fmt(resultado.ahorroFiscal.ahorroIpiTotalPeriodoCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-emerald-600 text-white px-3.5 py-2.5">
                    <dt className="font-bold">Ahorro Fiscal Total (Ley 158-01)</dt>
                    <dd className="font-mono text-[15px] font-extrabold tabular-nums">
                      {fmt(resultado.ahorroFiscal.ahorroFiscalTotalCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <dt className="text-ink-soft font-semibold">Costo efectivo neto tras ahorro fiscal</dt>
                    <dd className="font-mono font-extrabold text-navy-950 tabular-nums">
                      {fmt(resultado.precioEfectivoConAhorroCents)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-[13.5px] text-ink-soft m-0">
                  Este escenario calcula impuestos ordinarios: 3% de transferencia inmobiliaria (
                  {fmt(resultado.ahorroFiscal.ahorroTransferencia3PorcientoCents)}) al transferir el título.
                </p>
              )}

              <div className="rounded-lg border border-line bg-surface p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-gold-600" />
                  <span className="text-[13.5px] font-semibold text-navy-950">
                    Flujo bruto anual proyectado ({roiAnualPorcentaje}% ROI)
                  </span>
                </div>
                <strong className="font-mono text-[14px] font-extrabold text-navy-950 tabular-nums">
                  {fmt(resultado.ingresoBrutoAnualEstimadoCents)} / año
                </strong>
              </div>
            </div>
          </div>

          {/* Tabla de amortización mensual durante construcción */}
          {verTablaCuotas && (
            <div className="rounded-xl border border-line bg-surface-alt p-4 max-h-60 overflow-y-auto">
              <strong className="block text-[13.5px] font-bold text-navy-950 mb-2">
                Cronograma de {mesesConstruccion} cuotas mensuales durante construcción
              </strong>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {resultado.planDePago.cuotasDesglose.map((c) => (
                  <div
                    key={c.numeroCuota}
                    className="rounded-lg border border-line bg-surface px-3 py-2 flex items-center justify-between text-[13px]"
                  >
                    <span className="font-semibold text-ink-muted">Cuota #{c.numeroCuota}</span>
                    <span className="font-mono font-bold text-navy-950 tabular-nums">
                      {formatearMoneda(c.montoCents, moneda)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pie de acciones ejecutivas */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line">
            <div className="flex items-center gap-2 text-[13px] text-ink-muted">
              {sincronizadoApi ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="size-4" />
                  Propuesta verificada por motor fiscal Confotur
                </span>
              ) : (
                <button
                  type="button"
                  onClick={validarConServidor}
                  className="min-h-12 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-alt text-[13px] font-semibold text-navy-950 hover:border-gold-500 cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-gold-600" />
                  <span>Certificar cálculo fiscal</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-12 px-4 inline-flex items-center gap-2 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13.5px] font-bold transition-colors cursor-pointer"
              >
                <Printer className="size-4 text-gold-600" />
                <span>Imprimir / PDF</span>
              </button>

              <a
                href={urlWhatsApp}
                target="_blank"
                rel="noreferrer"
                className="min-h-12 px-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13.5px] font-bold shadow-xs transition-colors"
              >
                <MessageSquare className="size-4" />
                <span>Enviar propuesta por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
