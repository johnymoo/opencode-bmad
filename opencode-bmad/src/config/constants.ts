export const BMAD_AGENT_NAMES = [
  'bmad-orchestrator',
  'bmad-analyst',
  'bmad-pm',
  'bmad-ux',
  'bmad-architect',
  'bmad-dev',
  'bmad-reviewer',
  'bmad-qa',
  'bmad-sm',
  'bmad-writer',
] as const;

export type BmadAgentName = (typeof BMAD_AGENT_NAMES)[number];

export const BMAD_DEFAULT_MODELS: Record<BmadAgentName, string> = {
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
