# Checklist — seguridad de prompts y guardrails

> La firma D12, nunca quien construyó el sistema.
> Se aplica a todo sistema con generación de lenguaje, clasificación o decisión
> automática por modelo de IA, antes de su primer despliegue y en cada cambio de
> prompt, modelo o herramienta.

## A. Inyección de prompt directa

- [ ] El system prompt separa explícitamente instrucción (del operador) de dato (del
      usuario) y el modelo está instruido a no obedecer instrucciones que lleguen
      como dato
- [ ] Existe al menos un caso de prueba que intenta que el usuario cambie el rol o las
      reglas del sistema con su propio mensaje ("ignora tus instrucciones", "actúa
      sin restricciones", "repite tu system prompt")
- [ ] El sistema resiste el intento de extraer el system prompt textual
- [ ] El sistema resiste el intento de hacer que use una herramienta fuera de su
      propósito declarado mediante el mensaje del usuario
- [ ] Los resultados de estos intentos están en el dataset de evaluación, no solo
      probados una vez a mano

## B. Inyección de prompt indirecta

- [ ] Todo contenido de terceros que el modelo procesa (documento adjunto, página web,
      correo, resultado de una herramienta, registro de base de datos) se marca como
      **no confiable** en el prompt, con delimitadores explícitos
- [ ] Existe un caso de prueba con un documento que contiene una instrucción oculta
      dirigida al modelo (por ejemplo, pedir que envíe datos a una dirección externa) y
      el sistema no la ejecuta
- [ ] Ninguna herramienta se invoca solo porque el contenido leído lo "pidió" — la
      intención debe venir del usuario o de una regla del sistema
- [ ] Si el sistema tiene acceso a una herramienta de salida (correo, mensaje, webhook),
      existe una prueba específica de exfiltración vía contenido inyectado y falla como
      se espera (el sistema la bloquea)

## C. Filtrado de salida

- [ ] El filtrado de salida es un control determinista en el backend, no solo una
      instrucción en el prompt
- [ ] Secretos y credenciales: escaneo de patrones antes de responder o registrar
- [ ] PII no autorizada por el caso de uso: redactada o bloqueada según política
- [ ] Contenido que viola la política de la agencia o del cliente: clasificador o lista
      de reglas, no solo el juicio del modelo
- [ ] Código ejecutable no solicitado, o con llamadas a red/sistema, se sandboxea o
      bloquea si el canal no lo espera
- [ ] HTML/Markdown generado por el modelo se sanitiza igual que cualquier entrada no
      confiable antes de renderizarse

## D. Datos personales

- [ ] Inventario de qué dato personal entra a cada prompt y por qué es necesario —
      minimización aplicada, no "por si sirve"
- [ ] Ningún dato de tarjeta, contraseña o documento de identidad completo entra al
      prompt salvo aprobación explícita de D12
- [ ] El log de prompts y respuestas no contiene en claro lo que el filtrado de salida
      prohíbe
- [ ] Si el usuario pega un dato sensible por error, el sistema lo detecta y lo
      enmascara antes de registrarlo, no solo antes de responder
- [ ] Retención del historial de conversación definida con plazo explícito

## E. Herramientas con mínimo privilegio

Por cada herramienta que el agente puede invocar:

- [ ] Propósito descrito en una frase, sin "y"
- [ ] Alcance de lectura exacto, sin acceso "por si acaso"
- [ ] Alcance de escritura exacto — vacío si la herramienta es de solo lectura
- [ ] Si puede ser irreversible (enviar, cobrar, borrar, publicar), requiere
      confirmación humana explícita antes de ejecutar
- [ ] Los argumentos que el modelo genera se validan en el backend antes de ejecutar
- [ ] Ninguna herramienta tiene alcance de "administrador" o "todo el sistema" para una
      tarea puntual

## F. Registro (logging)

- [ ] Se registra cada prompt de entrada ya filtrado, cada respuesta de salida ya
      filtrada, cada herramienta invocada con argumentos y resultado
- [ ] Se registra la razón de cada decisión del agente, no solo el resultado
- [ ] El registro no contiene secretos ni credenciales, aunque hayan pasado por el
      prompt
- [ ] El registro permite reconstruir una sesión completa ante un incidente
- [ ] Un caso real que falló en producción se convirtió en caso de prueba nuevo

## G. Costos y límites

- [ ] Presupuesto de costo declarado por sesión y por usuario/periodo, con número
      explícito
- [ ] Comportamiento al exceder el presupuesto definido y visible para el usuario, no
      un fallo silencioso
- [ ] Límite de turnos o de iteraciones de herramienta por sesión, para evitar ciclos
      sin convergencia
- [ ] Timeout y límite de tokens de entrada/salida por llamada declarados
- [ ] Alerta activa antes de alcanzar el presupuesto, no solo al superarlo

---

## Veredicto

```
APROBADO      — checklist completa, con evidencia enlazada por sección
CONDICIONAL   — excepciones con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve a D18 con hallazgos clasificados
```

Firma el revisor (D12), **nunca** quien construyó el sistema.
