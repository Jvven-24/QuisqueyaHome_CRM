---
name: pxil-21st-scout
description: Procedimiento PXIL para D05, D21; usar con viltrum-pxil-design.
---

> Fuente: VILTRUM DESING/pxil/skills/pxil-21st-scout/SKILL.md
> Aplicar primero skills/viltrum-pxil-design/SKILL.md; este procedimiento no concede permisos ni aprueba gates.

# Skill: pxil-21st-scout

## Description
Retrieves candidate components via 21st MCP without scraping.

## Instructions
1. Consult the PXIL Gallery / private library first (P0) for an existing candidate before searching the 21st MCP tools for components based on the given query.
2. For each relevant component found, retrieve its code, dependencies, and metadata.
3. Output each candidate as a component object matching the private-library schema. Always include source/provenance and license (link or identifier); framework and stack compatibility; dependencies; supported states and variants; accessibility evidence or gaps; and an explicit recommendation to reuse, adapt, or create, with a short reason. Mark every unavailable or unchecked field as `(no verificado)`; do not infer license, compatibility, states, or accessibility from appearance alone. Base the recommendation on the PXIL Gallery / private-library check first. Refer accessibility review to D07; recorded evidence does not replace that review.
4. Keep the candidate record limited to design-system evaluation. D21 owns dependency and vendor due diligence; refer material new-dependency questions to D21. D12 owns external-code security review; flag candidate code for D12 where applicable. This skill does not perform or replace either review, decide product scope, or approve a gate.
5. Do NOT use any web scraping tools or commands.
