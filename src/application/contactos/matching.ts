export type Demand = {
    id: string;
    name: string;
    contact: string;
    zone: string;
    currency: string;
    minCents: number;
    maxCents: number;
    bedrooms: number;
    areaMin: number;
    operation: "sale" | "rent";
    priority: "alta" | "normal";
    status: "activa" | "pausada";
};
export type InventoryCandidate = {
    id: string;
    project: string;
    unit: string;
    zone: string;
    currency: string;
    priceCents: number;
    bedrooms: number;
    area: number;
    operation: "sale" | "rent";
    available: boolean;
};
export type MatchResult = {
    candidate: InventoryCandidate;
    score: number;
    eligible: boolean;
    reasons: string[];
    warnings: string[];
};
export const MATCH_WEIGHTS = { budget: 40, zone: 30, bedrooms: 20, area: 10 } as const;
export function matchInventory(demand: Demand, inventory: InventoryCandidate[]): MatchResult[] {
    return inventory.map(candidate => {
        const reasons: string[] = [];
        const warnings: string[] = [];
        let score = 0;
        if (!candidate.available)
            warnings.push("Unidad no disponible; excluida de la propuesta.");
        if (candidate.operation !== demand.operation)
            warnings.push("La operación no coincide.");
        if (candidate.currency !== demand.currency)
            warnings.push("Monedas distintas; no se convierte sin una tasa vigente.");
        const eligible = candidate.available && candidate.operation === demand.operation && candidate.currency === demand.currency;
        if (candidate.currency === demand.currency) {
            if (candidate.priceCents >= demand.minCents && candidate.priceCents <= demand.maxCents) {
                score += MATCH_WEIGHTS.budget;
                reasons.push("Precio dentro del presupuesto (+40).");
            }
            else
                warnings.push("Precio fuera del presupuesto declarado.");
        }
        if (candidate.zone.toLocaleLowerCase() === demand.zone.toLocaleLowerCase()) {
            score += MATCH_WEIGHTS.zone;
            reasons.push("Zona coincidente (+30).");
        }
        else
            warnings.push("Zona diferente de la solicitada.");
        if (candidate.bedrooms >= demand.bedrooms) {
            score += MATCH_WEIGHTS.bedrooms;
            reasons.push("Cumple las habitaciones mínimas (+20).");
        }
        else
            warnings.push("No cumple las habitaciones mínimas.");
        if (candidate.area >= demand.areaMin) {
            score += MATCH_WEIGHTS.area;
            reasons.push("Cumple el área mínima (+10).");
        }
        else
            warnings.push("No cumple el área mínima.");
        return { candidate, score: eligible ? score : 0, eligible, reasons, warnings };
    }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
}
