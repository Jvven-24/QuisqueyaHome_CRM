# PXIL v2 — Complete AI Context Document
# ============================================
# This file contains everything an AI agent needs to understand the PXIL
# methodology, evaluate it, improve it, and build applications using it.
#
# Author: Viltrum
# Date: 2026-09-30
# Version: 2.0.0

---

# TABLE OF CONTENTS
# 1. What is PXIL?
# 2. The Core Problem PXIL Solves
# 3. The 10 Non-Negotiable Principles
# 4. The PXIL Knowledge Graph
# 5. Architecture: How PXIL Works
# 6. The 11 Functions of PXIL
# 7. The 9 Quality Gates (G0-G8)
# 8. PXIL v2 Ecosystem (All Tools)
# 9. How Tools Connect (Integration Map)
# 10. Schemas and Contracts
# 11. Agent Architecture
# 12. Component Intelligence Pipeline
# 13. Financial System Example (from PDF)
# 14. Definition of Done Checklists
# 15. How to Build an App Using PXIL
# 16. Repository Locations
# 17. Original PDF Reference

---

## 1. WHAT IS PXIL?

**PXIL = Product & Experience Intelligence Layer**

PXIL is NOT a UI library. It is NOT a design system. It is NOT a component framework.

PXIL is a **metacapa de coordinación** — an orchestration layer that:
- Converts product ideas into complete, traceable software specifications
- Coordinates multiple specialized AI agents and tools
- Ensures quality through multi-dimensional verification gates
- Produces applications that are correct, accessible, secure, and well-designed

**The key insight:** PXIL doesn't implement capabilities that mature tools already provide.
Instead, PXIL **orchestrates, normalizes, traces, and fills the gaps**.

### PXIL v2 Formula:
```
PXIL = Spec Kit (kernel) + BMAD (product intelligence) + XState (state contracts)
     + 21st.dev (component intelligence) + Storybook (component lab)
     + Onlook (visual runtime) + Playwright/axe (verification)
     + OpenAPI/Spectral/Schemathesis/Pact (API contracts)
     + OWASP ASVS (security) + OpenTelemetry (observability)
```

Antigravity is the **agent runtime**, not the intellectual core.

---

## 2. THE CORE PROBLEM PXIL SOLVES

When an AI agent jumps from "build me a CRM" to code, it leaves implicit:
- Product scope and business rules
- User roles and permissions
- Data models and constraints
- Screen states (empty, loading, error, conflict, offline)
- Action feedback and recovery
- Accessibility requirements
- Security requirements
- Traceability between requirements and implementation

The result may look attractive but contains gaps: incomplete permissions, forms without
validation, actions without feedback, tables without empty states, flows without recovery,
missing configurations, and screens disconnected from the business model.

**PXIL fixes this by requiring specification before implementation.**

---

## 3. THE 10 NON-NEGOTIABLE PRINCIPLES

| # | Principle | Rule |
|---|-----------|------|
| P1 | Scope before pixels | Don't choose layout/components before knowing tasks, users, data, and criticality |
| P2 | State completeness | Every screen/component with data must define: initial, loading, success, empty, partial, error, permission-denied states |
| P3 | Action accountability | Every mutating action defines: permission, confirmation, result, feedback, audit, recovery |
| P4 | Recognition over recall | Interface reduces memory load; makes options/context visible (Nielsen) |
| P5 | Accessible by construction | WCAG 2.2 AA baseline; keyboard/semantic WAI-ARIA patterns |
| P6 | Design system first | Semantic tokens, components, patterns precede per-screen styling |
| P7 | Security is a requirement | Auth, authorization, validation, logging, data protection from requirements, not afterthought |
| P8 | Traceability | Every requirement traces to an experience/capability AND to a test |
| P9 | Independent review | The implementing agent is not the only approver |
| P10 | Learn only from approved artifacts | Memory feeds from verified components/patterns, not everything found |

---

## 4. THE PXIL KNOWLEDGE GRAPH

This is what PXIL uniquely provides — the connective tissue between all tools:

