export function validarBorradorRed(datos: { asunto: string; motivo: string; confirma: boolean }): Record<string,string> {
 const errores:Record<string,string>={};
 if(!datos.asunto.trim())errores.asunto="Escribe un asunto para el borrador.";
 if(!datos.motivo.trim())errores.motivo="Describe el motivo y la evidencia pendiente.";
 if(!datos.confirma)errores.confirma="Confirma que revisas un ejemplo sin ejecutar cambios.";
 return errores;
}
export function pasoAltaValido(paso:number,valores:readonly string[],documentos:boolean,acuerdo:boolean):boolean {
 return paso===0?valores.slice(0,2).every(v=>v.trim().length>0):paso===1?documentos:acuerdo;
}
