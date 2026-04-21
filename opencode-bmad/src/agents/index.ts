import type { AgentConfig } from '@opencode-ai/sdk/v2';
import {
  BMAD_AGENT_NAMES,
  BMAD_DEFAULT_MODELS,
  type BmadAgentName,
} from '../config/constants';
import { createBmadAnalystAgent } from './bmad-analyst';
import { createBmadArchitectAgent } from './bmad-architect';
import { createBmadDevAgent } from './bmad-dev';
import { createBmadOrchestratorAgent } from './bmad-orchestrator';
import { createBmadPmAgent } from './bmad-pm';
import { createBmadQaAgent } from './bmad-qa';
import { createBmadReviewerAgent } from './bmad-reviewer';
import { createBmadSmAgent } from './bmad-sm';
import { createBmadUxAgent } from './bmad-ux';
import { createBmadWriterAgent } from './bmad-writer';
import type { AgentDefinition } from './orchestrator';

export type { AgentDefinition } from './orchestrator';

type AgentFactory = (
  model: string,
  customPrompt?: string,
  customAppendPrompt?: string,
) => AgentDefinition;

const BMAD_AGENT_FACTORIES: Record<BmadAgentName, AgentFactory> = {
  'bmad-orchestrator': createBmadOrchestratorAgent,
  'bmad-analyst': createBmadAnalystAgent,
  'bmad-pm': createBmadPmAgent,
  'bmad-ux': createBmadUxAgent,
  'bmad-architect': createBmadArchitectAgent,
  'bmad-dev': createBmadDevAgent,
  'bmad-reviewer': createBmadReviewerAgent,
  'bmad-qa': createBmadQaAgent,
  'bmad-sm': createBmadSmAgent,
  'bmad-writer': createBmadWriterAgent,
};

export function createBmadAgents(
  overrides?: Partial<Record<BmadAgentName, string>>,
): AgentDefinition[] {
  return BMAD_AGENT_NAMES.map((name) => {
    const factory = BMAD_AGENT_FACTORIES[name];
    const model = overrides?.[name] ?? BMAD_DEFAULT_MODELS[name];
    return factory(model);
  });
}

export function getBmadAgentConfigs(
  overrides?: Partial<Record<BmadAgentName, string>>,
): Record<BmadAgentName, AgentConfig> {
  const agents = createBmadAgents(overrides);

  return Object.fromEntries(
    agents.map((agent) => [
      agent.name,
      {
        ...agent.config,
        description: agent.description,
        mode: 'subagent',
      },
    ]),
  ) as Record<BmadAgentName, AgentConfig>;
}