```
Requirement (REQ)
 ├── Capability
 ├── Module (MOD)
 ├── Persona / Actor (ACT)
 ├── Permission (PERM)
 ├── Entity (ENT)
 ├── Business Rule (RULE)
 ├── Flow (FLOW)
 ├── Screen (SCR)
 │    ├── State (STA)
 │    ├── Component (CMP)
 │    └── Responsive Contract
 ├── Event (EVT)
 │    ├── API Contract
 │    ├── State Transition
 │    ├── Feedback
 │    └── Telemetry
 └── Tests (TST)
      ├── Functional
      ├── Accessibility
      ├── Visual
      ├── Security
      └── Contract
```

**Traceability chain:** REQ → MOD → FLOW → SCR → STA → EVT → API/DATA/PERM → TST

No artifact is orphaned. Every requirement reaches a test.

---

## 5. ARCHITECTURE: HOW PXIL WORKS

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

## 6. THE 11 FUNCTIONS OF PXIL

| # | Function | Responsibility |
|---|----------|---------------|
| 1 | Intake & Scope Engine | Collect context, detect gaps, ask high-value questions |
| 2 | Specification Graph | Convert brief to versioned, identifiable objects with traceability |
| 3 | Domain Intelligence | Research domain: capabilities, rules, vocabulary, workflows, risks |
| 4 | UX/IA Architecture | Users, journeys, tasks, navigation, hierarchies, interaction patterns |
| 5 | Data/Security Architecture | Entities, constraints, permissions, privacy, audit, contracts |
| 6 | Experience Contract | Screen inventory, states, events, messages, notifications, acceptance criteria |
| 7 | Visual Direction | Tokens, density, typography, color, iconography, motion, grid, responsive |
| 8 | Component Intelligence | Search private library + 21st, inspect candidates, propose compatible families |
| 9 | Composition Planner | Layout and component combination per screen; generate implementable recipes |
| 10 | Build Orchestrator | Coordinate implementation agents, maintain conformity with contracts |
| 11 | QA & Learning | Execute gates, record findings, correct, promote approved patterns |

---

## 7. THE 9 QUALITY GATES (G0-G8)

| Gate | Name | Condition |
|------|------|-----------|
| G0 | Brief Ready | Objective/scope/actors/risks minimally resolved |
| G1 | Spec Coverage | MUST requirements traced to modules/flows |
| G2 | Domain/Data Ready | Entities, rules, states, critical permissions defined |
| G3 | Experience Ready | Screens + states + events + copy/feedback + responsive |
| G4 | Visual System Ready | Tokens, families, typography, color, density, a11y baseline |
| G5 | Composition Ready | Each screen has recipe and components/provenance plan |
| G6 | Build Ready | Interfaces/API/contracts stable; tasks partitioned |
| G7 | Verification | Functional + integration + system + a11y + visual + security checks |
| G8 | Production Ready | Observability, migrations, backup/restore, docs, support, rollout |

---

## 8. PXIL v2 ECOSYSTEM — ALL TOOLS

### Kernel
| Tool | License | Role |
|------|---------|------|
| **GitHub Spec Kit** | MIT | Process kernel — SDD, extensions, bundles, workflows, Antigravity integration |
| **BMAD Method v6** | MIT | Product discovery, PRD, architecture, UX, DESIGN.md/EXPERIENCE.md |

### Experience Engine
| Tool | License | Role |
|------|---------|------|
| **XState** | MIT | State machines, statecharts, actors — formalizes STA/EVT |

### Visual Engine
| Tool | License | Role |
|------|---------|------|
| **21st.dev** | Proprietary | Component search, generation, exploration, private registries |
| **Onlook** | Apache 2.0 | Visual editor: DOM ↔ Code mapping via AST |
| **Storybook** | MIT | Component lab: stories, interaction/visual/a11y testing |

