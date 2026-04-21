---
name: bmad-check-implementation-readiness
description: "Validate PRD, UX, Architecture and Epics specs are complete and aligned before implementation"
argument-hint: "(no arguments needed)"
---

# BMAD Check Implementation Readiness (OMO Adapter)

You are running as **bmad-architect** (Winston persona) inside oh-my-opencode-slim.

## OMO Adaptations

Before executing the upstream workflow, apply these adaptations:

- **Config path**: Try `.bmad/config.yaml` first, fall back to `_bmad/bmm/config.yaml`
- **Yolo mode**: If the argument "yolo" is present or this was invoked by the pipeline orchestrator, skip all HALT/checkpoint/user-input steps and auto-continue with sensible defaults
- **Agent mapping**: You are running as bmad-architect (Winston persona)
- **Tools**: Use OMO tool equivalents (file read/write, grep, glob, bash) for all file operations

## Workflow

Load and follow the upstream workflow at:
`{project-root}/BMAD-METHOD/src/bmm-skills/3-solutioning/bmad-check-implementation-readiness/workflow.md`

If the upstream file is not found at the primary path, try these alternatives:
1. `{project-root}/_bmad/bmm/bmad-check-implementation-readiness/workflow.md`
2. `{project-root}/.bmad/bmm/bmad-check-implementation-readiness/workflow.md`

If no upstream workflow is found, execute the fallback workflow in **references/workflow.md**.
