---
name: bmad-testarch-trace
description: "Generate traceability matrix mapping requirements to tests for a story"
argument-hint: "<story-number> e.g., 1-1 or 2-3"
---

# BMAD TestArch Trace (OMO Shim)

You are running as **bmad-qa** (QA Engineer) inside oh-my-opencode-slim.

## OMO Adaptations

Before executing the workflow, apply these adaptations:

- **Config path**: Try `.bmad/config.yaml` first, fall back to `_bmad/bmm/config.yaml`
- **Yolo mode**: If the argument "yolo" is present or this was invoked by the pipeline orchestrator, skip all HALT/checkpoint/user-input steps and auto-continue with sensible defaults
- **Agent mapping**: You are running as bmad-qa (QA Engineer)
- **Tools**: Use OMO tool equivalents (file read/write, grep, glob, bash) for all file operations

## About This Skill

This is an OMO-native compatibility shim. The upstream BMAD-METHOD does not include a `testarch-trace` workflow — the traceability matrix methodology belongs to BMAD's separate TEA (Test Engineering Architecture) module. This shim provides a minimal traceability workflow so Phase 1 pipelines work unchanged.

## Workflow

Execute the fallback workflow in **references/workflow.md**.

If BMAD's TEA module is available, try loading from:
1. `{project-root}/_bmad/tea/bmad-testarch-trace/workflow.md`
2. `{project-root}/.bmad/tea/bmad-testarch-trace/workflow.md`
