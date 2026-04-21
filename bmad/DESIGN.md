# BMAD Integration — Architecture & Design

This document covers how BMAD-METHOD workflow skills integrate with oh-my-opencode-slim (OMO) through thin adapters, the runtime path resolution strategy, agent mapping, and the design decisions behind this approach.

## Architecture Overview

OMO provides a multi-model agent orchestration runtime. BMAD-METHOD provides structured software delivery workflows (create PRD, architecture, stories, development, code review, etc.). The integration gives each BMAD persona its own agent with per-agent model binding — so the architect runs on a strong reasoning model, the dev on a coding-optimized model, and the sprint manager on a cheap fast model.

```
OMO Orchestrator (depth 0)
  └── bmad-orchestrator (depth 1) — BMAD pipeline driver
        ├── bmad-pm (John) — PRD, stories
        ├── bmad-architect (Winston) — architecture, design
        ├── bmad-dev (Amelia) — code implementation
        ├── bmad-reviewer — adversarial code review
        ├── bmad-qa — test generation
        ├── bmad-analyst (Mary) — research, analysis
        ├── bmad-ux (Sally) — UX design
        ├── bmad-writer (Paige) — documentation
        ├── bmad-sm — sprint management
        └── bmad-qa — test engineering
```

## Thin-Adapter Pattern

Each BMAD skill in OMO is a **thin adapter** — a ~30-line `SKILL.md` that handles OMO-specific concerns and delegates the actual workflow logic to the BMAD-METHOD upstream at runtime.

### Why Thin Adapters (Not Thick Wrappers)

The alternative would be copying BMAD-METHOD's workflow files, step files, and templates into OMO's `src/skills/` directories. That approach creates a permanent sync burden — every upstream change requires manual re-copying.

| Dimension | Thick Wrapper | Thin Adapter |
|---|---|---|
| Lines per skill | 300–3,200 | 20–30 |
| Total (Phases 2–5) | ~27,500 | ~500 |
| Sync burden | Manual re-copy on every upstream change | Zero |
| Source of truth | Duplicated | BMAD-METHOD owns logic, OMO owns integration |

### Adapter Structure

Every adapter `SKILL.md` has three sections:

1. **Frontmatter** — name, description, argument-hint
2. **OMO Adaptations** — config path, yolo mode, agent mapping, tool equivalents
3. **Workflow delegation** — path to upstream `workflow.md` with fallback chain

Example:

```yaml
---
name: bmad-create-story
description: "Creates a dedicated story file with full implementation context"
argument-hint: "<story-number> e.g., 1-1 or 2-3 (optional, auto-selects if omitted)"
---

# BMAD Create Story (OMO Adapter)

You are running as **bmad-pm** (John persona) inside oh-my-opencode-slim.

## OMO Adaptations

- **Config path**: Try `.bmad/config.yaml` first, fall back to `_bmad/bmm/config.yaml`
- **Yolo mode**: Skip all HALT/checkpoint steps — auto-continue with sensible defaults
- **Agent mapping**: You are running as bmad-pm (John persona)
- **Tools**: Use OMO tool equivalents (file read/write, grep, glob, bash)

## Workflow

Load and follow: `{project-root}/BMAD-METHOD/src/bmm-skills/4-implementation/bmad-create-story/workflow.md`

Fallback alternatives:
1. `{project-root}/_bmad/bmm/bmad-create-story/workflow.md`
2. `{project-root}/.bmad/bmm/bmad-create-story/workflow.md`

If no upstream workflow is found, execute the fallback in **references/workflow.md**.
```

## Runtime Path Resolution

Adapters resolve the upstream workflow file through a three-tier fallback chain:

```
Primary:   {project-root}/BMAD-METHOD/src/bmm-skills/<phase>/<skill>/workflow.md
Fallback:  {project-root}/_bmad/bmm/<skill>/workflow.md
Fallback:  {project-root}/.bmad/bmm/<skill>/workflow.md
Last:      references/workflow.md (local fallback)
```

**Primary path** — works when the BMAD-METHOD repository is cloned alongside the project. Used during development and when the user wants to track upstream directly.

**Fallback paths** — work when BMAD-METHOD has been installed via `npx bmad-method install`, which copies workflows into `_bmad/bmm/`. The `.bmad/` variant supports user-level config overrides.

**Local fallback** — a minimal `references/workflow.md` shipped with the adapter, providing graceful degradation when no upstream is found.

### Config Resolution

Upstream workflows expect a config file at `{project-root}/_bmad/bmm/config.yaml`. The adapter remaps this:

```
Try first:  {project-root}/.bmad/config.yaml
Fall back:  {project-root}/_bmad/bmm/config.yaml
```

This allows users to override BMAD config without modifying the installed `_bmad/` directory.

## Agent Mapping

