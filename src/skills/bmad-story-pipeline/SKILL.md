---
name: bmad-story-pipeline
description: Run configurable BMAD pipeline for story delivery using subagent
argument-hint: "<story-number> e.g., 1-1 or 2-3 (optional, auto-selects if omitted)"
---

# BMAD Story Pipeline

Complete the delivery pipeline for story `{ARGUMENT}` using configurable workflow.

## Pre-step: Determine Story Number

If `{ARGUMENT}` is empty or not provided:

1. Read `_bmad-output/implementation-artifacts/sprint-status.yaml` (or `docs/sprint/sprint-status.yaml`) to find stories
2. Find the first story with status "todo" or "in-progress"
3. Use that story number as `{STORY_ID}`
4. If no story found, ask user to specify story number

The story number format is typically `X-Y` (e.g., `1-1`, `2-3`).

## Execution Strategy

1. Read workflow steps from **references/workflow-steps.md**
2. Execute each step sequentially using Task tool with `category="quick"`
3. Output progress after each step
4. After pipeline, update status to done

## Workflow Steps

Read and execute steps from **references/workflow-steps.md**.

For each step defined there, you MUST use the **Task tool** to execute in a subagent:

```
task(
  category="quick",
  load_skills=["bmad-create-story", "bmad-dev-story", "bmad-code-review", "bmad-testarch-atdd", "bmad-testarch-trace"],
  description="<Step description>",
  prompt="Execute the command: <COMMAND_WITH_STORY_ID>
Return: 1) Step completion status 2) Key outputs 3) Any issues to note",
  run_in_background=false
)
```

### Example Invocations

**Step 1 - Create Story:**
```
task(
  category="quick",
  load_skills=["bmad-create-story"],
  description="Create user story {STORY_ID}",
  prompt="Execute /bmad-create-story {STORY_ID} yolo to create story file. Return: 1) Story ID and Title 2) Created files 3) Any issues",
  run_in_background=false
)
```

**Step 2 - ATDD Tests:**
```
task(
  category="quick",
  load_skills=["bmad-testarch-atdd"],
  description="Generate ATDD tests for {STORY_ID}",
  prompt="Execute /bmad-testarch-atdd {STORY_ID} yolo to generate acceptance tests. Return: 1) ATDD checklist 2) Test files created 3) Any issues",
  run_in_background=false
)
```

**Step 3 - Development:**
```
task(
  category="quick",
  load_skills=["bmad-dev-story"],
  description="Develop user story {STORY_ID}",
  prompt="Execute /bmad-dev-story {STORY_ID} yolo to implement story code. Return: 1) Modified files 2) Summary of changes 3) Any issues",
  run_in_background=false
)
```

**Step 4 - Code Review:**
```
task(
  category="quick",
  load_skills=["bmad-code-review"],
  description="Code review for {STORY_ID}",
  prompt="Execute /bmad-code-review {STORY_ID} yolo for adversarial review. Return: 1) Conclusion (pass/needs-fix) 2) Issues by severity 3) Any blocking issues",
  run_in_background=false
)
```

**Step 5 - Trace Coverage:**
```
task(
  category="quick",
  load_skills=["bmad-testarch-trace"],
  description="Trace test coverage for {STORY_ID}",
  prompt="Execute /bmad-testarch-trace {STORY_ID} yolo for traceability matrix. Return: 1) Coverage percentage 2) Gate decision 3) Any gaps",
  run_in_background=false
)
```

### Execution Flow

For each step:
1. Replace `{STORY_ID}` with the actual story number in the prompt
2. Call Task tool with the step's description and prompt
3. Wait for completion and capture result
4. Output progress: `[X/N] Step Name - Status` (where N = total steps parsed from workflow-steps.md)
5. If step fails, stop and report error

## Progress Display

After each step, output progress:

```
Pipeline Progress: [X/N] Step Name (N = total steps in workflow-steps.md)

Step X: <Step Name>
   Result: <Brief result summary>
```

## Error Handling

If any step fails:
1. Stop executing subsequent steps
2. Output error information:
   ```
   Pipeline Failed at Step X: <Step Name>

   Error: <Error details>

   Suggested actions:
   - Check the story file for issues
   - Run the failed step manually: <command>
   - Fix the issue and restart pipeline
   ```
3. Do NOT proceed to next steps

## Post-Pipeline: Update Status

After ALL steps complete successfully:

1. **Update sprint-status.yaml**:
   - Find the story entry
   - Change status from `in-progress` to `done`

2. **Update story document** (if exists):
   - Change `Status:` to `done`
   - Mark all tasks with checkmarks

Output final summary:
```
Pipeline Complete!

Story: {STORY_ID}
Status: done

Steps completed: N/N
Create User Story
Generate ATDD Tests
Development
Code Review
Trace Test Coverage
```

## Configuration

To customize the pipeline workflow, edit:
**references/workflow-steps.md**

Changes supported:
- Add/remove steps
- Modify step commands
- Reorder steps
- Change descriptions