### Verification
| Tool | License | Role |
|------|---------|------|
| **Playwright** | Apache 2.0 | E2E browser automation |
| **Playwright MCP** | Apache 2.0 | LLM-controlled browser via accessibility snapshots |
| **axe-core** | MPL 2.0 | WCAG accessibility testing engine |

### API Contracts
| Tool | License | Role |
|------|---------|------|
| **Spectral** | Apache 2.0 | OpenAPI linting and governance |
| **Schemathesis** | MIT | Property-based API fuzz testing |
| **Pact JS** | MIT | Consumer-driven contract testing |
| **OpenAPI Generator** | Apache 2.0 | Code generation from specs |

### Security
| Tool | License | Role |
|------|---------|------|
| **OWASP ASVS 5** | CC BY-SA 4.0 | Application Security Verification Standard |

### Observability
| Tool | License | Role |
|------|---------|------|
| **OpenTelemetry** | Apache 2.0 | Traces, metrics, logs semantic conventions |

---

## 9. HOW TOOLS CONNECT

### Data Flow: Tool → Tool

| From | To | What Flows |
|------|----|------------|
| PXIL REQ → Spec Kit | Requirements feed specification |
| PXIL REQ → OpenAPI | Requirements become API contracts |
| PXIL REQ → OWASP ASVS | Security requirements mapping |
| PXIL STA/EVT → XState | Generate executable `.machine.ts` |
| PXIL SCR → 21st | Screen Recipe drives component search |
| PXIL SCR → Storybook | Screen generates stories |
| PXIL TST → Playwright | Test contracts become E2E tests |
| PXIL TST → axe-core | A11y contracts become axe rules |
| BMAD PRD → PXIL REQ | Product requirements extraction |
| BMAD DESIGN.md → PXIL visual | Visual identity contract |
| BMAD EXPERIENCE.md → PXIL flows | Behavior + IA contracts |
| 21st candidates → Storybook | Render in isolation |
| OpenAPI → Spectral | Spec governance lint |
| OpenAPI → Schemathesis | Spec-driven fuzz tests |
| OpenAPI → Pact | Contract verification |
| All results → PXIL Gatekeeper | Quality gate fusion |

---

## 10. SCHEMAS AND CONTRACTS

### PXIL Object Types:
| Prefix | Object | Example |
|--------|--------|---------|
| REQ | Requirement | REQ-FIN-042 |
| ACT | Actor/persona/role | ACT-ACCOUNTANT |
| MOD | Module | MOD-03-LEDGER |
| ENT | Entity | ENT-INVOICE |
| RULE | Business rule | RULE-FIN-001 |
| FLOW | Flow | FLOW-EXP-APPROVE |
| SCR | Screen | SCR-EXP-LIST |
| STA | State | STA-LOADING |
| EVT | Event/command | EVT-EXP-APPROVE |
| PERM | Permission | PERM-EXPENSE-APPROVE |
| NOTIF | Notification | NOTIF-APPROVAL-SENT |
| AUD | Audit event | AUD-EXP-APPROVED |
| API | Endpoint/contract | API-POST-EXPENSE |
| CMP | Component/pattern | CMP-DATA-TABLE |
| TST | Test/acceptance | TST-FUNC-088 |

### Requirement Template:
```yaml
id: REQ-FIN-042
kind: functional
statement: "User with expense.approve can approve a pending expense."
rationale: "Separation of duties and financial control."
source: stakeholder
priority: must
actors: [ROLE-ACCOUNTANT, ROLE-ADMIN]
preconditions: ["expense.status == pending"]
related: [FLOW-EXP-03, SCR-EXP-DETAIL, EVT-EXP-APPROVE]
quality_constraints: [AUD-007, PERM-014]
acceptance:
  - "without permission → 403 and UI hides the action"
  - "success → status=approved, toast, audit event"
  - "version conflict → no overwrite; ask refresh"
confidence: confirmed
```

