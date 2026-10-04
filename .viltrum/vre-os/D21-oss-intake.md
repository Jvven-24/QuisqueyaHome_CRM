# Expediente Open Source (D21) - Intake
## Entregable para VRE-OS

**Modo:** Analysis
**Perfil:** D21 Research
**Revisor:** D03

### Resumen de Investigación (2026-10-04)

| Pieza | Modo | Licencia | SHA / Versión | Puntaje | Veredicto |
|---|---|---|---|---|---|
| shadcn/ui Charts | PORT | MIT | vLatest | 90 | GO |
| vaul / shadcn Drawer | PORT | MIT | v1.1.1+ | 92 | GO |
| @faker-js/faker | APP | MIT | vLatest | 88 | GO |
| Serwist | APP | MIT | vLatest | 85 | GO |
| MapLibre GL JS | RUN | BSD-3-Clause | vLatest | 95 | GO |
| prolinkinfo/RealEstateCRM | REFERENCE | UNKNOWN (No LICENSE) | a770042cdab0ff2266f6db2b4bba9984817a3f99 | 60 | GO_AS_REFERENCE |
| mallyav/CRM | REFERENCE | UNKNOWN (No LICENSE) | 78710dfe73d20a6d3fa533ef0ddfa525d473db47 | 50 | REJECT OR SEARCH AGAIN |
| clawnify/OpenProperty | PORT | MIT | a493028ad12ba969990ee916fbc8cd2a98807a2d | 85 | GO |
| Twenty CRM | APP / API | AGPLv3 (Exception) | vLatest | 88 | GO |
| Documenso | RUN | AGPLv3 | vLatest | 85 | GO |
| Zen Engine (GoRules) | RUN | MIT | vLatest | 85 | GO |
| React Chrono | PORT | MIT | vLatest | 80 | PROTOTYPE REQUIRED |
| @react-pdf/renderer | APP | MIT | vLatest | 82 | PROTOTYPE REQUIRED |

---

### Detalles por Pieza (Formato Blueprint §24)

```yaml
shadcn_charts:
  identity:
    repository: shadcn-ui/ui (Charts)
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Alta
    issue_health: Buena
    contributors: Varios
  license:
    detected_license: MIT
    compatible: true
    evidence: https://ui.shadcn.com/
    human_review_required: false
  architecture:
    languages: [TypeScript, TSX]
    framework: React 19 / Next 15 (usa Recharts v3)
    database: N/A
    auth: N/A
    api: N/A
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: PORT
    target_modules: [M17]
    expected_gain: Aceleración de UI analítica
    divergence_risk: Medio (dependencia con Recharts)
  decision:
    score: 90
    status: APPROVED
    rationale: Compatible con React 19. Puede requerir --legacy-peer-deps por react-is en npm.
```

```yaml
vaul_drawer:
  identity:
    repository: emilkowalski/vaul
    commit_sha: UNKNOWN
    release_tag: v1.1.1
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Media
    issue_health: Buena
    contributors: Varios
  license:
    detected_license: MIT
    compatible: true
    evidence: https://github.com/emilkowalski/vaul
    human_review_required: false
  architecture:
    languages: [TypeScript, TSX]
    framework: React 19 / Next 15
    database: N/A
    auth: N/A
    api: N/A
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: PORT
    target_modules: [M00]
    expected_gain: Componente UI accesible
    divergence_risk: Bajo
  decision:
    score: 92
    status: APPROVED
    rationale: Vaul v1.1.1+ y el nuevo Drawer basado en Base UI son totalmente compatibles con React 19.
```

```yaml
faker_js:
  identity:
    repository: faker-js/faker
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Alta
    issue_health: Excelente
    contributors: Varios
  license:
    detected_license: MIT
    compatible: true
    evidence: https://fakerjs.dev/
    human_review_required: false
  architecture:
    languages: [TypeScript]
    framework: Node.js / React
    database: N/A
    auth: N/A
    api: N/A
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: APP
    target_modules: [Testing]
    expected_gain: Generación de datos de prueba en español
    divergence_risk: Bajo
  decision:
    score: 88
    status: APPROVED
    rationale: Soporta locales es y es_MX importables individualmente para optimizar bundle.
```

```yaml
serwist:
  identity:
    repository: serwist/serwist
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Alta
    issue_health: Buena
    contributors: Varios
  license:
    detected_license: MIT
    compatible: true
    evidence: https://serwist.build/
    human_review_required: false
  architecture:
    languages: [TypeScript]
    framework: Next 15 App Router
    database: N/A
    auth: N/A
    api: N/A
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: APP
    target_modules: [M00]
    expected_gain: Funcionalidad PWA robusta
    divergence_risk: Medio
  decision:
    score: 85
    status: APPROVED
    rationale: Excelente compatibilidad con Next.js 15 y App Router, configurado mediante withSerwist.
```

