import { PreviewDesk } from "../_componentes/preview-desk";
import { fiscalExample } from "../_ejemplo";
export const metadata = { title: fiscalExample.title + " · Quisqueya Home" };
export default function Page() { return <PreviewDesk config={fiscalExample}/>; }
