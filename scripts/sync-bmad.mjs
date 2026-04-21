#!/usr/bin/env node
/**
 * BMAD-to-OpenCode Sync Script
 *
 * This script automates the process of syncing BMAD-METHOD upstream changes
 * into the opencode-bmad plugin. It:
 *
 * 1. Clones (or updates) the BMAD-METHOD repository
 * 2. Discovers all skills from BMAD-METHOD's src/bmm-skills/ directory
 * 3. Generates thin-adapter SKILL.md files for each discovered skill
 * 4. Generates agent factory TypeScript files for each BMAD persona
 * 5. Updates the plugin's constants, config schema, and registration
 * 6. Produces a git diff / PR-ready output
 *
 * Usage:
 *   node scripts/sync-bmad.mjs [options]
 *
 * Options:
 *   --bmad-repo <url>     BMAD-METHOD git URL (default: https://github.com/bmad-code-org/BMAD-METHOD)
 *   --bmad-branch <name>  Branch to checkout (default: main)
 *   --bmad-dir <path>     Local BMAD-METHOD directory (skips clone if provided)
 *   --output-dir <path>   Where to write the generated plugin (default: ./opencode-bmad)
 *   --dry-run             Show what would change without writing files
 *   --check               Exit with error if generated files differ from existing (CI mode)
 *   --agent-models <json> Override default model assignments per agent
 *
 * Examples:
 *   # Full sync from latest upstream
 *   node scripts/sync-bmad.mjs
 *
 *   # Sync from local BMAD-METHOD checkout
 *   node scripts/sync-bmad.mjs --bmad-dir ../BMAD-METHOD
 *
 *   # Preview changes without writing
 *   node scripts/sync-bmad.mjs --dry-run
 *
 *   # CI check — fail if out of sync
 *   node scripts/sync-bmad.mjs --check
 */

import { execSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_BMAD_REPO = 'https://github.com/bmad-code-org/BMAD-METHOD';
const DEFAULT_BMAD_BRANCH = 'main';
const DEFAULT_OUTPUT_DIR = './opencode-bmad';

// Phase directory mapping: BMAD-METHOD phase number → human-readable name
const PHASE_MAP = {
  '1-analysis': 'Phase 1: Analysis',
  '2-plan-workflows': 'Phase 2: Planning',
  '3-solutioning': 'Phase 3: Solutioning',
  '4-implementation': 'Phase 4: Implementation',
};

// Agent persona mapping: skill prefix → agent name, persona name, description
const AGENT_PERSONAS = {
  'bmad-agent-analyst': {
    agent: 'bmad-analyst',
    persona: 'Mary',
    title: 'Business Analyst',
    description: 'Requirements analysis, stakeholder discovery, ambiguity reduction',
  },
  'bmad-agent-pm': {
    agent: 'bmad-pm',
    persona: 'John',
    title: 'Product Manager',
    description: 'Sprint planning, story management, acceptance criteria',
  },
  'bmad-agent-ux-designer': {
    agent: 'bmad-ux',
    persona: 'Sally',
    title: 'UX Designer',
    description: 'UX design, accessibility, task flow quality',
  },
  'bmad-agent-architect': {
    agent: 'bmad-architect',
    persona: 'Winston',
    title: 'System Architect',
    description: 'System architecture, technical design, readiness assessment',
  },
  'bmad-agent-dev': {
    agent: 'bmad-dev',
    persona: 'Amelia',
    title: 'Senior Software Engineer',
    description: 'TDD implementation, bounded task execution',
  },
  'bmad-agent-tech-writer': {
    agent: 'bmad-writer',
    persona: 'Paige',
    title: 'Technical Writer',
    description: 'Technical writing, documentation quality',
  },
};

// Default model assignments (can be overridden via --agent-models)
const DEFAULT_AGENT_MODELS = {
  'bmad-orchestrator': 'openai/gpt-5.4',
  'bmad-analyst': 'openai/gpt-5.4',
  'bmad-pm': 'openai/gpt-5.4',
  'bmad-ux': 'openai/gpt-5.4',
  'bmad-architect': 'openai/gpt-5.4',
  'bmad-dev': 'openai/gpt-5.4',
  'bmad-reviewer': 'anthropic/claude-sonnet-4-20250514',
  'bmad-qa': 'openai/gpt-5.4-mini',
  'bmad-sm': 'openai/gpt-5.4-mini',
  'bmad-writer': 'openai/gpt-5.4',
};

// Delegation rules: which agents each BMAD agent can spawn
const DELEGATION_RULES = {
  'bmad-orchestrator': [
    'bmad-analyst', 'bmad-writer', 'bmad-pm', 'bmad-ux',
    'bmad-architect', 'bmad-dev', 'bmad-reviewer', 'bmad-qa', 'bmad-sm',
    'explorer', 'librarian', 'oracle', 'designer', 'fixer',
  ],
  'bmad-analyst': ['explorer', 'librarian'],
  'bmad-writer': [],
  'bmad-pm': ['explorer', 'librarian'],
  'bmad-ux': [],
  'bmad-architect': ['explorer', 'librarian', 'oracle'],
  'bmad-dev': ['explorer', 'librarian', 'fixer'],
  'bmad-reviewer': ['explorer'],
  'bmad-qa': ['explorer', 'fixer'],
  'bmad-sm': [],
};

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    bmadRepo: DEFAULT_BMAD_REPO,
    bmadBranch: DEFAULT_BMAD_BRANCH,
    bmadDir: null,
    outputDir: DEFAULT_OUTPUT_DIR,
    dryRun: false,
    check: false,
    agentModels: DEFAULT_AGENT_MODELS,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--bmad-repo':
        options.bmadRepo = args[++i];
        break;
      case '--bmad-branch':
        options.bmadBranch = args[++i];
        break;
      case '--bmad-dir':
        options.bmadDir = args[++i];
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--check':
        options.check = true;
        break;
      case '--agent-models':
        options.agentModels = { ...options.agentModels, ...JSON.parse(args[++i]) };
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  return options;
}