### Screen Contract Template:
```yaml
id: SCR-EXP-LIST
route: /expenses
purpose: "find, review and act on expenses"
actors: [admin, accountant, reviewer]
data: [expenses, categories, vendors, approval_status]
actions: [search, filter, sort, create, open, bulk_export]
states: [loading, loaded, empty, no_results, partial_error, offline]
permissions:
  create_button: expense.create
  approve_action: expense.approve
responsive:
  desktop: data_table
  mobile: compact_list + filter_sheet
analytics: [screen_view, filter_applied, expense_opened]
acceptance: [TST-UX-031, TST-A11Y-014, TST-FUNC-088]
```

### Event Contract Template:
```yaml
trigger: click/submit/keypress/drag/timer/webhook
precondition: permission, valid state, network, required fields
immediate_ui: pressed/loading/optimistic update/disable duplicate
command: API call, local state, job enqueue, navigation
success: state transition, data refresh, toast, focus target, analytics
failure: rollback, field error, global error, retry, preserve context
side_effects: notification, webhook, audit, cache invalidation
accessibility: focus management, live region, keyboard behavior
observability: trace/span/event/correlation_id
```

### State Completeness Matrix:
| State | What the design must decide |
|-------|-----------------------------|
| Initial | What's shown before interaction? Cached data? |
| Loading | Skeleton/spinner/progress? Block whole screen or just region? |
| Loaded | Hierarchy and available actions |
| Empty-first-use | Explain value + CTA to start |
| Empty-filtered | Differentiate "no data" from "filters don't match" |
| Success | Inline/toast/redirect? Message persistence? |
| Validation error | Field + summary; preserve input |
| Server error | Useful message, retry, correlation/support info |
| Partial failure | What works? What can be retried? |
| Permission denied | Hide/disable? Explain? 403 route? |
| Offline | Cached read? Queue? Blocked actions? |
| Conflict | Data changed elsewhere; merge/refresh/retry |
| Unsaved changes | Loss prevention; autosave or confirmation |
| Destructive confirmation | Consequence, affected object, reversible/undo? |
| Long-running | Progress; background job; notification on completion |

---

## 11. AGENT ARCHITECTURE

### Parallel Verification:
```
Screen/Feature Under Review
         │
    ┌────┼────┐────┐────┐────┐────┐
    │    │    │    │    │    │    │
  Visual A11y UX  Sec  Int  Resp Perf
  Critic Agent Crit Agent Agent Agent Agent
    │    │    │    │    │    │    │
    └────┼────┘────┘────┘────┘────┘
         │
   PXIL Gatekeeper
   (Findings Fusion)
         │
   APPROVED / REPAIR
```

---

## 12. COMPONENT INTELLIGENCE PIPELINE

```
PXIL Screen Recipe
        ↓
21st.dev search (8-20 candidates)
        ↓
Storybook sandbox render
        ↓
Visual Inspector (family compatibility scoring)
        ↓
axe-core (accessibility check)
        ↓
Compatible? → YES → Implement → QA → Publish to Private Library
             → NO → Next candidate or custom build
```

---

## 13. FINANCIAL SYSTEM EXAMPLE (from PDF)

### What PXIL Would NOT Do:
- Search for a "finance dashboard" and paste cards
- First, determine what "finance" means in this context

### High-Impact Questions:
- Type: personal finance, SMB, accounting, treasury, lending, payments, ERP?
- Users: owner, accountant, reviewer, employee, auditor, customer?
- Formal accounting: chart of accounts and double-entry?
- Multi-company / multi-currency / tax jurisdictions?
- Bank feeds and reconciliation?
- Does it actually move money?
- Immutable audit/history, approvals, separation of duties?

### Module Map (Example: SMB Bookkeeping):
| Module | Scope |
|--------|-------|
| MOD-01 Dashboard | KPIs, cash position, alerts, pending tasks |
| MOD-02 Chart of Accounts | accounts, types, hierarchy, status |
| MOD-03 Ledger & Journal | entries, debit/credit, posting, reversal |
| MOD-04 Banking | accounts, imports, transactions, rules |
| MOD-05 Reconciliation | matching, discrepancies, closing |
| MOD-06 Sales/AR | customers, invoices, payments, aging |
| MOD-07 Expenses/AP | vendors, expenses, approvals, due dates |
| MOD-08 Budget | budget lines, actual vs budget, periods |
| MOD-09 Reports | P&L, balance sheet, cash flow, aging |
| MOD-10 Files | receipts, attachments, evidence |
| MOD-11 Notifications | approval, overdue, completion |
| MOD-12 Audit & Activity | business trail, security events |
| MOD-13 Team & Access | users, invitations, roles, permissions |
| MOD-14 Settings | company, fiscal periods, currencies |

