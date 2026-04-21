# BMAD Integration — Usage Guide

How to use BMAD-METHOD workflows inside oh-my-opencode-slim (OMO). Covers setup, running skills, pipeline execution, and configuration.

## Prerequisites

1. **OMO installed** — `bunx oh-my-opencode-slim@latest install` completed
2. **BMAD-METHOD present** — one of:
   - Cloned alongside your project: `ls BMAD-METHOD/src/bmm-skills/` should show skill directories
   - Installed via `npx bmad-method install` — `ls _bmad/bmm/` should show installed workflows
3. **BMAD config** — at least one of:
   - `.bmad/config.yaml` (preferred, user overrides)
   - `_bmad/bmm/config.yaml` (installer-generated)

## Quick Start

### Running a Single Skill

Invoke any BMAD skill directly from the OMO orchestrator:

```
/bmad-create-story 1-1
/bmad-dev-story 1-1
/bmad-code-review 1-1
```

Or without a story number (auto-selects first incomplete story):

```
/bmad-dev-story
```

### Running a Story Pipeline

Deliver a complete story (create → dev → review → test → trace) in one command:

```
/bmad-story-pipeline 1-1
```

With yolo mode (skip all human checkpoints):

```
/bmad-story-pipeline 1-1 yolo
```

### Running an Epic Pipeline

Deliver all incomplete stories in an epic sequentially:

```
/bmad-epic-pipeline 1
```

Each story gets its own git worktree and runs the full story pipeline.

### Full Planning Chain

Go from requirements to implementation-ready stories:

```
/bmad-create-prd
/bmad-validate-prd
/bmad-create-architecture
/bmad-create-epics-and-stories
/bmad-check-implementation-readiness
/bmad-generate-project-context
/bmad-sprint-planning
```

Then start delivery:

```
/bmad-epic-pipeline 1
```

## Available Skills

### Phase 2: Implementation Workflow Skills

| Skill | Command | Agent | Purpose |
|---|---|---|---|
| bmad-sprint-planning | `/bmad-sprint-planning` | bmad-sm | Generate sprint status tracking from epics |
| bmad-create-story | `/bmad-create-story <story>` | bmad-pm | Create a story file with full implementation context |
| bmad-dev-story | `/bmad-dev-story <story>` | bmad-dev | Implement a story following its spec |
| bmad-code-review | `/bmad-code-review <story>` | bmad-reviewer | Adversarial code review with parallel review layers |
| bmad-sprint-status | `/bmad-sprint-status` | bmad-sm | Summarize sprint status and surface risks |
| bmad-correct-course | `/bmad-correct-course` | bmad-dev | Propose a sprint change with impact analysis |
| bmad-retrospective | `/bmad-retrospective [epic]` | bmad-sm | Post-epic review to extract lessons |
| bmad-qa-generate-e2e-tests | `/bmad-qa-generate-e2e-tests [story]` | bmad-qa | Generate E2E automated tests |
| bmad-testarch-atdd | `/bmad-testarch-atdd <story>` | bmad-qa | Generate ATDD test checklist (OMO shim) |
| bmad-testarch-trace | `/bmad-testarch-trace <story>` | bmad-qa | Generate traceability matrix (OMO shim) |

### Phase 3: Planning & Solutioning Skills

| Skill | Command | Agent | Purpose |
|---|---|---|---|
| bmad-create-prd | `/bmad-create-prd` | bmad-pm | Create a PRD from scratch |
| bmad-validate-prd | `/bmad-validate-prd` | bmad-analyst | Validate a PRD against standards |
| bmad-create-architecture | `/bmad-create-architecture` | bmad-architect | Create architecture design decisions |
| bmad-create-epics-and-stories | `/bmad-create-epics-and-stories` | bmad-pm | Break requirements into epics and stories |
| bmad-check-implementation-readiness | `/bmad-check-implementation-readiness` | bmad-architect | Validate specs before implementation |
| bmad-generate-project-context | `/bmad-generate-project-context` | bmad-architect | Create project-context.md for AI agents |

### Phase 4: Support Skills

| Skill | Command | Agent | Purpose |
|---|---|---|---|
| bmad-quick-dev | `/bmad-quick-dev <intent>` | bmad-dev | Implement any intent following existing patterns |
| bmad-checkpoint-preview | `/bmad-checkpoint-preview` | bmad-reviewer | Human-in-the-loop change review |
| bmad-create-ux-design | `/bmad-create-ux-design` | bmad-ux | Plan UX patterns and design specs |
| bmad-edit-prd | `/bmad-edit-prd` | bmad-pm | Edit an existing PRD |

### Pipeline Orchestration (OMO-Native)

