# PXIL v2 Ecosystem — Local Installation Manifest

> **Philosophy:** PXIL no implementa capacidades maduras que ya existen.
> PXIL las orquesta, normaliza sus resultados, añade trazabilidad entre ellas y cubre los huecos.

---

## Architecture Overview

```
                         PXIL v2
                          │
               PRODUCT INTELLIGENCE
                          │
            ┌─────────────┴─────────────┐
            │                           │
       Spec Kit                    BMAD concepts
       process kernel              product / UX
            │                           │
            └─────────────┬─────────────┘
                          │
                    PXIL CONTRACTS
                          │
         REQ → DOM → MOD → ENT → PERM
          ↓      ↓     ↓      ↓
         FLOW → SCR → STA → EVT
                          │
                 EXPERIENCE ENGINE
                          │
                      XState
                          │
                   VISUAL ENGINE
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
      21st             Storybook          Onlook
   components          isolation       visual/code map
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                       Builder
                          │
                    REAL APPLICATION
                          │
                   VERIFICATION
                          │
        ┌─────────┬───────┼────────┬─────────┐
        │         │       │        │         │
   Playwright    axe   visual   API tests  Security
        │         │       │        │         │
        └─────────┴───────┼────────┴─────────┘
                          │
                  Quality Gate
                          │
                  APPROVED / REPAIR
```

---

## Installed Components

### 🧠 Kernel (`kernel/`)

| Project | Path | License | Purpose |
|---------|------|---------|---------|
| **GitHub Spec Kit** | `kernel/spec-kit/` | MIT | Process kernel — SDD, extensions, bundles, workflows, integrations (incl. Antigravity) |
| **BMAD Method v6** | `kernel/bmad-method/` | MIT | Product discovery, PRD, architecture, UX methodology, DESIGN.md/EXPERIENCE.md |

### 🎭 Experience Engine (`experience-engine/`)

| Project | Path | License | Purpose |
|---------|------|---------|---------|
| **XState** | `experience-engine/xstate/` | MIT | State machines, statecharts, actors — formalizes STA/EVT contracts |

### 🎨 Visual Engine (`visual-engine/`)

| Project | Path | License | Purpose |
|---------|------|---------|---------|
| **Onlook** | `visual-engine/onlook/` | Apache 2.0 | Visual editor: DOM ↔ Code mapping, AST-based code generation |
| **Storybook** | `visual-engine/storybook/` | MIT | Component lab: stories, interaction/visual/a11y testing |

### ✅ Verification (`verification/`)

| Project | Path | License | Purpose |
|---------|------|---------|---------|
| **Playwright** | `verification/playwright/` | Apache 2.0 | Browser automation, E2E testing |
| **Playwright MCP** | `verification/playwright-mcp/` | Apache 2.0 | LLM-controlled browser via accessibility snapshots |
| **axe-core** | `verification/axe-core/` | MPL 2.0 | Accessibility testing engine (WCAG 2.0/2.1/2.2) |

### 📡 API Contracts (`api-contracts/`)

| Project | Path | License | Purpose |
|---------|------|---------|---------|
| **Spectral** | `api-contracts/spectral/` | Apache 2.0 | API linting/governance over OpenAPI |
| **Schemathesis** | `api-contracts/schemathesis/` | MIT | Property-based API testing from OpenAPI/GraphQL |
| **Pact JS** | `api-contracts/pact-js/` | MIT | Consumer-driven contract testing |
| **OpenAPI Generator** | `api-contracts/openapi-generator/` | Apache 2.0 | Code generation from OpenAPI specs |

### 🔒 Security (`security/`)

| Project | Path | License | Purpose |
|---------|------|---------|---------|
| **OWASP ASVS** | `security/ASVS/` | CC BY-SA 4.0 | Application Security Verification Standard |

### 📊 Observability (`observability/`)

