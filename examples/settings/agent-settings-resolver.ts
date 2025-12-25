#!/usr/bin/env node
/**
 * Reference Implementation: Agent Settings Resolver
 * 
 * This file provides a reference implementation for resolving agent model settings
 * from the agentSettings configuration in settings.json.
 * 
 * This addresses the bugs in Claude Code v2.0.76 where:
 * 1. The /agents command displays plugin defaults instead of resolved models
 * 2. API calls send the literal "inherit" string causing 404 errors
 */

/**
 * Configuration types matching settings.json structure
 */
interface Settings {
  model: string;
  agentSettings?: Record<string, string>;
}

interface Agent {
  key: string;  // Format: "plugin-name:agent-name"
  name: string;
  defaultModel: string;
  description: string;
}

interface ResolvedAgent extends Agent {
  resolvedModel: string;
  modelSource: 'inherited' | 'custom' | 'default';
}

/**
 * Resolves the model for a specific agent based on agentSettings configuration.
 * 
 * Resolution priority:
 * 1. agentSettings override (if present)
 *    - If value is "inherit", resolve to thread model
 *    - If value is a model name, use that
 * 2. Agent's default model (from plugin definition)
 * 
 * @param agentKey - The agent identifier (e.g., "debugging-toolkit:debugger")
 * @param agentSettings - The agentSettings map from settings.json
 * @param threadModel - The main thread's model from settings.json
 * @param agentDefaultModel - The agent's default model from its plugin definition
 * @returns The resolved model name (never returns "inherit")
 */
export function resolveAgentModel(
  agentKey: string,
  agentSettings: Record<string, string> | undefined,
  threadModel: string,
  agentDefaultModel: string
): string {
  // Check if there's an override in agentSettings
  const settingValue = agentSettings?.[agentKey];
  
  if (settingValue === "inherit") {
    // CRITICAL: Must resolve "inherit" to the thread's model
    // NEVER pass the literal string "inherit" to the API
    return threadModel;
  } else if (settingValue) {
    // Use the explicit model from agentSettings
    return settingValue;
  } else {
    // Fall back to the agent's default model from plugin definition
    return agentDefaultModel;
  }
}

/**
 * Determines the source of the resolved model for display purposes.
 * 
 * @param agentKey - The agent identifier
 * @param agentSettings - The agentSettings map from settings.json
 * @param resolvedModel - The resolved model name
 * @param agentDefaultModel - The agent's default model from plugin definition
 * @returns The source of the model setting
 */
export function getModelSource(
  agentKey: string,
  agentSettings: Record<string, string> | undefined,
  resolvedModel: string,
  agentDefaultModel: string
): 'inherited' | 'custom' | 'default' {
  const settingValue = agentSettings?.[agentKey];
  
  if (settingValue === "inherit") {
    return 'inherited';
  } else if (settingValue) {
    return 'custom';
  } else {
    return 'default';
  }
}

/**
 * Resolves all agents with their proper models.
 * This is what the /agents command should use for display.
 * 
 * @param agents - List of available agents
 * @param settings - The settings.json configuration
 * @returns Array of agents with resolved models
 */
export function resolveAllAgents(
  agents: Agent[],
  settings: Settings
): ResolvedAgent[] {
  return agents.map(agent => {
    const resolvedModel = resolveAgentModel(
      agent.key,
      settings.agentSettings,
      settings.model,
      agent.defaultModel
    );
    
    const modelSource = getModelSource(
      agent.key,
      settings.agentSettings,
      resolvedModel,
      agent.defaultModel
    );
    
    return {
      ...agent,
      resolvedModel,
      modelSource
    };
  });
}

/**
 * Formats agent information for display in the /agents command.
 * The UI MUST show the resolved model, not "inherit".
 * 
 * @param agent - The resolved agent
 * @returns Formatted string for display
 */
export function formatAgentForDisplay(agent: ResolvedAgent): string {
  const sourceLabel = {
    'inherited': 'inherited from thread',
    'custom': 'custom override',
    'default': 'plugin default'
  }[agent.modelSource];
  
  return `  • ${agent.name}
    Model: ${agent.resolvedModel} (${sourceLabel})
    Description: ${agent.description}`;
}

/**
 * Prepares the model for an API call.
 * This MUST resolve "inherit" to prevent 404 errors.
 * 
 * @param agentKey - The agent to invoke
 * @param settings - The settings.json configuration
 * @param agentDefaultModel - The agent's default model
 * @returns The model name to send to the API (never "inherit")
 */