| Skill | Command | Purpose |
|---|---|---|
| bmad-story-pipeline | `/bmad-story-pipeline [story]` | Run configurable pipeline for a single story |
| bmad-story-pipeline-worktree | `/bmad-story-pipeline-worktree [story]` | Same, in an isolated git worktree |
| bmad-epic-pipeline | `/bmad-epic-pipeline [epic]` | Batch deliver all stories in an epic |

## Yolo Mode

Append `yolo` to any skill invocation to skip all human-in-the-loop checkpoints:

```
/bmad-create-story 2-3 yolo
/bmad-dev-story 2-3 yolo
/bmad-code-review 2-3 yolo
```

When yolo mode is active:
- HALT/checkpoint steps are skipped
- Interactive user-input prompts auto-continue with defaults
- Progress is emitted instead of blocking for confirmation

Yolo mode is automatically enabled when skills are invoked by the pipeline orchestrator.

## Configuration

### Model Assignment

Each BMAD agent gets a model in `~/.config/opencode/oh-my-opencode-slim.json`:

```jsonc
{
  "agents": {
    "bmad-orchestrator": { "model": "openai/gpt-5.4" },
    "bmad-architect": { "model": "openai/gpt-5.4" },
    "bmad-dev": { "model": "openai/gpt-5.4" },
    "bmad-reviewer": { "model": "anthropic/claude-sonnet-4-20250514" },
    "bmad-pm": { "model": "openai/gpt-5.4" },
    "bmad-qa": { "model": "openai/gpt-5.4-mini" },
    "bmad-sm": { "model": "openai/gpt-5.4-mini" }
  }
}
```

The reviewer uses a different provider than dev to avoid blind spots — the same model reviewing its own code tends to miss the same categories of errors.

### BMAD Config

BMAD workflows expect a `config.yaml` with project settings. Place it at `.bmad/config.yaml` in your project root:

```yaml
project_name: "My Project"
user_name: "Developer"
communication_language: "English"
document_output_language: "English"
user_skill_level: "intermediate"
planning_artifacts: "_bmad-output/planning-artifacts"
implementation_artifacts: "_bmad-output/implementation-artifacts"
project_knowledge: "_bmad-output/project-knowledge"
```

### Customizing the Pipeline

The story pipeline reads steps from `src/skills/bmad-story-pipeline/references/workflow-steps.md`. After installation, this file lives at `~/.config/opencode/skills/bmad-story-pipeline/references/workflow-steps.md`.

Edit it to customize which steps run and in what order. The file uses Markdown headings with `- Command:` bullets:

```md
### Step 1: Create User Story
- Command: `/bmad-create-story {STORY_ID} yolo`
- Description: Create user story

### Step 2: Generate ATDD Tests
- Command: `/bmad-testarch-atdd {STORY_ID} yolo`
- Description: Generate ATDD tests

### Step 3: Development
- Command: `/bmad-dev-story {STORY_ID} yolo`
- Description: Develop user story

### Step 4: Code Review
- Command: `/bmad-code-review {STORY_ID} yolo`
- Description: Code review

### Step 5: Trace Test Coverage
- Command: `/bmad-testarch-trace {STORY_ID} yolo`
- Description: Trace test coverage
```

## Troubleshooting

### "Upstream workflow not found"

The adapter couldn't locate the BMAD-METHOD workflow file. Check:

1. Is BMAD-METHOD cloned alongside your project?
   ```bash
   ls BMAD-METHOD/src/bmm-skills/4-implementation/bmad-create-story/workflow.md
   ```
2. Or was it installed via `npx bmad-method install`?
   ```bash
   ls _bmad/bmm/bmad-create-story/workflow.md
   ```
3. If neither exists, the skill will use its local fallback (minimal functionality).

### Skill not recognized

Make sure the skill is installed:
```bash
ls ~/.config/opencode/skills/bmad-create-story/SKILL.md
```

If missing, re-run the installer:
```bash
bunx oh-my-opencode-slim@latest install --skills=yes
```

### Agent not allowed

Check `allowedAgents` in the skill's `SKILL.md`. The skill can only be invoked by listed agents. To override, add the skill to the agent's `skills` array in your config:

```jsonc
{
  "agents": {
    "bmad-dev": {
      "skills": ["bmad-create-story", "bmad-dev-story"]
    }
  }
}
```

### Config not found

The adapter looked for `.bmad/config.yaml` and `_bmad/bmm/config.yaml` but found neither. Create one:

```bash
mkdir -p .bmad
cat > .bmad/config.yaml << 'EOF'
project_name: "My Project"
user_name: "Developer"
communication_language: "English"
document_output_language: "English"
planning_artifacts: "_bmad-output/planning-artifacts"
implementation_artifacts: "_bmad-output/implementation-artifacts"
EOF
```

Or run `npx bmad-method install` to generate it interactively.
