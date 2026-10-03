# PXIL v2 — Tool Integration Map

> Cómo cada herramienta del ecosistema se conecta con las demás.
> PXIL no es ninguna de estas herramientas. PXIL es la capa que las une.

---

## Pipeline Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PXIL FULL PIPELINE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. INTAKE & DISCOVERY                                              │
│     ├─ Spec Kit: /speckit-specify (constitution + spec)             │
│     ├─ BMAD patterns: product brief, PRD, elicitation               │
│     └─ PXIL: Confidence Ledger, Evidence Store                     │
│                                                                     │
│  2. DOMAIN MODELING                                                 │
│     ├─ PXIL schemas: REQ → DOM → MOD → ENT → PERM                 │
│     ├─ Spec Kit: /speckit-plan (architecture + tasks)               │
│     └─ BMAD: Architecture methodology                              │
│                                                                     │
│  3. EXPERIENCE CONTRACTS                                            │
│     ├─ BMAD UX: DESIGN.md + EXPERIENCE.md                         │
│     ├─ PXIL schemas: FLOW → SCR → STA → EVT                       │
│     ├─ XState: machine generation from STA/EVT                     │
│     └─ State Completeness Matrix validation                        │
│                                                                     │
│  4. API CONTRACTS                                                   │
│     ├─ OpenAPI spec generation from REQ + ENT                      │
│     ├─ Spectral: governance rules (PXIL policies)                  │
│     ├─ OpenAPI Generator: client/server stubs                      │
│     └─ GATE: API contract passes Spectral rules?                   │
│                                                                     │
│  5. COMPONENT INTELLIGENCE                                          │
│     ├─ 21st: search + retrieve candidates                          │
│     ├─ Storybook: render in isolation                              │
│     ├─ Visual Inspector: family compatibility scoring               │
│     ├─ Composer: Screen Recipe assembly                            │
│     └─ Private Library: approved components registry               │
│                                                                     │
│  6. IMPLEMENTATION                                                  │
│     ├─ Spec Kit: /speckit-implement + /speckit-tasks                │
│     ├─ Onlook: visual editing ↔ code (optional)                    │
│     ├─ XState machines: actual behavior                            │
│     └─ Storybook stories: component evidence                       │
│                                                                     │
│  7. VERIFICATION (PARALLEL)                                         │
│     ├─ Playwright MCP: accessibility tree inspection               │
│     ├─ Playwright: E2E functional tests                            │
│     ├─ axe-core: WCAG accessibility gate                           │
│     ├─ Storybook: visual regression + interaction tests            │
│     ├─ Schemathesis: API fuzz + stateful testing                   │
│     ├─ Pact: consumer-driven contract verification                 │
│     ├─ OWASP ASVS: security requirements mapping                  │
│     └─ OpenTelemetry: observability contract check                 │
│                                                                     │
│  8. QUALITY GATE                                                    │
│     ├─ PXIL Gatekeeper: fuse all findings                          │
│     ├─ Traceability check: REQ → TST coverage                     │
│     ├─ Confidence Ledger: all entries ≥ RESEARCHED?                │
│     └─ Decision: APPROVED / REPAIR (with specific repairs)         │
│                                                                     │
│  9. CONVERGENCE                                                     │
│     ├─ Spec Kit: /speckit-converge                                  │
│     └─ PXIL: update Evidence Store, Confidence Ledger              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tool ↔ Tool Integration Matrix

| From | To | Data Flow |
|------|----|-----------|
| **PXIL REQ schema** | **Spec Kit specify** | Requirements feed specification |
| **PXIL REQ schema** | **OpenAPI** | Requirements → API contracts |
| **PXIL REQ schema** | **OWASP ASVS** | REQ-SEC-* → ASVS requirement mapping |
| **PXIL STA/EVT schemas** | **XState** | Generate `.machine.ts` from contracts |
| **PXIL SCR schema** | **21st search** | Screen Recipe → component search queries |
| **PXIL SCR schema** | **Storybook** | Screen → stories generation |
| **PXIL TST schema** | **Playwright** | Test contracts → E2E test generation |
| **PXIL TST schema** | **axe-core** | A11y test contracts → axe rules |
| **Spec Kit plan** | **PXIL MOD/ENT** | Architecture → domain model schemas |
| **BMAD PRD** | **PXIL REQ** | Product requirements extraction |
| **BMAD DESIGN.md** | **PXIL visual-direction** | Visual identity contract |
| **BMAD EXPERIENCE.md** | **PXIL FLOW/SCR/STA** | Behavior + IA contracts |
| **21st candidates** | **Storybook** | Render candidates in isolation |
| **21st candidates** | **Visual Inspector** | Score visual compatibility |
| **Storybook stories** | **Playwright** | Story → E2E test |
| **Storybook stories** | **axe-core** | Story → a11y scan |
| **Storybook stories** | **Visual regression** | Story → screenshot baseline |
| **OpenAPI spec** | **Spectral** | Spec → governance lint |
| **OpenAPI spec** | **Schemathesis** | Spec → fuzz/property tests |
| **OpenAPI spec** | **OpenAPI Generator** | Spec → client/server code |
| **OpenAPI spec** | **Pact** | Spec → contract verification |
| **Playwright MCP** | **PXIL Gatekeeper** | Accessibility tree findings |
| **axe-core results** | **PXIL Gatekeeper** | WCAG violations/passes |
| **Schemathesis results** | **PXIL Gatekeeper** | API test findings |
| **OWASP ASVS mapping** | **PXIL Gatekeeper** | Security compliance status |
| **OpenTelemetry spec** | **PXIL observability** | Semantic conventions → contracts |

---

## Parallel Agent Architecture

When a critical screen enters verification, PXIL can launch these agents simultaneously:

```
                    Screen/Feature Under Review
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
         │ Visual  │    │  A11y   │    │   UX    │
         │ Critic  │    │ Agent   │    │ Critic  │
         └────┬────┘    └────┬────┘    └────┬────┘
              │               │               │
         ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
         │Security │    │Interact.│    │Responsive│
         │ Agent   │    │ Agent   │    │  Agent   │
         └────┬────┘    └────┬────┘    └────┬────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  PXIL Gatekeeper  │
                    │  (Findings Fusion)│
                    └─────────┬─────────┘
                              │
                     APPROVED / REPAIR
```

---

## Key Differences from PXIL v1

| Aspect | v1 | v2 |
|--------|----|----|
| Process kernel | Custom orchestrator | Spec Kit (extensible) |
| Product methodology | Invented from scratch | BMAD patterns adapted |
| State modeling | Custom STA/EVT schemas only | STA/EVT → XState machines |
| Component search | 21st MCP only | 21st → Storybook → Visual scoring pipeline |
| Visual editing | None | Onlook architecture study |
| Browser QA | Screenshot only | Playwright MCP accessibility tree + screenshots |
| Accessibility | Manual rules | axe-core automated + keyboard testing |
| API contracts | Manual | OpenAPI + Spectral + Schemathesis + Pact |
| Security | OWASP reference only | ASVS requirement ↔ implementation mapping |
| Observability | Custom contracts | OpenTelemetry semantic conventions |
| Distribution | Monolithic plugin | Spec Kit Bundle + Antigravity Plugin |
| Agent execution | Sequential | Parallel subagents with Gatekeeper fusion |