```yaml
maplibre:
  identity:
    repository: maplibre/maplibre-gl-js
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Alta
    issue_health: Excelente
    contributors: Comunidad MapLibre
  license:
    detected_license: BSD-3-Clause
    compatible: true
    evidence: https://maplibre.org/
    human_review_required: false
  architecture:
    languages: [TypeScript, WebGL]
    framework: react-map-gl
    database: N/A
    auth: N/A
    api: N/A
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: RUN
    target_modules: [M04]
    expected_gain: Mapas interactivos sin vendor lock-in
    divergence_risk: Bajo
  decision:
    score: 95
    status: APPROVED
    rationale: Se integrará vía react-map-gl con tiles gratuitos (como OpenFreeMap o Maptoolkit) que no requieren key y aplican a RD.
```

```yaml
prolinkinfo_crm:
  identity:
    repository: prolinkinfo/RealEstateCRM
    commit_sha: a770042cdab0ff2266f6db2b4bba9984817a3f99
    release_tag: UNKNOWN
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: UNKNOWN
    release_frequency: Baja
    issue_health: Regular
    contributors: Varios
  license:
    detected_license: UNKNOWN (No archivo LICENSE real)
    compatible: false
    evidence: Verificación en repositorio clonado
    human_review_required: true
  architecture:
    languages: [JavaScript, TypeScript]
    framework: MERN
    database: MongoDB
    auth: JWT
    api: REST
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: UNKNOWN
  reuse:
    mode: REFERENCE
    target_modules: [quotes, invoices, property floors, unit types, documents, custom fields]
    expected_gain: Patrones de negocio
    divergence_risk: Alto
  decision:
    score: 60
    status: CANDIDATE
    rationale: Al carecer de archivo LICENSE oficial, code_reuse BLOCKED. Solo debe usarse como referencia.
```

```yaml
mallyav_crm:
  identity:
    repository: mallyav/CRM
    commit_sha: 78710dfe73d20a6d3fa533ef0ddfa525d473db47
    release_tag: UNKNOWN
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: UNKNOWN
    release_frequency: Baja
    issue_health: Regular
    contributors: Varios
  license:
    detected_license: UNKNOWN (No archivo LICENSE real)
    compatible: false
    evidence: Verificación en repositorio clonado
    human_review_required: true
  architecture:
    languages: [TypeScript, JavaScript]
    framework: React, Node
    database: PostgreSQL
    auth: JWT
    api: REST
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: UNKNOWN
  reuse:
    mode: REFERENCE
    target_modules: [M01, M05]
    expected_gain: Conocimiento de arquitectura de un CRM de real estate
    divergence_risk: Alto
  decision:
    score: 50
    status: REJECTED
    rationale: Sin licencia, code_reuse BLOCKED. Solo referencia.
```

```yaml
openproperty:
  identity:
    repository: clawnify/OpenProperty
    commit_sha: a493028ad12ba969990ee916fbc8cd2a98807a2d
    release_tag: UNKNOWN
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: UNKNOWN
    release_frequency: Media
    issue_health: Buena
    contributors: Clawnify
  license:
    detected_license: MIT
    compatible: true
    evidence: Verificación en repositorio clonado (LICENSE file)
    human_review_required: false
  architecture:
    languages: [TypeScript, TSX]
    framework: React, Next.js, Tailwind, shadcn
    database: PostgreSQL
    auth: N/A
    api: REST
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: UNKNOWN
  reuse:
    mode: PORT
    target_modules: [M15 (Rentals)]
    expected_gain: Aceleración de UI en área de Rentas
    divergence_risk: Bajo
  decision:
    score: 85
    status: APPROVED
    rationale: Licencia MIT en archivo LICENSE. Ideal como donor de patrones para el flujo de rentals.
```

```yaml
twenty_crm:
  identity:
    repository: twentyhq/twenty
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Alta
    issue_health: Buena
    contributors: TwentyHQ
  license:
    detected_license: AGPLv3 + Twenty Application Exception
    compatible: true
    evidence: https://github.com/twentyhq/twenty/blob/main/LICENSE
    human_review_required: true
  architecture:
    languages: [TypeScript]
    framework: NestJS, React, Nx
    database: PostgreSQL
    auth: N/A
    api: REST, GraphQL
    events: Webhooks
  security:
    security_policy: Sí
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: APP
    target_modules: [M01]
    expected_gain: Motor de CRM principal
    divergence_risk: Bajo
  decision:
    score: 88
    status: APPROVED
    rationale: La "Twenty Application Exception" permite interactuar mediante API y Webhooks sin heredar AGPLv3.
```

