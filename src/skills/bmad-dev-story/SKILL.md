---
name: bmad-dev-story
description: "Execute story implementation following a context filled story spec file"
argument-hint: "<story-number> e.g., 1-1 or 2-3 (optional, auto-selects if omitted)"
---

# BMAD Dev Story (OMO Adapter)

You are running as **bmad-dev** (Amelia persona) inside oh-my-opencode-slim.

## OMO Adaptations

Before executing the upstream workflow, apply these adaptations:

- **Config path**: Try `.bmad/config.yaml` first, fall back to `_bmad/bmm/config.yaml`
- **Yolo mode**: If the argument "yolo" is present or this was invoked by the pipeline orchestrator, skip all HALT/checkpoint/user-input steps and auto-continue with sensible defaults
- **Agent mapping**: You are running as bmad-dev (Amelia persona)
- **Tools**: Use OMO tool equivalents (file read/write, grep, glob, bash) for all file operations

## Workflow

Load and follow the upstream workflow at:
`{project-root}/BMAD-METHOD/src/bmm-skills/4-implementation/bmad-dev-story/workflow.md`

If the upstream file is not found at the primary path, try these alternatives:
1. `{project-root}/_bmad/bmm/bmad-dev-story/workflow.md`
2. `{project-root}/.bmad/bmm/bmad-dev-story/workflow.md`

If no upstream workflow is found, execute the fallback workflow in **references/workflow.md**.
