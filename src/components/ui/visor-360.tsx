/**
 * @source Inspirado en Pannellum 360° (MIT) & PXIL Private Library
 * @license MIT
 * Visor panorámico interactivo 360° con orientación de brújula, hotspots de inspección,
 * zoom óptico y auto-rotación para supervisión constructiva y tours virtuales.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, Maximize2, Minimize2, Play, Pause, RotateCcw, ZoomIn, ZoomOut, MapPin } from "lucide-react";

export interface Hotspot360 {
  id: string;
  yaw: number; // 0 - 360 grados
  pitch: number; // -45 a 45 grados
  titulo: string;
  detalle: string;
  estado?: "ok" | "observacion" | "completado";
}

export interface Escena360 {
  id: string;
  nombre: string;
  imageUrl: string;
  hotspots?: Hotspot360[];
}

export function Visor360({
  escenas,
  tituloProyecto,
}: {
  escenas: Escena360[];
  tituloProyecto?: string;
}) {
  const [escenaIndex, setEscenaIndex] = useState(0);
  const [yaw, setYaw] = useState(180);
  const [pitch, setPitch] = useState(0);
  const [zoom, setZoom] = useState(1.15);
  const [autoRotar, setAutoRotar] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [hotspotActivo, setHotspotActivo] = useState<Hotspot360 | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const escenaActual = escenas[escenaIndex] ?? escenas[0];

  useEffect(() => {
    if (!autoRotar || arrastrando) return;
    const timer = window.setInterval(() => {
      setYaw((prev) => (prev + 0.4) % 360);
    }, 30);
    return () => window.clearInterval(timer);
  }, [autoRotar, arrastrando]);

  if (!escenaActual) return null;

  const direccionCardinal =
    yaw >= 315 || yaw < 45
      ? "Norte"
      : yaw >= 45 && yaw < 135
      ? "Este"
      : yaw >= 135 && yaw < 225
      ? "Sur"
      : "Oeste";

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setPantallaCompleta(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setPantallaCompleta(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-line bg-navy-950 text-white overflow-hidden shadow-sm select-none"
    >
      {/* Barra superior de escenas y brújula */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-navy-950/95 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-400 flex items-center justify-center">
            <Compass
              className="size-4 transition-transform duration-150"
              style={{ transform: `rotate(${yaw}deg)` }}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-gold-400 uppercase tracking-wider">
              Inspección Panorámica 360° {tituloProyecto ? `· ${tituloProyecto}` : ""}
            </div>
            <div className="text-[13px] font-semibold text-white">
              {escenaActual.nombre} · Orientación {Math.round(yaw)}° ({direccionCardinal})
            </div>
          </div>
        </div>

        {escenas.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {escenas.map((esc, idx) => (
              <button
                key={esc.id}
                type="button"
                onClick={() => {
                  setEscenaIndex(idx);
                  setHotspotActivo(null);
                }}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                  idx === escenaIndex
                    ? "bg-gold-600 text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {esc.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lienzo interactivo 360° */}
      <div
        onPointerDown={(e) => {
          setArrastrando(true);
          dragStartRef.current = { x: e.clientX, y: e.clientY, yaw, pitch };
        }}
        onPointerMove={(e) => {
          if (!arrastrando || !dragStartRef.current) return;
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          const nextYaw = (dragStartRef.current.yaw - dx * 0.35 + 360) % 360;
          const nextPitch = Math.max(-25, Math.min(25, dragStartRef.current.pitch + dy * 0.18));
          setYaw(nextYaw);
          setPitch(nextPitch);
        }}
        onPointerUp={() => {
          setArrastrando(false);
          dragStartRef.current = null;
        }}
        onPointerLeave={() => {
          setArrastrando(false);
          dragStartRef.current = null;
        }}
        className={`relative w-full aspect-16/9 overflow-hidden bg-black ${
          arrastrando ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Proyección panorámica desplazable */}
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{
            backgroundImage: `url("${escenaActual.imageUrl}")`,
            backgroundRepeat: "repeat-x",
            backgroundSize: `${Math.round(zoom * 185)}% auto`,
            backgroundPosition: `${(yaw / 360) * 100}% ${50 + pitch}%`,
          }}
        />

        {/* Retícula sutil de supervisión técnica */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-navy-950/75 via-transparent to-navy-950/35" />

        {/* Hotspots de inspección */}
        {(escenaActual.hotspots ?? []).map((hs) => {
          const relX = ((hs.yaw - yaw + 540) % 360) - 180;
          if (Math.abs(relX) > 75) return null;
          const leftPercent = 50 + (relX / 75) * 42;
          const topPercent = 50 + (hs.pitch - pitch);

          return (
            <button
              key={hs.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setHotspotActivo(hotspotActivo?.id === hs.id ? null : hs);
              }}
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex items-center gap-1.5 rounded-full bg-navy-950/90 hover:bg-gold-600 text-white border border-gold-400 px-3 py-1.5 text-xs font-bold shadow-lg transition-all"
            >
              <MapPin className="size-3.5 text-gold-400 group-hover:text-white shrink-0" />
              <span>{hs.titulo}</span>
            </button>
          );
        })}

        {/* Tarjeta flotante de Hotspot seleccionado */}
        {hotspotActivo && (
          <div className="absolute bottom-14 left-4 right-4 sm:right-auto sm:max-w-sm z-30 rounded-xl bg-navy-950/95 backdrop-blur-md border border-gold-500/50 p-3.5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                Punto de Inspección Técnica
              </span>
              <button
                type="button"
                onClick={() => setHotspotActivo(null)}
                className="text-xs text-white/70 hover:text-white"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="text-sm font-bold text-white">{hotspotActivo.titulo}</div>
            <p className="text-xs text-white/85 mt-1 leading-relaxed">{hotspotActivo.detalle}</p>
          </div>
        )}

        {/* Controles inferiores de cámara */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-navy-950/85 backdrop-blur-md border border-white/15 p-1">
            <button
              type="button"
              onClick={() => setAutoRotar((v) => !v)}
              className="min-h-[36px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/10 transition-colors"
              title="Auto-rotar 360°"
            >
              {autoRotar ? <Pause className="size-3.5 text-gold-400" /> : <Play className="size-3.5 text-gold-400" />}
              <span>{autoRotar ? "Pausar giro" : "Giro 360°"}</span>
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
              className="size-9 rounded-lg inline-flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Acercar vista"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1.0, Number((z - 0.15).toFixed(2))))}
              className="size-9 rounded-lg inline-flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Alejar vista"
            >
              <ZoomOut className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setYaw(180);
                setPitch(0);
                setZoom(1.15);
              }}
              className="size-9 rounded-lg inline-flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Restablecer orientación"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="min-h-[38px] px-3 rounded-xl bg-navy-950/85 backdrop-blur-md border border-white/15 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/10 transition-colors"
          >
            {pantallaCompleta ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            <span>{pantallaCompleta ? "Salir" : "Pantalla completa"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
