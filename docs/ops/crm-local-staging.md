# CRM en entorno local sin Docker

Para iniciar sesión en el CRM en local sin levantar el stack de Supabase (evitando que el login se quede colgado en "Entrando..."), utilizamos el **modo de evaluación local** que ya está previsto en el repositorio.

Este modo funciona usando los botones de "Acceso Rápido de Evaluación" en `/login` cuando la aplicación corre en modo desarrollo, lo que deposita la cookie `qh_dev_role`.

## Problema anterior
El archivo `.env` apuntaba `NEXT_PUBLIC_SUPABASE_URL` a `http://127.0.0.1:54321`. Como el servidor de Supabase no existía, el cliente HTTP del lado del servidor se quedaba bloqueado esperando respuesta, lo que provocaba que la aplicación se colgara en el login y nunca pudiera resolver la función `supabase.auth.getUser()` del middleware.

## Procedimiento para operar en local

1. **Asegurar la conexión a base de datos:** El túnel SSH a la base de datos de staging ya debe estar activo en el puerto `55432`:
   `DATABASE_URL=postgresql://postgres:CLAVE@127.0.0.1:55432/postgres`

2. **Apuntar Supabase URL a un puerto local que devuelva respuesta rápida:**
   En el archivo `.env` cambia el valor de la URL para que apunte al propio servidor de Next.js. De esta forma, las peticiones internas de autenticación recibirán un 404 instantáneo y el SDK de Supabase fallará rápido sin colgar la petición.
   
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3001
   ```
   *(Nota: reemplaza `3001` por `3000` si ejecutas `npm run dev` sin especificar puerto).*

3. **Reiniciar el servidor Next.js:** 
   Next.js no recarga el `.env` automáticamente. Apaga el servidor en la terminal y vuelve a ejecutar:
   ```bash
   npm run dev
   ```

4. **Acceder vía evaluación:**
   Ve a la URL local (ej: `http://localhost:3001/login`). No uses el formulario de usuario y contraseña (eso aún intentará golpear la API de Supabase). En su lugar, usa los botones al final bajo **Acceso Rápido de Evaluación** (Admin, Broker, Asistente). Entrarás inmediatamente.
