export const IMPORT_EXAMPLE = 'Nombre,Teléfono,Correo,Proyecto,Zona\r\nMarina Ejemplo,+18095550101,marina@example.com,Costa Clara,Punta Cana\r\nLuis Ejemplo,+18095550102,luis@example.com,Residencial Palma,Santo Domingo\r\nSin correo válido,+18095550103,no-es-correo,Costa Clara,Punta Cana\r\nMarina Duplicada,+18095550101,marina@example.com,Costa Clara,Punta Cana';
export type DuplicateExample = {
    id: string;
    name: string;
    phone: string;
    email: string;
    source: string;
    owner: string;
    created: string;
    leads: number;
    deals: number;
    consent: string;
};
export const DUPLICATES: DuplicateExample[] = [{ id: "EJ-101", name: "Marina Ejemplo", phone: "+18095550101", email: "marina@example.com", source: "Portal", owner: "Asesor de ejemplo A", created: "2026-10-01", leads: 2, deals: 1, consent: "No acreditado" }, { id: "EJ-102", name: "Marina E. Ejemplo", phone: "+18095550101", email: "marina@example.com", source: "Referido", owner: "Asesor de ejemplo B", created: "2026-10-08", leads: 1, deals: 0, consent: "No acreditado" }];

export const SLA_EXAMPLE = {policy:{warningMinutes:15,dueMinutes:60},leads:[{id:"SLA-EJ-1",name:"Marina Ejemplo",minutes:8,owner:"Sin asignar"},{id:"SLA-EJ-2",name:"Luis Ejemplo",minutes:28,owner:"Asesor A"},{id:"SLA-EJ-3",name:"Ana Ejemplo",minutes:95,owner:"Asesor B"}]} as const;
