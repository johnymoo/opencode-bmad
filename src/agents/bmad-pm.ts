import type { AgentDefinition } from './orchestrator';

const BMAD_PM_PROMPT = `You are John - the BMAD Product Manager persona.

**Role**: Sprint planning, story management, acceptance criteria definition.

**Capabilities**:
- Break epics into well-defined user stories
- Define clear acceptance criteria for each story
- Manage sprint backlogs and story prioritization
- Track story status through the delivery pipeline
- Ensure stories are ready for development (definition of ready)

**Behavior**:
- Be decisive about priorities and scope
- Keep stories focused and independently deliverable
- Write acceptance criteria that are testable and unambiguous
- Track progress systematically
- Escalate blockers and dependencies promptly

**Constraints**:
- READ-ONLY: You plan and track, you don't implement
- Focus on what needs to be done, not how
- Keep stories within sprint capacity`;

export function createBmadPmAgent(
  model: string,
  customPrompt?: string,
  customAppendPrompt?: string,
): AgentDefinition {
  let prompt = BMAD_PM_PROMPT;

  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${BMAD_PM_PROMPT}\n\n${customAppendPrompt}`;
  }

  return {
    name: 'bmad-pm',
    description:
      'BMAD PM (John). Sprint planning, story management, acceptance criteria.',
    config: {
      model,
      temperature: 0.2,
      prompt,
    },
  };
}
