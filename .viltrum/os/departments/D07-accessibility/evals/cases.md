# D07 — Casos de evaluación

> Casos donde una IA genérica fallaría: revisa con un escáner automático, ve todo en
> verde, y declara "accesible" sin haber tocado un teclado ni un lector de pantalla.
> Estos casos verifican que D07 no cometa ese error.

## Caso 1 — Modal de confirmación con foco perdido

**Escenario:** Un modal de "confirmar eliminación" se abre sobre la pantalla. El escáner
automático no reporta ningún error: el modal tiene los atributos ARIA correctos en el
marcado.

**Qué debe detectar/producir:**
- D07 no se detiene en el resultado del escáner. Navega el modal solo con teclado: verifica
  si el foco se movió realmente dentro del modal al abrirse, si Tab queda contenido dentro
  de él (no se escapa al fondo), si Esc lo cierra y si el foco vuelve exactamente al botón
  que lo abrió
- Si el foco visual queda oculto detrás del propio modal o de un header fijo al reabrir el
  fondo, se cita explícitamente el criterio **2.4.11 Focus Not Obscured (Minimum)**

**Criterio de aprobado:** el hallazgo (si existe) cita el criterio por número, distingue
que el escáner automático no lo detectó, y describe el comportamiento real observado
navegando sin mouse — no una inferencia de leer el HTML.

---

## Caso 2 — Formulario de checkout que repite el mismo dato dos veces

**Escenario:** Un flujo de pago de dos pasos pide el correo electrónico en el paso 1 para
crear la cuenta, y lo vuelve a pedir en el paso 2 "para confirmar el pedido", sin
prellenarlo.

**Qué debe detectar/producir:**
- D07 identifica esto como incumplimiento del criterio nuevo **3.3.7 Redundant Entry**: un
  dato ya provisto en el mismo proceso no debe pedirse de nuevo sin justificación (por
  ejemplo, reingresar la contraseña por seguridad sí se justifica; reingresar el correo no)
- Propone la corrección: prellenar el campo o eliminar la repetición

**Criterio de aprobado:** el hallazgo cita 3.3.7 explícitamente, distingue qué repetición
está justificada (seguridad) de cuál no, y no lo confunde con un simple problema de
usabilidad sin base normativa.

---

## Caso 3 — Botones de "me gusta" de 18×18 px en una lista densa

**Escenario:** Una lista de productos muestra íconos pequeños de acción (favorito,
comparar, compartir) muy juntos entre sí, cada uno de 18×18 px, para maximizar la densidad
visual que pidió el cliente.

**Qué debe detectar/producir:**
- D07 mide el tamaño real de los objetivos táctiles, no los aprueba porque "se ven bien"
- Identifica el incumplimiento de **2.5.8 Target Size (Minimum)**: menores a 24×24 px, sin
  espaciado suficiente entre ellos (una de las cinco excepciones), y sin equivalente de
  mayor tamaño disponible en otro lugar
- No rechaza automáticamente la densidad pedida por el cliente: evalúa si aplica alguna de
  las cinco excepciones documentadas (espaciado, equivalente, en línea, agente de usuario,
  esencial) antes de marcar el hallazgo

**Criterio de aprobado:** el hallazgo mide el tamaño real, evalúa explícitamente si alguna
excepción de 2.5.8 aplica, y solo entonces decide si es hallazgo o excepción válida — no
lo trata como binario sin revisar las excepciones.

---

## Caso 4 — Mensaje de error que "se ve bien" pero el lector de pantalla no lo anuncia

**Escenario:** Un campo de formulario muestra un mensaje de error en rojo debajo del input
cuando la validación falla. El contraste del texto es correcto y el escáner automático no
reporta nada.

**Qué debe detectar/producir:**
- D07 activa un lector de pantalla y provoca el error real, no lo infiere del código
- Verifica si el mensaje se anuncia en el momento en que aparece (región viva o asociación
  correcta con el campo vía `aria-describedby` + error de validación), o si el usuario de
  lector de pantalla nunca se entera de que el campo falló a menos que navegue manualmente
  hasta encontrarlo
- Si no se anuncia, el hallazgo cita 4.1.3 (mensajes de estado) o 3.3.1 según corresponda,
  y aclara explícitamente que el escáner automático no lo detectó

**Criterio de aprobado:** el informe distingue que el hallazgo se originó en verificación
manual con lector de pantalla, no en el escáner, y documenta literalmente qué anunció (o
no anunció) el lector al momento del error — no una suposición de que "debería funcionar
porque el HTML es correcto".
