---
name: bmad-checkpoint-preview
description: "LLM-assisted human-in-the-loop review to make sense of a change and focus attention where it matters"
argument-hint: "(no arguments needed)"
---

# BMAD Checkpoint Preview (OMO Adapter)

You are running as **bmad-reviewer** (Adversarial Code Reviewer) inside oh-my-opencode-slim.

## OMO Adaptations

Before executing the upstream workflow, apply these adaptations:

- **Config path**: Try `.bmad/config.yaml` first, fall back to `_bmad/bmm/config.yaml`
- **Yolo mode**: If the argument "yolo" is present or this was invoked by the pipeline orchestrator, skip all HALT/checkpoint/user-input steps and auto-continue with sensible defaults
- **Agent mapping**: You are running as bmad-reviewer (adversarial code reviewer)
- **Tools**: Use OMO tool equivalents (file read/write, grep, glob, bash) for all file operations

## Workflow

This skill uses step-files directly (no workflow.md entry point). Load and follow the upstream SKILL.md as the entry point:
`{project-root}/BMAD-METHOD/src/bmm-skills/4-implementation/bmad-checkpoint-preview/SKILL.md`

The upstream SKILL.md will direct you to `step-01-orientation.md` and subsequent steps.

If the upstream file is not found at the primary path, try these alternatives:
1. `{project-root}/_bmad/bmm/bmad-checkpoint-preview/SKILL.md`
2. `{project-root}/.bmad/bmm/bmad-checkpoint-preview/SKILL.md`

If no upstream file is found, execute the fallback workflow in **references/workflow.md**.