function printUsage() {
  console.log(`
BMAD-to-OpenCode Sync Script

Usage: node scripts/sync-bmad.mjs [options]

Options:
  --bmad-repo <url>     BMAD-METHOD git URL (default: ${DEFAULT_BMAD_REPO})
  --bmad-branch <name>  Branch to checkout (default: ${DEFAULT_BMAD_BRANCH})
  --bmad-dir <path>     Local BMAD-METHOD directory (skips clone)
  --output-dir <path>   Output directory (default: ${DEFAULT_OUTPUT_DIR})
  --dry-run             Preview changes without writing
  --check               Fail if generated files differ from existing
  --agent-models <json> Override model assignments (JSON object)
  --help, -h            Show this help

Examples:
  node scripts/sync-bmad.mjs
  node scripts/sync-bmad.mjs --bmad-dir ../BMAD-METHOD --dry-run
  node scripts/sync-bmad.mjs --check
`);
}

// ─── File System Helpers ─────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readDirRecursive(dir, base = dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...readDirRecursive(fullPath, base));
    } else {
      results.push(relative(base, fullPath));
    }
  }
  return results;
}

function writeFile(filePath, content, dryRun) {
  if (dryRun) {
    console.log(`[DRY-RUN] Would write: ${filePath}`);
    return;
  }
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
  console.log(`[WRITE] ${filePath}`);
}

function copyFile(src, dest, dryRun) {
  if (dryRun) {
    console.log(`[DRY-RUN] Would copy: ${src} → ${dest}`);
    return;
  }
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
  console.log(`[COPY] ${src} → ${dest}`);
}

// ─── BMAD Discovery ──────────────────────────────────────────────────────────

