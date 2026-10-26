"use client";
export default function ErrorView({ reset }: { reset: () => void }) { return <section role="alert" className="grid gap-3 p-4"><h1>No se pudieron cargar las automatizaciones</h1><p>No se ejecutó ningún flujo. Puedes reintentar.</p><button className="min-h-12 rounded-lg border border-line px-3" type="button" onClick={reset}>Reintentar carga</button></section>; }
