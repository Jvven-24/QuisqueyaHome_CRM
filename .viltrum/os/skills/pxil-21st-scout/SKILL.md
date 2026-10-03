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
1. Use the 21st MCP tools to search for components based on the given query.
2. For each relevant component found, retrieve its code, dependencies, and metadata.
3. Output the results as a list of component objects matching the private-library schema.
4. Do NOT use any web scraping tools or commands.