### Screens Often Forgotten by AI:
- Invitation acceptance; suspended account; MFA/recovery
- No-company / company switcher / first-company onboarding
- Import wizard: column mapping, preview, invalid rows, duplicates
- Reconciliation conflict and partial import states
- Period close/locked-period state
- Approval inbox + rejected/request-changes flow
- Audit log detail with before/after
- Permission denied for deep links
- Global search/command palette
- Export job states
- Integration disconnected/expired credentials
- Notification preferences

---

## 14. DEFINITION OF DONE CHECKLISTS

### Specification DoD:
- [ ] No MUST requirement without realization and acceptance test
- [ ] No module without actor/task/value defined
- [ ] No critical entity without ownership, integrity, lifecycle
- [ ] No mutating action without permission + success/failure behavior
- [ ] No critical flow without happy/alternate/exception/recovery paths
- [ ] No screen contract without responsive and state coverage
- [ ] No sensitive data without exposure/logging/retention policy
- [ ] No high-impact assumption hidden

### Visual DoD:
- [ ] Design tokens used; no arbitrary repeated values
- [ ] Components belong to compatible family
- [ ] Clear primary/secondary hierarchy; consistent typography/spacing
- [ ] Light/dark if in scope; status colors verified
- [ ] Responsive per contract; no overflow or inaccessible controls
- [ ] Loading/empty/error/no-results/permission/conflict rendered
- [ ] Focus, hover, active, disabled, selected states exist
- [ ] Local QA screenshots archived

### Production Readiness DoD:
- [ ] Server-side auth/authz; secrets outside client/repo
- [ ] Versioned DB migrations; backup/restore tested
- [ ] Observability and alerting for critical operations
- [ ] Failure runbook for relevant third-party outages
- [ ] Feature flags/rollout plan if risk warrants
- [ ] Security checks, dependency review, ASVS target met
- [ ] Accessibility findings closed
- [ ] Performance targets measured with representative data

---

## 15. HOW TO BUILD AN APP USING PXIL

### Step-by-step:
1. **Intake**: Define objective, users, scope, data, money, integrations, regulation
2. **Confidence Ledger**: Mark each decision CONFIRMED/INFERRED/RESEARCHED/ASSUMED/OPEN
3. **Gate G0**: Brief Ready — objective, scope, actors, risks resolved
4. **Domain Model**: Research domain, map capabilities, entities, rules, states
5. **Requirements**: Write REQ objects with acceptance criteria and traceability
6. **Gate G1**: Spec Coverage — MUST requirements traced
7. **Gate G2**: Domain/Data Ready — entities, rules, permissions defined
8. **UX Architecture**: Users, journeys, tasks, navigation, information architecture
9. **Experience Contracts**: Screens, states, events, feedback
10. **Gate G3**: Experience Ready
11. **Visual Direction**: Design tokens, typography, color, density, motion
12. **Gate G4**: Visual System Ready
13. **Component Search**: Private library first, then 21st.dev
14. **Screen Recipes**: Layout + components per screen
15. **Gate G5**: Composition Ready
16. **Implementation**: Build against contracts
17. **Gate G6**: Build Ready
18. **Verification**: Parallel agents (functional, a11y, visual, security, API)
19. **Gate G7**: Verification passed
20. **Production Readiness**: Observability, migrations, docs
21. **Gate G8**: Production Ready

---

## 16. REPOSITORY LOCATIONS