```yaml
documenso:
  identity:
    repository: documenso/documenso
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Alta
    issue_health: Buena
    contributors: DocumensoHQ
  license:
    detected_license: AGPLv3
    compatible: true
    evidence: https://github.com/documenso/documenso
    human_review_required: true
  architecture:
    languages: [TypeScript]
    framework: Next.js
    database: PostgreSQL
    auth: N/A
    api: REST
    events: Webhooks
  security:
    security_policy: Sí
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: RUN
    target_modules: [M14]
    expected_gain: E-signature engine completo
    divergence_risk: Bajo
  decision:
    score: 85
    status: APPROVED
    rationale: Permite self-hosting de firmas. Requiere proveer certificado de firma propio. API Envelope disponible.
```

```yaml
zen_engine:
  identity:
    repository: gorules/zen
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Media
    issue_health: Buena
    contributors: gorules
  license:
    detected_license: MIT
    compatible: true
    evidence: https://github.com/gorules/zen
    human_review_required: false
  architecture:
    languages: [Rust, Node bindings]
    framework: GoRules
    database: N/A
    auth: N/A
    api: NodeJS bindings
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: RUN
    target_modules: [M07, M08, M09]
    expected_gain: Externalización lógica de reglas
    divergence_risk: Bajo
  decision:
    score: 85
    status: APPROVED
    rationale: Alternativa MIT robusta a un motor de reglas (Rules Engine).
```

```yaml
react_chrono:
  identity:
    repository: prabhuignoto/react-chrono
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Media
    issue_health: Buena
    contributors: prabhuignoto
  license:
    detected_license: MIT
    compatible: true
    evidence: https://github.com/prabhuignoto/react-chrono
    human_review_required: false
  architecture:
    languages: [TypeScript, TSX]
    framework: React
    database: N/A
    auth: N/A
    api: N/A
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: PORT
    target_modules: [M11]
    expected_gain: Aceleración de UI en Timeline
    divergence_risk: Medio
  decision:
    score: 80
    status: PROTOTYPE
    rationale: Alternativa MIT para Timeline de actividades.
```

```yaml
react_pdf_renderer:
  identity:
    repository: diegomura/react-pdf
    commit_sha: UNKNOWN
    release_tag: vLatest
    evaluated_at: 2026-10-04
  maintenance:
    latest_activity: 2026
    release_frequency: Alta
    issue_health: Regular
    contributors: Varios
  license:
    detected_license: MIT
    compatible: true
    evidence: https://react-pdf.org/
    human_review_required: false
  architecture:
    languages: [TypeScript, TSX]
    framework: React
    database: N/A
    auth: N/A
    api: N/A
    events: N/A
  security:
    security_policy: UNKNOWN
    sbom_available: false
    dependency_scan: false
    secret_scan: false
    known_critical_vulns: false
  reuse:
    mode: APP
    target_modules: [M14]
    expected_gain: Generación de PDFs
    divergence_risk: Medio
  decision:
    score: 82
    status: PROTOTYPE
    rationale: Útil para cotización a PDF. Cuidado con rendering complejo.
```

### Fuentes

- **shadcn/ui y Vaul:** ui.shadcn.com/docs/components, compatible con React 19.
- **faker-js:** fakerjs.dev, soporte de `es` y `es_MX`.
- **Serwist:** serwist.build, Next 15 App Router configurado con `withSerwist`.
- **MapLibre GL JS:** openfreemap.org y maptoolkit.org para teselas sin key (RD).
- **prolinkinfo/RealEstateCRM:** Git clone (sha: a770042cdab0ff2266f6db2b4bba9984817a3f99). Sin `LICENSE`.
- **mallyav/CRM:** Git clone (sha: 78710dfe73d20a6d3fa533ef0ddfa525d473db47). Sin `LICENSE`.
- **clawnify/OpenProperty:** Git clone (sha: a493028ad12ba969990ee916fbc8cd2a98807a2d). `LICENSE` oficial MIT.
- **Twenty CRM:** Documentación "Twenty Application Exception" (github/twentyhq/twenty/blob/main/LICENSE).
- **Documenso:** github.com/documenso/documenso (requiere certificado propio y protege red). API Envelope expuesta.
- **Huecos/Brechas:** gorules/zen (rules engine), prabhuignoto/react-chrono (timeline), diegomura/react-pdf (PDF).

---

## Handoff
**Revisor:** D03 (Arquitectura).
El expediente técnico D21 está listo. Recomiendo que el código de `prolinkinfo/RealEstateCRM` y `mallyav/CRM` no se integre de manera directa debido a la falta de archivos de licencia oficiales detectados durante la revisión. Deben mantenerse estrictamente en modo de referencia visual y conceptual. Los requerimientos de firmas de Documenso (certificado propio self-hosted) y Twenty (Application Exception para APIs) quedan documentados. Esperando sus observaciones.
