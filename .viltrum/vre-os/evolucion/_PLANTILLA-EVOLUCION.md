# Expediente de evolución · <Módulo>

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Un expediente por módulo, mismo formato.
> Reglas: **misma tecnología primero** (TypeScript, React 19, Next.js 15, Tailwind v4, shadcn/ui, Drizzle, PostgreSQL).
> Copiar o portar código solo de licencias **MIT, Apache-2.0, BSD o ISC** (LICENSE leído, commit fijado, cabecera de procedencia).
> AGPL/GPL: solo como servicio aparte detrás de un puerto (RUN) o como referencia de ideas. Sin licencia: solo ideas.
> Nada se incrusta: todo se ve en nuestra interfaz y se comunica por puertos de `src/application/**` y eventos del outbox.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia (archivo:línea o captura) |
|---|---|---|
| Funciones | | |
| Datos reales y reglas de negocio | | |
| Diseño y componentes | | |
| Experiencia de uso (flujos, atajos, móvil) | | |
| Calidad (pruebas, seis estados, accesibilidad) | | |

Escala: 0 ausente · 1 maqueta · 2 básico (CRUD) · 3 completo · 4 avanzado (automatiza, anticipa, analiza) · 5 referente del mercado.

## 2. Puntos críticos (arreglar antes de evolucionar)
Numerados, con archivo:línea y efecto concreto para el usuario.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad (ESENCIAL/IMPORTANTE/DESEABLE) | Catálogo (A.x) | Hoy |
|---|---|---|---|---|

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta que aporta (carpeta/archivo/paquete) | Modo (PORT/APP/RUN/REF) | Encaje con nuestro stack | Esfuerzo |
|---|---|---|---|---|---|---|---|

Por cada proyecto: qué adaptamos, qué no, y riesgo (mantenimiento, licencia, seguridad).

## 5. Diseño y componentes a elevar
Patrón → componente concreto (shadcn, librería npm con licencia, bloque de 21st/Origin UI/Tremor) → dónde se usa.

## 6. Comunicación con el resto (centralización)
Eventos que emite y consume (outbox), puertos que usa, datos que comparte con otros módulos.

## 7. Lotes asignables
| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo (Haiku/Sonnet) | Revisor | Depende de |
|---|---|---|---|---|---|---|

Cada lote ≤ 45 min, con prueba. Lo que requiere ficha nueva o cambio de esquema lo dice explícitamente.

## 8. No verificado
