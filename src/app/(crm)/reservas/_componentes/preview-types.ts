export type PreviewRow = {
    id: string;
    reference: string;
    person: string;
    project: string;
    currency: "USD" | "DOP";
    cents: string;
    date: string;
    status: string;
    details: Record<string, string>;
    history: {
        date: string;
        event: string;
    }[];
};
export type PreviewField = {
    name: string;
    label: string;
    type?: "text" | "date" | "number" | "select" | "textarea";
    options?: string[];
    required?: boolean;
    hint?: string;
};
export type PreviewAction = {
    label: string;
    fields: PreviewField[];
    missing: string;
};
export type PreviewConfig = {
    title: string;
    subtitle: string;
    missing: string;
    amountLabel: string;
    dateLabel: string;
    rows: PreviewRow[];
    actions: PreviewAction[];
    notes: string[];
    chart?: {
        name: string;
        value: number;
    }[];
    detailTitle?: string;
};
