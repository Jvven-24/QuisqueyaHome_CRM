export function validarRevisionDocumento(datos:{asunto:string;motivo:string;confirma:boolean}){const errors:Record<string,string>={};if(!datos.asunto.trim())errors.asunto="Escribe el asunto de la revisión.";if(!datos.motivo.trim())errors.motivo="Describe qué evidencia y revisión faltan.";if(!datos.confirma)errors.confirma="Confirma que revisas un ejemplo sin ejecutar cambios.";return errors;}
export function metadatosArchivoDeEjemplo(file:{name:string;size:number;type:string}):{ok:boolean;mensaje:string}{
 if(!file.size)return {ok:false,mensaje:"El archivo está vacío."};
 if(file.size>10*1024*1024)return {ok:false,mensaje:"Usa un archivo de demostración de hasta 10 MB."};
 if(!["application/pdf","image/jpeg","image/png"].includes(file.type))return {ok:false,mensaje:"Selecciona un PDF, JPEG o PNG de demostración."};
 return {ok:true,mensaje:"Archivo seleccionado localmente: "+file.name+". No se leyó, escaneó ni subió su contenido."};
}