function discoverBmadSkills(bmadDir) {
  const skillsDir = join(bmadDir, 'src', 'bmm-skills');
  if (!existsSync(skillsDir)) {
    throw new Error(`BMAD skills directory not found: ${skillsDir}`);
  }

  const skills = [];
  for (const phase of readdirSync(skillsDir)) {
    const phaseDir = join(skillsDir, phase);
    if (!statSync(phaseDir).isDirectory()) continue;

    for (const skillName of readdirSync(phaseDir)) {
      const skillDir = join(phaseDir, skillName);
      if (!statSync(skillDir).isDirectory()) continue;

      const workflowPath = join(skillDir, 'workflow.md');
      const customizePath = join(skillDir, 'customize.toml');
      const hasWorkflow = existsSync(workflowPath);
      const hasCustomize = existsSync(customizePath);

      // Determine agent mapping from skill name
      let agentMapping = null;
      for (const [prefix, mapping] of Object.entries(AGENT_PERSONAS)) {
        if (skillName === prefix || skillName.startsWith(`${prefix}-`)) {
          agentMapping = mapping;
          break;
        }
      }

      skills.push({
        name: skillName,
        phase,
        phaseName: PHASE_MAP[phase] || phase,
        dir: skillDir,
        hasWorkflow,
        hasCustomize,
        agentMapping,
        // Read workflow frontmatter for description
        description: hasWorkflow ? extractDescription(workflowPath) : '',
      });
    }
  }

  return skills;
}

