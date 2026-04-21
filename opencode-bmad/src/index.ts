import type { Plugin } from '@opencode-ai/plugin';
import { getBmadAgentConfigs } from './agents';

const OpencodeBmad: Plugin = async () => {
  const agents = getBmadAgentConfigs();

  return {
    name: 'opencode-bmad',
    agent: agents,
    config: async (opencodeConfig: Record<string, unknown>) => {
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = {};
      }

      const existingAgents = opencodeConfig.agent as Record<
        string,
        Record<string, unknown>
      >;

      for (const [name, agentConfig] of Object.entries(agents)) {
        const existing = existingAgents[name];
        existingAgents[name] = existing
          ? { ...agentConfig, ...existing }
          : { ...agentConfig };
      }
    },
  };
};

export default OpencodeBmad;
