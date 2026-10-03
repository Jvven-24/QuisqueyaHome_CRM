# CRM en la VPS

Para probar el CRM apuntando a la base de staging, en lugar de sufrir latencia y errores `ECONNRESET` usando túneles SSH remotos a la base de datos, levantamos el CRM dentro de la VPS y hacemos un túnel reverso.

## Pasos de Configuración
1. En la VPS de staging, clonamos/copiamos el código en `/opt/quisqueya-crm-staging`.
2. Compilamos el CRM mediante Docker:
   ```dockerfile
   FROM node:22-alpine
   WORKDIR /app
   COPY . .
   RUN npm ci
   RUN npm run build
   CMD ["npm", "start"]
   ```
3. Creamos un `.env` propio sin secretos versionados, apuntando `DATABASE_URL` a la base de la red de Docker (`quisqueya-staging-db`) y la URL de Auth al proxy interno (`quisqueya-crm-staging-auth-proxy-1`).
4. Levantamos el contenedor en la red `quisqueya_staging` publicando el puerto 3000 localmente en `127.0.0.1:3101` para el túnel SSH, de la siguiente forma:
   ```bash
   docker run -d --name quisqueya-crm-staging-app \
     --network quisqueya_staging \
     -p 127.0.0.1:3101:3000 \
     --env-file /opt/quisqueya-crm-staging/.env \
     --restart unless-stopped \
     quisqueya-crm-staging
   ```
5. En la máquina de desarrollo, hacemos el túnel SSH a ese puerto:
   ```bash
   ssh -L 3101:127.0.0.1:3101 hostinger -N
   ```
6. El CRM ahora responde en `http://127.0.0.1:3101` de forma casi instantánea, con toda la latencia acotada dentro de la VPS.