| Project | Path | License | Purpose |
|---------|------|---------|---------|
| **OpenTelemetry JS** | `observability/opentelemetry-js/` | Apache 2.0 | Traces, metrics, logs SDK |
| **OpenTelemetry Specification** | `observability/opentelemetry-specification/` | Apache 2.0 | Semantic conventions and data model |

### 🎨 Optional (`optional/`)

| Project | Path | License | Purpose |
|---------|------|---------|---------|
| **Penpot** | `optional/penpot/` | MPL 2.0 | Open source design platform |

---

## What PXIL Builds on Top (Our Unique Value)

### 1. PXIL Knowledge Graph
```
Requirement
 ├ Capability
 ├ Module
 ├ Persona
 ├ Permission
 ├ Entity
 ├ Business Rule
 ├ Flow
 ├ Screen
 │   ├ State
 │   ├ Component
 │   └ Responsive Contract
 ├ Event
 │   ├ API
 │   ├ State Transition
 │   ├ Feedback
 │   └ Telemetry
 └ Tests
     ├ functional
     ├ accessibility
     ├ visual
     ├ security
     └ contract
```

### 2. Experience Contracts
- DESIGN.md + EXPERIENCE.md separation (inspired by BMAD)
- Screen → State → Event → Feedback → Telemetry chain
- XState machine generation from STA/EVT schemas

### 3. Visual Intelligence Scoring
- 21st component search → sandbox → Storybook render → visual scoring
- Family compatibility checking via Visual Inspector
- Responsive contract verification

### 4. Cross-Tool Orchestrator
- Spec Kit as process kernel with PXIL extensions
- Parallel agent execution (Visual Critic, A11y Agent, UX Critic, Security Agent, etc.)
- PXIL Gatekeeper fusion of findings

### 5. Quality Gate Engine
- Traceability: REQ → implementation → test → evidence
- Confidence Ledger: CONFIRMED / INFERRED / RESEARCHED / ASSUMED / OPEN
- Multi-dimensional gates: functional, visual, a11y, security, API contract, observability

---

## Existing PXIL v1 Assets (to be migrated)

Located in `../pxil/`:
- 13 JSON schemas (REQ, MOD, ENT, PERM, FLOW, SCR, STA, EVT, TST, domain-pack, evidence-store, confidence-ledger, private-library)
- 14 agent definitions
- 13 skills
- 3 utility scripts
- MCP configuration (Playwright, Storybook, Figma)

---

## Runtime Stack

| Layer | Tool |
|-------|------|
| **Agent Runtime** | Antigravity (skills, subagents, rules, MCP, hooks) |
| **Process Kernel** | GitHub Spec Kit (extensions, presets, workflows, bundles) |
| **Product Intelligence** | BMAD Method concepts (adapted as PXIL extensions) |
| **UI Discovery** | 21st.dev (search, generate, explore, build, review) |
| **Component Lab** | Storybook (stories, interaction tests, visual regression) |
| **State Modeling** | XState (machines, statecharts, actors) |
| **Visual Runtime** | Onlook (DOM ↔ code mapping, visual editing) |
| **Browser QA** | Playwright + Playwright MCP |
| **Accessibility** | axe-core |
| **API Governance** | OpenAPI + Spectral |
| **API Testing** | Schemathesis |
| **Service Contracts** | Pact |
| **Security** | OWASP ASVS 5 |
| **Observability** | OpenTelemetry |
| **Design (optional)** | Penpot MCP |

---

## Next Steps

1. Install Spec Kit CLI: `uv tool install specify-cli`
2. Initialize PXIL as Spec Kit project: `specify init pxil-v2 --integration agy`
3. Create PXIL Extension (`pxil-core`) with PXIL-specific schemas, commands, hooks
4. Create PXIL Bundle packaging the extension + workflows
5. Migrate PXIL v1 schemas to Spec Kit extension format
6. Adapt BMAD UX patterns as PXIL Spec Kit presets
7. Wire XState machine generation from STA/EVT contracts
8. Configure Storybook as component evidence pipeline
9. Build PXIL Quality Gate engine (multi-tool verification)
10. Register in Antigravity as plugin with skills + subagents
