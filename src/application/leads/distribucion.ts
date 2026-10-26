export type AssignmentLead = {
    id: number;
    brokerId: number | null;
    status: string;
};
export type AssignmentBroker = {
    userId: number;
    fullName: string;
};
export type AssignmentPlan = {
    leadId: number;
    brokerId: number;
    brokerName: string;
};
export function planAssignments(leads: AssignmentLead[], brokers: AssignmentBroker[], selected: number[], mode: "manual" | "round-robin", brokerId?: number): AssignmentPlan[] {
    if (!selected.length)
        throw new Error("Selecciona al menos un lead.");
    if (new Set(selected).size !== selected.length)
        throw new Error("Hay leads repetidos en la selección.");
    const eligible = new Map(leads.filter(l => !["converted", "discarded"].includes(l.status)).map(l => [l.id, l]));
    if (selected.some(id => !eligible.has(id)))
        throw new Error("La selección incluye leads cerrados o fuera de esta página.");
    if (!brokers.length)
        throw new Error("No hay brokers activos disponibles.");
    const manual = brokers.find(b => b.userId === brokerId);
    if (mode === "manual" && !manual)
        throw new Error("Elige un broker activo.");
    return selected.map((leadId, index) => { const broker = mode === "manual" ? manual! : brokers[index % brokers.length]!; return { leadId, brokerId: broker.userId, brokerName: broker.fullName }; });
}