function extractDescription(workflowPath) {
  try {
    const content = readFileSync(workflowPath, 'utf-8');
    // Try YAML frontmatter
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (match) {
      const descMatch = match[1].match(/description:\s*["']?(.+?)["']?\s*$/m);
      if (descMatch) return descMatch[1];
    }
    // Fallback: first non-empty line
    const firstLine = content.split('\n').find((l) => l.trim());
    return firstLine ? firstLine.replace(/^#+\s*/, '').trim() : '';
  } catch {
    return '';
  }
}

// ─── Generators ──────────────────────────────────────────────────────────────

function generateSkillAdapter(skill, pluginName = 'opencode-bmad') {
  const agentName = skill.agentMapping?.agent || 'bmad-orchestrator';
  const persona = skill.agentMapping?.persona || 'BMAD';

  return `---
name: ${skill.name}
description: "${skill.description || `${skill.name} workflow`}"
argument-hint: "<args> (optional, varies by workflow)"
---

# ${skill.name} (${pluginName} Adapter)

You are running as **${agentName}** (${persona} persona) inside ${pluginName}.

## ${pluginName} Adaptations

Before executing the upstream workflow, apply these adaptations:

- **Config path**: Try \`.bmad/config.yaml\` first, fall back to \`_bmad/bmm/config.yaml\`
- **Yolo mode**: If the argument "yolo" is present or this was invoked by the pipeline orchestrator, skip all HALT/checkpoint/user-input steps and auto-continue with sensible defaults
- **Agent mapping**: You are running as ${agentName} (${persona} persona)
- **Tools**: Use OpenCode tool equivalents (file read/write, grep, glob, bash) for all file operations

## Workflow

Load and follow the upstream workflow at:
\`{project-root}/BMAD-METHOD/src/bmm-skills/${skill.phase}/${skill.name}/workflow.md\`

If the upstream file is not found at the primary path, try these alternatives:
1. \`{project-root}/_bmad/bmm/${skill.name}/workflow.md\`
2. \`{project-root}/.bmad/bmm/${skill.name}/workflow.md\`

If no upstream workflow is found, execute the fallback workflow in **references/workflow.md**.
`;
}

function generateAgentFactory(agentKey, model, persona) {
  const promptVar = `${agentKey.replace(/-/g, '_').toUpperCase()}_PROMPT`;

  return `import type { AgentDefinition } from './orchestrator';

const ${promptVar} = \`You are ${persona.persona} - the BMAD ${persona.title} persona.

**Role**: ${persona.description}

**Capabilities**:
- Execute ${persona.title.toLowerCase()} tasks following BMAD methodology
- Use available tools for research, implementation, and verification
- Delegate to appropriate subagents when beneficial

**Behavior**:
- Follow BMAD workflow steps precisely
- Adapt to project conventions and existing patterns
- Report progress and blockers clearly

**Delegation**:
${generateDelegationList(agentKey)}

**Constraints**:
- Stay within scope of assigned tasks
- Use yolo mode when invoked by pipeline orchestrator
- Report completion with summary of outputs\`;

export function create${toPascalCase(agentKey)}Agent(
  model: string,
  customPrompt?: string,
  customAppendPrompt?: string,
): AgentDefinition {
  let prompt = ${promptVar};

  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = \`\${${promptVar}}\\n\\n\${customAppendPrompt}\`;
  }

  return {
    name: '${agentKey}',
    description:
      'BMAD ${persona.title} (${persona.persona}). ${persona.description}',
    config: {
      model,
      temperature: 0.1,
      prompt,
    },
  };
}
`;
}

function generateDelegationList(agentKey) {
  const rules = DELEGATION_RULES[agentKey] || [];
  if (rules.length === 0) return '- No subagent delegation (leaf node)';
  return rules.map((r) => `- Use @${r} for ${r.replace('bmad-', '').replace(/-/g, ' ')} tasks`).join('\n');
}

function toPascalCase(str) {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function generateConstants(agentModels, skills) {
  const agentNames = Object.keys(agentModels);
  const subagentNames = agentNames.filter((a) => a !== 'bmad-orchestrator');

  return `// Auto-generated by sync-bmad.mjs — do not edit manually

export const BMAD_AGENT_NAMES = [
  'bmad-orchestrator',
  ${subagentNames.map((n) => `  '${n}',`).join('\n')}
] as const;

export type BmadAgentName = (typeof BMAD_AGENT_NAMES)[number];

export const BMAD_AGENT_MODELS: Record<BmadAgentName, string> = {
  ${agentNames.map((name) => `'${name}': '${agentModels[name]}',`).join('\n  ')}
};

export const BMAD_DELEGATION_RULES: Record<BmadAgentName, readonly string[]> = {
  ${Object.entries(DELEGATION_RULES)
    .map(([agent, targets]) => `  '${agent}': [${targets.map((t) => `'${t}'`).join(', ')}],`)
    .join('\n  ')}
};

// Skill registry auto-discovered from BMAD-METHOD
export const BMAD_SKILLS = [
  ${skills
    .map(
      (s) => `  {
    name: '${s.name}',
    phase: '${s.phase}',
    description: '${s.description || ''}',
    agent: '${s.agentMapping?.agent || 'bmad-orchestrator'}',
  },`,
    )
    .join('\n  ')}
] as const;
`;
}

function generatePluginIndex(agentModels, skills) {
  const agentImports = Object.keys(agentModels)
    .map((name) => `import { create${toPascalCase(name)}Agent } from './agents/${name}';`)
    .join('\n');

  const agentFactories = Object.keys(agentModels)
    .map((name) => `  '${name}': create${toPascalCase(name)}Agent,`)
    .join('\n');

  return `import type { Plugin } from '@opencode-ai/plugin';
${agentImports}
import { BMAD_AGENT_MODELS, BMAD_SKILLS } from './config/constants';

const OpenCodeBmad: Plugin = async (ctx) => {
  const directory = ctx.directory;

  // Create agent configurations
  const agents: Record<string, unknown> = {};
  for (const [name, model] of Object.entries(BMAD_AGENT_MODELS)) {
    const factory = AGENT_FACTORIES[name as keyof typeof AGENT_FACTORIES];
    if (!factory) continue;
    const agentDef = factory(model);
    agents[name] = {
      model: agentDef.config.model,
      temperature: agentDef.config.temperature,
      prompt: agentDef.config.prompt,
      description: agentDef.description,
      mode: name === 'bmad-orchestrator' ? 'subagent' : 'subagent',
    };
  }

  return {
    name: 'opencode-bmad',
    agent: agents,

    config: async (opencodeConfig) => {
      // Merge BMAD agents into opencode config
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = {};
      }
      for (const [name, config] of Object.entries(agents)) {
        const existing = (opencodeConfig.agent as Record<string, unknown>)[name];
        if (existing) {
          (opencodeConfig.agent as Record<string, unknown>)[name] = {
            ...config,
            ...existing,
          };
        } else {
          (opencodeConfig.agent as Record<string, unknown>)[name] = config;
        }
      }
    },
  };
};

const AGENT_FACTORIES = {
${agentFactories}
} as const;

export default OpenCodeBmad;
export { BMAD_AGENT_MODELS, BMAD_SKILLS };
`;
}

function generatePackageJson(version = '0.1.0') {
  return JSON.stringify(
    {
      name: 'opencode-bmad',
      version,
      description: 'BMAD Multi-Agent plugin for OpenCode — structured software delivery workflows',
      type: 'module',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      files: ['dist', 'src/skills', 'agents', 'README.md'],
      scripts: {
        build: 'bun build src/index.ts --outdir dist --target bun --format esm && tsc --emitDeclarationOnly',
        typecheck: 'tsc --noEmit',
        prepublishOnly: 'bun run build',
        'release:patch': 'npm version patch && git push --follow-tags && npm publish',
        'release:minor': 'npm version minor && git push --follow-tags && npm publish',
        'release:major': 'npm version major && git push --follow-tags && npm publish',
      },
      dependencies: {
        '@opencode-ai/plugin': '^1.2.6',
      },
      devDependencies: {
        typescript: '^5.9.3',
        'bun-types': '1.3.9',
      },
      keywords: ['opencode', 'opencode-plugin', 'bmad', 'multi-agent', 'workflow'],
      license: 'MIT',
      repository: {
        type: 'git',
        url: 'https://github.com/johnymoo/opencode-bmad',
      },
    },
    null,
    2,
  );
}

function generateTsConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        outDir: 'dist',
        declaration: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ['src'],
    },
    null,
    2,
  );
}

function generateReadme(version, skills) {
  const skillTable = skills
    .map((s) => `| \`${s.name}\` | ${s.phaseName} | ${s.agentMapping?.agent || 'bmad-orchestrator'} | ${s.description || ''} |`)
    .join('\n');

  return `# opencode-bmad

BMAD Multi-Agent plugin for OpenCode — structured software delivery workflows with 10 specialized personas.

## Installation

Add to your \`opencode.json\`:

\`\`\`json
{
  "\$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-bmad"]
}
\`\`\`

## Agents

| Agent | Persona | Role |
|-------|---------|------|
| \`@bmad-orchestrator\` | Pipeline Driver | Drives story/epic delivery pipelines |
| \`@bmad-analyst\` | Mary | Requirements analysis, stakeholder discovery |
| \`@bmad-pm\` | John | Sprint planning, story management |
| \`@bmad-ux\` | Sally | UX design, accessibility |
| \`@bmad-architect\` | Winston | System architecture, technical design |
| \`@bmad-dev\` | Amelia | TDD implementation |
| \`@bmad-reviewer\` | — | Adversarial code review |
| \`@bmad-qa\` | — | Test generation, coverage |
| \`@bmad-sm\` | — | Sprint status tracking |
| \`@bmad-writer\` | Paige | Technical writing |

## Skills

| Skill | Phase | Agent | Description |
|-------|-------|-------|-------------|
${skillTable}

## Usage

\`\`\`
@bmad-orchestrator Create a PRD for user authentication
@bmad-orchestrator Run story pipeline for 1-1
@bmad-orchestrator Party mode: design architecture for chat system
\`\`\`

## Configuration

Override models in \`opencode.json\`:

\`\`\`json
{
  "agents": {
    "bmad-architect": { "model": "openai/gpt-5.4" },
    "bmad-dev": { "model": "openai/gpt-5.4" },
    "bmad-reviewer": { "model": "anthropic/claude-sonnet-4-20250514" }
  }
}
\`\`\`

## Syncing from Upstream

To update this plugin when BMAD-METHOD releases changes:

\`\`\`bash
node scripts/sync-bmad.mjs
\`\`\`

This regenerates all skill adapters and agent factories from the latest upstream.

---

*Generated by sync-bmad.mjs v${version}*
`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const options = parseArgs();
  console.log('🔄 BMAD-to-OpenCode Sync');
  console.log(`   BMAD repo: ${options.bmadRepo}`);
  console.log(`   Branch: ${options.bmadBranch}`);
  console.log(`   Output: ${options.outputDir}`);
  if (options.dryRun) console.log('   Mode: DRY RUN (no files written)');
  if (options.check) console.log('   Mode: CHECK (fail if differences)');
  console.log('');

  // 1. Clone or use local BMAD-METHOD
  let bmadDir = options.bmadDir;
  let cleanupDir = null;

  if (!bmadDir) {
    bmadDir = join(process.cwd(), '.tmp-bmad-method');
    cleanupDir = bmadDir;
    if (existsSync(bmadDir)) {
      rmSync(bmadDir, { recursive: true });
    }
    console.log(`📦 Cloning ${options.bmadRepo}...`);
    execSync(
      `git clone --depth 1 --branch ${options.bmadBranch} ${options.bmadRepo} ${bmadDir}`,
      { stdio: 'inherit' },
    );
  } else {
    console.log(`📂 Using local BMAD-METHOD: ${bmadDir}`);
  }

  try {
    // 2. Discover skills
    console.log('\n🔍 Discovering BMAD skills...');
    const skills = discoverBmadSkills(bmadDir);
    console.log(`   Found ${skills.length} skills across ${new Set(skills.map((s) => s.phase)).size} phases`);

    // 3. Generate plugin structure
    const outDir = options.outputDir;
    console.log('\n🏗️  Generating plugin...');

    // src/skills/ — thin adapters
    for (const skill of skills) {
      if (!skill.hasWorkflow) continue; // Skip agent-only directories
      const adapterContent = generateSkillAdapter(skill);
      const adapterPath = join(outDir, 'src', 'skills', skill.name, 'SKILL.md');
      writeFile(adapterPath, adapterContent, options.dryRun);

      // Copy references/ if exists
      const refsDir = join(skill.dir, 'references');
      if (existsSync(refsDir)) {
        for (const refFile of readdirSync(refsDir)) {
          const srcRef = join(refsDir, refFile);
          const destRef = join(outDir, 'src', 'skills', skill.name, 'references', refFile);
          copyFile(srcRef, destRef, options.dryRun);
        }
      }
    }

    // src/agents/ — agent factories
    const discoveredAgents = new Set();
    for (const skill of skills) {
      if (skill.agentMapping) {
        discoveredAgents.add(skill.agentMapping.agent);
      }
    }
    // Always include all known agents
    for (const agentKey of Object.keys(options.agentModels)) {
      const persona = Object.values(AGENT_PERSONAS).find((p) => p.agent === agentKey);
      if (!persona) continue;
      const factoryContent = generateAgentFactory(agentKey, options.agentModels[agentKey], persona);
      const factoryPath = join(outDir, 'src', 'agents', `${agentKey}.ts`);
      writeFile(factoryPath, factoryContent, options.dryRun);
    }

    // src/config/constants.ts
    const constantsContent = generateConstants(options.agentModels, skills);
    writeFile(join(outDir, 'src', 'config', 'constants.ts'), constantsContent, options.dryRun);

    // src/index.ts — plugin entry point
    const indexContent = generatePluginIndex(options.agentModels, skills);
    writeFile(join(outDir, 'src', 'index.ts'), indexContent, options.dryRun);

    // package.json
    writeFile(join(outDir, 'package.json'), generatePackageJson(), options.dryRun);

    // tsconfig.json
    writeFile(join(outDir, 'tsconfig.json'), generateTsConfig(), options.dryRun);

    // README.md
    writeFile(join(outDir, 'README.md'), generateReadme('0.1.0', skills), options.dryRun);

    // .gitignore
    writeFile(
      join(outDir, '.gitignore'),
      `dist/
node_modules/
.bmad/
_bmad/
BMAD-METHOD/
.tmp-bmad-method/
`,
      options.dryRun,
    );

    // 4. Summary
    console.log('\n✅ Sync complete!');
    console.log(`   Skills: ${skills.filter((s) => s.hasWorkflow).length}`);
    console.log(`   Agents: ${Object.keys(options.agentModels).length}`);
    console.log(`   Output: ${outDir}`);

    if (options.check) {
      // TODO: Implement checksum comparison
      console.log('\n⚠️  --check mode: checksum comparison not yet implemented');
    }
  } finally {
    if (cleanupDir && existsSync(cleanupDir)) {
      console.log(`\n🧹 Cleaning up ${cleanupDir}...`);
      rmSync(cleanupDir, { recursive: true });
    }
  }
}

main();
