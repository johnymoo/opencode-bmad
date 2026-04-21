---
name: bmad-story-pipeline-worktree
description: Run configurable BMAD pipeline for story delivery in isolated git worktree
argument-hint: "<story-number> e.g., 1-1 or 2-3 (optional, auto-selects if omitted)"
---

# BMAD Story Pipeline (Worktree Edition)

Complete the delivery pipeline for story `{ARGUMENT}` in an isolated git worktree.
Each story gets its own branch and worktree, merged only after tests pass and
review approves.

## Pre-step: Determine Story Number

If `{ARGUMENT}` is empty or not provided:

1. Read `_bmad-output/implementation-artifacts/sprint-status.yaml` (or `docs/sprint/sprint-status.yaml`) to find stories
2. Find the first story with status "todo" or "in-progress"
3. Use that story number as `{STORY_ID}`
4. If no story found, ask user to specify story number

## Execution Strategy

1. **Phase 1**: Create isolated git worktree for this story
2. **Phase 2**: Read workflow steps from references/workflow-steps.md and execute sequentially
3. **Phase 3**: Merge branch back to main (only if tests pass and review approves)
4. **Phase 4**: Update sprint status

## Phase 1: Create Worktree

```
1. Create feature branch: feature/story-{STORY_ID}
2. Create git worktree at: .worktrees/story-{STORY_ID}/
3. Switch to worktree directory for all pipeline steps
```

## Phase 2: Execute Pipeline Steps

Read and execute steps from **references/workflow-steps.md**.

For each step, use Task tool:

```
task(
  category="quick",
  load_skills=["bmad-create-story", "bmad-dev-story", "bmad-code-review", "bmad-testarch-atdd", "bmad-testarch-trace"],
  description="<Step description> for {STORY_ID} in worktree",
  prompt="Working in worktree at .worktrees/story-{STORY_ID}/
Execute the command: <COMMAND_WITH_STORY_ID> yolo
Return: 1) Step completion status 2) Key outputs 3) Any issues",
  run_in_background=false
)
```

### Step Execution Flow

For each step:
1. Replace `{STORY_ID}` with the actual story number
2. Ensure all operations happen in the worktree directory
3. Call Task tool with step description and prompt
4. Wait for completion and capture result
5. Output progress: `[X/N] Step Name - PASS/FAIL`
6. If step fails, preserve worktree and STOP

## Phase 3: Merge Branch

After all pipeline steps complete successfully:

### Quality Gates

Before merging, verify:
1. **Tests pass**: Run test suite in worktree
2. **Code review approved**: No CRITICAL or HIGH issues from bmad-reviewer
3. **No uncommitted changes**: All changes committed to feature branch

### Merge Process

```
1. Run tests in worktree: bun test (or project-specific test command)
2. If tests fail: STOP, keep worktree for manual fix
3. If tests pass and review approved:
   a. cd to main repo directory
   b. git merge feature/story-{STORY_ID}
   c. Remove worktree: git worktree remove .worktrees/story-{STORY_ID}
4. If merge conflicts: STOP, report conflicts for manual resolution
```

### Conditional Merge

- **Merge**: Tests pass + no CRITICAL/HIGH issues
- **Hold**: Tests pass but HIGH issues found
- **Block**: Tests fail or CRITICAL issues found

## Phase 4: Update Status

After successful merge:
1. Update sprint-status.yaml: story status -> done
2. Update story document: Status: done, Tasks: checked
3. Clean up: remove worktree directory

## Error Handling

If any step fails:
1. Stop subsequent steps
2. Preserve worktree (do NOT remove it)
3. Report failure with details:
   ```
   Pipeline Failed at Step X: <Step Name>

   Worktree preserved at: .worktrees/story-{STORY_ID}/
   Branch: feature/story-{STORY_ID}

   Suggested actions:
   - cd .worktrees/story-{STORY_ID}/ and fix issues
   - Commit fix and re-run pipeline (auto-detects progress)
   - Or manually merge: git merge feature/story-{STORY_ID}
   ```

## Resume Support

If re-run after a failure:
1. Check if worktree already exists for this story
2. If yes, resume from the failed step (not from beginning)
3. Completed steps are skipped based on sprint-status

## Progress Display

```
Story [{STORY_ID}] Pipeline Progress:

Phase 1: Worktree Setup - DONE
Phase 2: Pipeline Steps
  [1/N] Create Story - PASS
  [2/N] ATDD Tests - PASS
  [3/N] Development - PASS
  [4/N] Code Review - PASS
  [5/N] Trace Coverage - PASS
Phase 3: Merge - DONE
Phase 4: Status Update - DONE

Story {STORY_ID}: COMPLETE
```

## Configuration

Pipeline steps are configured in **references/workflow-steps.md**.
Both bmad-story-pipeline and this skill start with identical default step definitions,
but they are separate files — changes to one do not affect the other.
