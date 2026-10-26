import { PreviewDesk } from "../_componentes/preview-desk";
import { reconciliationExample } from "../_ejemplo";
export const metadata = { title: reconciliationExample.title + " · Quisqueya Home" };
export default function Page() { return <PreviewDesk config={reconciliationExample}/>; }
