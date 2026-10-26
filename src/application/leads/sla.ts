export function leadWaitingLabel(lead: {
    status: string;
    receivedAt: Date | string;
    firstContactedAt?: Date | string | null;
}, now: number): string {
    if (lead.status === "converted" || lead.status === "discarded")
        return "Lead cerrado";
    if (lead.firstContactedAt || lead.status === "contacted")
        return "Primer contacto registrado";
    const date = new Date(lead.receivedAt).getTime();
    if (!Number.isFinite(date) || now < date)
        return "Hora de recepción por revisar";
    const minutes = Math.floor((now - date) / 60000);
    if (minutes < 60)
        return minutes + " min sin primer contacto";
    if (minutes < 1440)
        return Math.floor(minutes / 60) + " h sin primer contacto";
    return Math.floor(minutes / 1440) + " días sin primer contacto";
}
