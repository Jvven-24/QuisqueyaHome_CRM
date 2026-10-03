# Runbook de release — <proyecto>

```
Release:            v<X.Y.Z>
Tag / commit:        <sha completo>
Fecha planificada:   <YYYY-MM-DD HH:MM zona>
Ambiente destino:    produccion
Ventana de trafico:  <baja demanda declarada, o "sin restriccion">
Ejecuta:             <departamento/persona>
Aprueba (A4):        <nombre humano> — <fecha> — <alcance aprobado>
```

## 1. Pre-condiciones (verificar antes de empezar)

- [ ] Gate G5 aprobado, cero P0 abiertos
- [ ] Migraciones probadas sobre copia de producción (D11)
- [ ] Rollback ensayado en staging, tiempo medido: `___ min`
- [ ] Respaldo reciente con restauración ensayada, fecha del último ensayo: `___`
- [ ] Observabilidad activa (dashboards y alertas de D17 confirmados)
- [ ] Runbook de reversión de este release adjunto y leído
- [ ] Aprobación humana registrada arriba

## 2. Cambios incluidos

| Tipo | Descripción | Reversible por sí solo |
|---|---|---|
| Código | | sí/no |
| Esquema (expand/contract, fase) | | sí/no |
| Configuración/variable de entorno | | sí/no |
| Dependencia externa | | sí/no |

## 3. Pasos de ejecución

1. Confirmar tag en `main`: `git tag --points-at <sha>`
2. Ejecutar pipeline de CI/CD hasta la etapa de despliegue a producción
3. Aplicar migración (si corresponde), fase declarada: `expand` / `migrate` / `contract`
4. Desplegar imagen nueva con estrategia `rolling` / `blue-green`
5. Verificar health check de cada servicio antes de enrutar tráfico
6. Enrutar tráfico progresivamente (si blue-green) o esperar rolling completo
7. Verificar métrica de negocio clave post-release: `_______________`
8. Confirmar en el canal del equipo: release publicado, tag, hora de fin

## 4. Verificación post-release (primeros 30 minutos)

- [ ] Health checks en verde
- [ ] Tasa de error igual o menor al presupuesto declarado
- [ ] Latencia dentro del presupuesto declarado
- [ ] Sin alertas nuevas disparadas
- [ ] Métrica de negocio clave sin caída

## 5. Si algo sale mal

Ir directo a `runbook-rollback.md` de este release. No improvisar un rollback distinto
al ensayado.

## 6. Cierre

- [ ] Resultado documentado en `.viltrum/departments/D16-devops.md`
- [ ] Handoff a D17 confirmado: qué monitorear las próximas 48 horas
- [ ] Lecciones nuevas, si las hay, escritas en `MEMORY.md`
