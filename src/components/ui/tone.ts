/**
 * Colores y tonos de estado para Quisqueya Home CRM (Viltrum Studio Design System).
 *
 * Azul y Oro identifican la marca Quisqueya; verde, ámbar y rojo indican estados de ciclo de vida.
 */

export type Tone = 'neutral' | 'info' | 'ok' | 'warn' | 'danger' | 'gold';

export const TONE: Record<Tone, {
  soft: string;
  text: string;
  solid: string;
  edge: string;
}> = {
  neutral: { 
    soft: 'bg-slate-100/90 text-slate-700 border-slate-200/70', 
    text: 'text-slate-700', 
    solid: 'bg-slate-400', 
    edge: 'border-slate-200 hover:border-slate-300 hover:shadow-xs' 
  },
  info: { 
    soft: 'bg-blue-50/90 text-blue-700 border-blue-200/70', 
    text: 'text-blue-700', 
    solid: 'bg-blue-500', 
    edge: 'border-blue-200 hover:border-blue-300 hover:shadow-xs' 
  },
  ok: { 
    soft: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/70', 
    text: 'text-emerald-700', 
    solid: 'bg-emerald-500', 
    edge: 'border-emerald-200 hover:border-emerald-300 hover:shadow-xs' 
  },
  warn: { 
    soft: 'bg-amber-50/90 text-amber-800 border-amber-200/70', 
    text: 'text-amber-800', 
    solid: 'bg-amber-500', 
    edge: 'border-amber-200 hover:border-amber-300 hover:shadow-xs' 
  },
  danger: { 
    soft: 'bg-rose-50/90 text-rose-800 border-rose-200/70', 
    text: 'text-rose-700', 
    solid: 'bg-rose-500', 
    edge: 'border-rose-200 hover:border-rose-300 hover:shadow-xs' 
  },
  gold: { 
    soft: 'bg-amber-50 text-amber-900 border-amber-300/80', 
    text: 'text-amber-700 font-bold', 
    solid: 'bg-amber-500', 
    edge: 'border-amber-300 hover:border-amber-400 hover:shadow-xs' 
  },
};

/** Mapea estado de lead a tono visual de Quisqueya */
export function leadStatusTone(status?: string): Tone {
  if (status === 'new') return 'gold';
  if (status === 'assigned' || status === 'contacted') return 'info';
  if (status === 'converted' || status === 'won') return 'ok';
  if (status === 'discarded' || status === 'lost') return 'danger';
  return 'neutral';
}