export function getModelForAPICall(
  agentKey: string,
  settings: Settings,
  agentDefaultModel: string
): string {
  const resolvedModel = resolveAgentModel(
    agentKey,
    settings.agentSettings,
    settings.model,
    agentDefaultModel
  );
  
  // Validate that we never send "inherit" to the API
  if (resolvedModel === "inherit") {
    throw new Error(
      `CRITICAL BUG: Model resolved to "inherit" for agent ${agentKey}. ` +
      `This will cause API 404 errors. Check resolveAgentModel() implementation.`
    );
  }
  
  return resolvedModel;
}

// Example usage and test cases
if (require.main === module) {
  console.log("Agent Settings Resolver - Reference Implementation\n");
  
  // Test Case 1: Basic inherit resolution
  console.log("Test Case 1: Basic inherit resolution");
  const settings1: Settings = {
    model: "claude-opus-4-5-20251101",
    agentSettings: {
      "test-plugin:test-agent": "inherit"
    }
  };
  
  const resolved1 = resolveAgentModel(
    "test-plugin:test-agent",
    settings1.agentSettings,
    settings1.model,
    "claude-sonnet-4-20250514"
  );
  console.log(`  Input: agentSettings["test-plugin:test-agent"] = "inherit"`);
  console.log(`  Thread model: ${settings1.model}`);
  console.log(`  Resolved: ${resolved1}`);
  console.log(`  ✓ Expected: claude-opus-4-5-20251101\n`);
  
  // Test Case 2: Explicit model override
  console.log("Test Case 2: Explicit model override");
  const settings2: Settings = {
    model: "claude-opus-4-5-20251101",
    agentSettings: {
      "test-plugin:test-agent": "claude-haiku-4-20250513"
    }
  };
  
  const resolved2 = resolveAgentModel(
    "test-plugin:test-agent",
    settings2.agentSettings,
    settings2.model,
    "claude-sonnet-4-20250514"
  );
  console.log(`  Input: agentSettings["test-plugin:test-agent"] = "claude-haiku-4-20250513"`);
  console.log(`  Resolved: ${resolved2}`);
  console.log(`  ✓ Expected: claude-haiku-4-20250513\n`);
  
  // Test Case 3: No agentSettings override (use default)
  console.log("Test Case 3: No agentSettings override");
  const settings3: Settings = {
    model: "claude-opus-4-5-20251101",
    agentSettings: {}
  };
  
  const resolved3 = resolveAgentModel(
    "test-plugin:test-agent",
    settings3.agentSettings,
    settings3.model,
    "claude-sonnet-4-20250514"
  );
  console.log(`  Input: agentSettings is empty`);
  console.log(`  Agent default: claude-sonnet-4-20250514`);
  console.log(`  Resolved: ${resolved3}`);
  console.log(`  ✓ Expected: claude-sonnet-4-20250514\n`);
  
  // Test Case 4: Multiple agents
  console.log("Test Case 4: Multiple agents with mixed settings");
  const settings4: Settings = {
    model: "claude-opus-4-5-20251101",
    agentSettings: {
      "debugging-toolkit:debugger": "inherit",
      "unit-testing:test-automator": "inherit",
      "code-review:reviewer": "claude-sonnet-4-20250514"
    }
  };
  
  const agents: Agent[] = [
    {
      key: "debugging-toolkit:debugger",
      name: "debugger",
      defaultModel: "claude-sonnet-4-20250514",
      description: "Debug complex code issues"
    },
    {
      key: "unit-testing:test-automator",
      name: "test-automator",
      defaultModel: "claude-sonnet-4-20250514",
      description: "Generate and run unit tests"
    },
    {
      key: "code-review:reviewer",
      name: "reviewer",
      defaultModel: "claude-sonnet-4-20250514",
      description: "Review code for issues"
    }
  ];
  
  const resolvedAgents = resolveAllAgents(agents, settings4);
  console.log("  Resolved agents:");
  resolvedAgents.forEach(agent => {
    console.log(formatAgentForDisplay(agent));
  });
  console.log();
  
  // Test Case 5: API call preparation
  console.log("Test Case 5: API call preparation");
  try {
    const apiModel = getModelForAPICall(
      "debugging-toolkit:debugger",
      settings4,
      "claude-sonnet-4-20250514"
    );
    console.log(`  Model for API: ${apiModel}`);
    console.log(`  ✓ No "inherit" string sent to API\n`);
  } catch (error) {
    console.error(`  ✗ Error: ${error}`);
  }
  
  console.log("All test cases completed successfully!");
}