All repositories are cloned at: `e:\VILTRUM\VILTRUM DESING\pxil-ecosystem\`

```
pxil-ecosystem/
├── kernel/
│   ├── spec-kit/                 ← MIT | GitHub Spec Kit
│   └── bmad-method/              ← MIT | BMAD Method v6
├── experience-engine/
│   └── xstate/                   ← MIT | XState v5
├── visual-engine/
│   ├── onlook/                   ← Apache 2.0 | Onlook
│   └── storybook/                ← MIT | Storybook
├── verification/
│   ├── playwright/               ← Apache 2.0 | Playwright
│   ├── playwright-mcp/           ← Apache 2.0 | Playwright MCP
│   └── axe-core/                 ← MPL 2.0 | axe-core
├── api-contracts/
│   ├── spectral/                 ← Apache 2.0 | Spectral
│   ├── schemathesis/             ← MIT | Schemathesis
│   ├── pact-js/                  ← MIT | Pact JS
│   └── openapi-generator/        ← Apache 2.0 | OpenAPI Generator
├── security/
│   └── ASVS/                     ← CC BY-SA 4.0 | OWASP ASVS
├── observability/
│   ├── opentelemetry-js/         ← Apache 2.0 | OTel JS
│   └── opentelemetry-specification/ ← Apache 2.0 | OTel Spec
├── optional/
│   └── penpot/                   ← MPL 2.0 | Penpot
├── PXIL-DOCUMENT.md              ← Full PDF extracted (31 pages)
├── ECOSYSTEM.md                  ← Master ecosystem docs
├── INTEGRATION-MAP.md            ← Tool integration map
├── bundle.yml                    ← Spec Kit Bundle definition
└── plugin.json                   ← Antigravity Plugin manifest
```

### PXIL v1 (original schemas and agents):
```
e:\VILTRUM\VILTRUM DESING\pxil\
├── schemas/                      ← 13 JSON schemas
├── agents/                       ← 14 agent definitions
├── skills/                       ← 13 skills
├── scripts/                      ← 3 utility scripts
├── design/                       ← Design baselines
├── rules/                        ← Agent rules
├── plugin.json                   ← Antigravity plugin
└── mcp_config.json               ← MCP configuration
```

---

## 17. ORIGINAL PDF REFERENCE

The complete PXIL document (31 pages) is extracted at:
`e:\VILTRUM\VILTRUM DESING\pxil-ecosystem\PXIL-DOCUMENT.md`

It covers:
1. Problem, objective and principles
2. Standards foundation (ISO, WCAG, OWASP, NIST, OpenAPI, etc.)
3. Operational architecture
4. Intake, discovery, scope closure
5. Requirements engineering and traceability
6. Domain modeling, modules, rules
7. Data, normalization, integrity
8. Roles, permissions, security, privacy, audit
9. UX and information architecture
10. Screens, states, events, microinteractions
11. Visual system and design system
12. 21st.dev: retrieval, inspection, private library
13. Antigravity: plugin, skills, agents, rules
14. Composition, implementation, quality gates
15. Testing, accessibility, performance, observability
16. Financial system example
17. Machine-readable contracts and schemas
18. Definition of Done and checklists
19. Implementation roadmap
20. Curriculum and recommended tools
21. Master Agent Contract

---

## FOR AI AGENTS: YOUR MISSION

If you are an AI agent reading this document, your role is to:

1. **Understand** the PXIL methodology deeply
2. **Evaluate** what works and what can be improved
3. **Propose** concrete improvements to schemas, agents, workflows
4. **Build** applications following the PXIL pipeline
5. **Use 21st.dev** for component selection (via MCP/CLI, not scraping)
6. **Verify** your work using the quality gates and DoD checklists
7. **Report** findings with traceability back to requirements

Remember: **PXIL does not implement what mature tools already do.
PXIL orchestrates, normalizes results, adds traceability, and covers the gaps.**

The unique value of PXIL is the **Knowledge Graph + Experience Contracts +
Visual Intelligence Scoring + Cross-Tool Orchestrator + Quality Gate Engine.**

Everything else, we connect.
