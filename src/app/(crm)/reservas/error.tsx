"use client";
import { Button, Empty, s } from "./_componentes/kit";
export default function ErrorReservas({ reset }: {
    reset: () => void;
}) { return <div className={s.desk}><Empty title="No se pudo cargar Finanzas"><p>Comprueba la conexión y vuelve a intentarlo. No se ha confirmado ninguna operación.</p><Button onClick={reset}>Reintentar</Button></Empty></div>; }