Each adapter specifies which BMAD persona the agent should assume. This determines the agent's behavior, delegation targets, and model selection:

| Adapter Skill | OMO Agent | BMAD Persona | Primary Reason |
|---|---|---|---|
| bmad-create-story | bmad-pm | John | Story creation is a PM responsibility |
| bmad-dev-story | bmad-dev | Amelia | Story implementation is dev work |
| bmad-code-review | bmad-reviewer | (derived) | Adversarial review needs different model than dev |
| bmad-sprint-planning | bmad-sm | Sprint Manager | Sprint planning is metadata tracking |
| bmad-sprint-status | bmad-sm | Sprint Manager | Status reporting is lightweight |
| bmad-correct-course | bmad-dev | Amelia | Course correction is developer-driven |
| bmad-retrospective | bmad-sm | Sprint Manager | Retros facilitation |
| bmad-qa-generate-e2e-tests | bmad-qa | QA Engineer | Test generation is QA work |
| bmad-create-prd | bmad-pm | John | PRD creation is PM responsibility |
| bmad-validate-prd | bmad-analyst | Mary | PRD validation is analysis work |
| bmad-create-architecture | bmad-architect | Winston | Architecture is Winston's domain |
| bmad-create-epics-and-stories | bmad-pm | John | Story decomposition is PM work |
| bmad-check-implementation-readiness | bmad-architect | Winston | Readiness check is architecture validation |
| bmad-generate-project-context | bmad-architect | Winston | Context capture is architecture-adjacent |
| bmad-quick-dev | bmad-dev | Amelia | Quick implementation is dev work |
| bmad-checkpoint-preview | bmad-reviewer | (derived) | Review walkthrough |
| bmad-create-ux-design | bmad-ux | Sally | UX design is Sally's domain |
| bmad-edit-prd | bmad-pm | John | PRD editing is PM work |

## Yolo Mode

BMAD-METHOD workflows are designed for human-in-the-loop interaction — they include HALT checkpoints, user confirmation steps, and interactive Q&A. When running inside OMO's automated pipelines, these checkpoints are counterproductive.

**Yolo mode** is triggered when:
- The skill argument includes "yolo"
- The skill is invoked by the pipeline orchestrator (bmad-orchestrator)

When active, the adapter:
- Skips all HALT/checkpoint steps
- Auto-continues with sensible defaults
- Suppresses interactive user-input prompts
- Emits progress output instead of blocking for confirmation

## Skill Registration

All BMAD skills are registered in `src/cli/custom-skills.ts` as `CustomSkill` objects:

```typescript
{
  name: 'bmad-create-story',
  description: 'Creates a dedicated story file with full implementation context',
  allowedAgents: ['bmad-orchestrator', 'bmad-dev', 'bmad-sm', 'orchestrator'],
  sourcePath: 'src/skills/bmad-create-story',
}
```

The `allowedAgents` field controls which agents can invoke the skill. The `sourcePath` points to the adapter directory, which gets copied to `~/.config/opencode/skills/` during installation.

## OMO-Native Skills (Not Adapters)

Three pipeline skills are OMO-native — they contain full workflow logic rather than delegating upstream:

- **bmad-story-pipeline** — orchestrates a single story through configurable pipeline steps
- **bmad-story-pipeline-worktree** — same, but with git worktree isolation
- **bmad-epic-pipeline** — batch delivery across all stories in an epic

These are OMO orchestration logic, not BMAD-METHOD workflows, so they don't delegate upstream.

Two skills are OMO shims (no upstream BMAD equivalent):

- **bmad-testarch-atdd** — generates ATDD test checklists (BMAD's TEA module isn't included)
- **bmad-testarch-trace** — generates traceability matrices (same)

## Dependency Graph

```
Phase 2 (unblock pipeline):
  dual-path config → sprint-planning → create-story → dev-story → code-review
  testarch-atdd shim / testarch-trace shim

Phase 3 (planning chain):
  create-prd → validate-prd → create-architecture → create-epics-and-stories
  → check-readiness → sprint-planning
  create-architecture → generate-project-context → create-story / dev-story
  create-prd → create-ux-design / edit-prd

Phase 4 (support):
  quick-dev → checkpoint-preview
```

## File Inventory

| Category | Files | Lines |
|---|---|---|
| Agent factories (Phase 1) | 10 files in `src/agents/` | ~1,200 |
| Pipeline skills (Phase 1) | 3 SKILL.md + 2 references | ~480 |
| Thin-adapter skills (Phase 2–4) | 19 SKILL.md | ~570 |
| Registration | `src/cli/custom-skills.ts` | ~295 |
| Config | `src/config/constants.ts`, `agent-mcps.ts` | modified |
| Tests | `index.test.ts`, `background-manager.test.ts` | updated |
