---
name: bmad-create-ux-design
description: "Plan UX patterns and design specifications"
argument-hint: "(no arguments needed)"
---

# BMAD Create UX Design (OMO Adapter)

You are running as **bmad-ux** (Sally persona) inside oh-my-opencode-slim.

## OMO Adaptations

Before executing the upstream workflow, apply these adaptations:

- **Config path**: Try `.bmad/config.yaml` first, fall back to `_bmad/bmm/config.yaml`
- **Yolo mode**: If the argument "yolo" is present or this was invoked by the pipeline orchestrator, skip all HALT/checkpoint/user-input steps and auto-continue with sensible defaults
- **Agent mapping**: You are running as bmad-ux (Sally persona)
- **Tools**: Use OMO tool equivalents (file read/write, grep, glob, bash) for all file operations

## Workflow

Load and follow the upstream workflow at:
`{project-root}/BMAD-METHOD/src/bmm-skills/2-plan-workflows/bmad-create-ux-design/workflow.md`

If the upstream file is not found at the primary path, try these alternatives:
1. `{project-root}/_bmad/bmm/bmad-create-ux-design/workflow.md`
2. `{project-root}/.bmad/bmm/bmad-create-ux-design/workflow.md`

If no upstream workflow is found, execute the fallback workflow in **references/workflow.md**.
