import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfigDir } from './paths';

/**
 * A custom skill bundled in this repository.
 * Unlike npx-installed skills, these are copied from src/skills/ to the OpenCode skills directory
 */
export interface CustomSkill {
  /** Skill name (folder name) */
  name: string;
  /** Human-readable description */
  description: string;
  /** List of agents that should auto-allow this skill */
  allowedAgents: string[];
  /** Source path in this repo (relative to project root) */
  sourcePath: string;
}

/**
 * Registry of custom skills bundled in this repository.
 */
export const CUSTOM_SKILLS: CustomSkill[] = [
  {
    name: 'cartography',
    description: 'Repository understanding and hierarchical codemap generation',
    allowedAgents: ['orchestrator', 'explorer'],
    sourcePath: 'src/skills/cartography',
  },
  {
    name: 'bmad-story-pipeline',
    description: 'BMAD configurable pipeline for single story delivery',
    allowedAgents: ['bmad-orchestrator', 'orchestrator'],
    sourcePath: 'src/skills/bmad-story-pipeline',
  },
  {
    name: 'bmad-story-pipeline-worktree',
    description:
      'BMAD configurable pipeline for story delivery in isolated git worktree',
    allowedAgents: ['bmad-orchestrator', 'orchestrator'],
    sourcePath: 'src/skills/bmad-story-pipeline-worktree',
  },
  {
    name: 'bmad-epic-pipeline',
    description: 'BMAD batch epic delivery - runs story pipelines sequentially',
    allowedAgents: ['bmad-orchestrator', 'orchestrator'],
    sourcePath: 'src/skills/bmad-epic-pipeline',
  },
  // Phase 2: Implementation workflow skills
  {
    name: 'bmad-sprint-planning',
    description: 'Generate sprint status tracking from epics',
    allowedAgents: ['bmad-orchestrator', 'bmad-dev', 'orchestrator'],
    sourcePath: 'src/skills/bmad-sprint-planning',
  },
  {
    name: 'bmad-create-story',
    description:
      'Creates a dedicated story file with all the context needed for implementation',
    allowedAgents: ['bmad-orchestrator', 'bmad-dev', 'bmad-sm', 'orchestrator'],
    sourcePath: 'src/skills/bmad-create-story',
  },
  {
    name: 'bmad-dev-story',
    description:
      'Execute story implementation following a context-filled story spec file',
    allowedAgents: ['bmad-orchestrator', 'bmad-dev', 'orchestrator'],
    sourcePath: 'src/skills/bmad-dev-story',
  },
  {
    name: 'bmad-code-review',
    description:
      'Review code changes adversarially using parallel review layers',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-reviewer',
      'bmad-dev',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-code-review',
  },
  {
    name: 'bmad-testarch-atdd',
    description: 'Generate ATDD test checklist for a story (OMO shim)',
    allowedAgents: ['bmad-orchestrator', 'bmad-qa', 'bmad-dev', 'orchestrator'],
    sourcePath: 'src/skills/bmad-testarch-atdd',
  },
  {
    name: 'bmad-testarch-trace',
    description:
      'Generate traceability matrix mapping requirements to tests (OMO shim)',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-qa',
      'bmad-reviewer',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-testarch-trace',
  },
  {
    name: 'bmad-sprint-status',
    description: 'Summarize sprint status and surface risks',
    allowedAgents: ['bmad-orchestrator', 'bmad-dev', 'orchestrator'],
    sourcePath: 'src/skills/bmad-sprint-status',
  },
  {
    name: 'bmad-correct-course',
    description: 'Manage significant changes during sprint execution',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-dev',
      'bmad-pm',
      'bmad-architect',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-correct-course',
  },
  {
    name: 'bmad-retrospective',
    description: 'Post-epic review to extract lessons and assess success',
    allowedAgents: ['bmad-orchestrator', 'bmad-sm', 'bmad-dev', 'orchestrator'],
    sourcePath: 'src/skills/bmad-retrospective',
  },
  {
    name: 'bmad-qa-generate-e2e-tests',
    description: 'Generate end-to-end automated tests for existing features',
    allowedAgents: ['bmad-orchestrator', 'bmad-qa', 'bmad-dev', 'orchestrator'],
    sourcePath: 'src/skills/bmad-qa-generate-e2e-tests',
  },
  // Phase 3: Planning & Solutioning skills
  {
    name: 'bmad-create-prd',
    description: 'Create a PRD from scratch through collaborative discovery',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-analyst',
      'bmad-pm',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-create-prd',
  },
  {
    name: 'bmad-validate-prd',
    description: 'Validate a PRD against standards and completeness criteria',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-analyst',
      'bmad-pm',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-validate-prd',
  },
  {
    name: 'bmad-create-architecture',
    description:
      'Create architecture solution design decisions for AI agent consistency',
    allowedAgents: ['bmad-orchestrator', 'bmad-architect', 'orchestrator'],
    sourcePath: 'src/skills/bmad-create-architecture',
  },
  {
    name: 'bmad-create-epics-and-stories',
    description:
      'Break requirements into epics and user stories with acceptance criteria',
    allowedAgents: ['bmad-orchestrator', 'bmad-pm', 'orchestrator'],
    sourcePath: 'src/skills/bmad-create-epics-and-stories',
  },
  {
    name: 'bmad-check-implementation-readiness',
    description:
      'Validate PRD, UX, Architecture and Epics specs are complete before implementation',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-architect',
      'bmad-pm',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-check-implementation-readiness',
  },
  {
    name: 'bmad-generate-project-context',
    description:
      'Create project-context.md with critical rules and patterns for AI agents',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-architect',
      'bmad-analyst',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-generate-project-context',
  },
  // Phase 4: Support skills
  {
    name: 'bmad-quick-dev',
    description:
      'Implement any intent or change request following existing architecture',
    allowedAgents: ['bmad-orchestrator', 'bmad-dev', 'orchestrator'],
    sourcePath: 'src/skills/bmad-quick-dev',
  },
  {
    name: 'bmad-checkpoint-preview',
    description: 'LLM-assisted human-in-the-loop review for changes',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-reviewer',
      'bmad-dev',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-checkpoint-preview',
  },
  {
    name: 'bmad-create-ux-design',
    description: 'Plan UX patterns and design specifications',
    allowedAgents: ['bmad-orchestrator', 'bmad-ux', 'orchestrator'],
    sourcePath: 'src/skills/bmad-create-ux-design',
  },
  {
    name: 'bmad-edit-prd',
    description: 'Edit an existing PRD',
    allowedAgents: [
      'bmad-orchestrator',
      'bmad-analyst',
      'bmad-pm',
      'orchestrator',
    ],
    sourcePath: 'src/skills/bmad-edit-prd',
  },
];

/**
 * Get the target directory for custom skills installation.
 */
export function getCustomSkillsDir(): string {
  return join(getConfigDir(), 'skills');
}

/**
 * Recursively copy a directory.
 */
function copyDirRecursive(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      const destDir = dirname(destPath);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install a custom skill by copying from src/skills/ to the OpenCode skills directory
 * @param skill - The custom skill to install
 * @param projectRoot - Root directory of oh-my-opencode-slim project
 * @returns True if installation succeeded, false otherwise
 */
export function installCustomSkill(skill: CustomSkill): boolean {
  try {
    const packageRoot = fileURLToPath(new URL('../..', import.meta.url));
    const sourcePath = join(packageRoot, skill.sourcePath);
    const targetPath = join(getCustomSkillsDir(), skill.name);

    // Validate source exists
    if (!existsSync(sourcePath)) {
      console.error(`Custom skill source not found: ${sourcePath}`);
      return false;
    }

    // Copy skill directory
    copyDirRecursive(sourcePath, targetPath);

    return true;
  } catch (error) {
    console.error(`Failed to install custom skill: ${skill.name}`, error);
    return false;
  }
}
