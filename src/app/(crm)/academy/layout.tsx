import { ModuleTabs } from "@/components/modulo";
export default function AcademyLayout({children}:{children:React.ReactNode}){return <div className="min-w-0 max-w-full pb-28 md:pb-0"><ModuleTabs label="Secciones Academy" items={[{href:"/academy",label:"Biblioteca y constancias"},{href:"/academy/administracion",label:"Autoría, matrículas y revisión",match:"prefix"}]}/>{children}</div>;}
