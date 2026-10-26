import { PreviewDesk } from "../_componentes/preview-desk";
import { portfolioExample } from "../_ejemplo";
export const metadata = { title: portfolioExample.title + " · Quisqueya Home" };
export default function Page() { return <PreviewDesk config={portfolioExample} portfolio/>; }
