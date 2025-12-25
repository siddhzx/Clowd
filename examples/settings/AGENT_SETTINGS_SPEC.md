# Agent Settings Feature Specification

This document specifies the expected behavior of the `agentSettings` feature in Claude Code.

## Feature Overview

The `agentSettings` field in `settings.json` allows users to override the default model for specific agents. This specification defines the correct behavior for:

1. **Model Resolution**: How to resolve the `"inherit"` keyword and explicit model names
2. **UI Display**: How the `/agents` command should display agent information
3. **API Integration**: How resolved models should be passed to the Anthropic API

## 1. Model Resolution Logic

### Resolution Priority Chain

When determining which model an agent should use, follow this priority:

1. **agentSettings override** (if present in settings.json)
2. **Agent's model field** (from plugin agent definition)
3. **Thread's model setting** (from settings.json `model` field)
4. **System default model**

### Resolving "inherit" Keyword

When `agentSettings` contains `"inherit"` as the model value:

```typescript
function resolveAgentModel(
  agentKey: string,
  agentSettings: Record<string, string>,
  threadModel: string,
  agentDefaultModel: string
): string {
  const settingValue = agentSettings[agentKey];
  
  if (settingValue === "inherit") {
    // Return the thread's resolved model
    return threadModel;
  } else if (settingValue) {
    // Return the explicit model from settings
    return settingValue;
  } else {
    // Fall back to agent's default model
    return agentDefaultModel;
  }
}
```

### Example Resolution

Given this configuration:

```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {
    "debugging-toolkit:debugger": "inherit",
    "code-review:reviewer": "claude-sonnet-4-20250514",
    "format-tool:formatter": "inherit"
  }
}
```

Resolution results:

| Agent Key | agentSettings Value | Thread Model | Resolution Result |
|-----------|-------------------|--------------|------------------|
| `debugging-toolkit:debugger` | `"inherit"` | `claude-opus-4-5-20251101` | `claude-opus-4-5-20251101` |
| `code-review:reviewer` | `"claude-sonnet-4-20250514"` | `claude-opus-4-5-20251101` | `claude-sonnet-4-20250514` |
| `format-tool:formatter` | `"inherit"` | `claude-opus-4-5-20251101` | `claude-opus-4-5-20251101` |
| `other-plugin:agent` | (not present) | `claude-opus-4-5-20251101` | (use agent's default from plugin) |

## 2. UI Display Requirements

### The `/agents` Command

The `/agents` command must display the **resolved** model for each agent, not the raw value from `agentSettings`.

#### Expected Output Format

```
Available Agents:

Plugin: debugging-toolkit
  • debugger
    Model: claude-opus-4-5-20251101 (inherited from thread)
    Description: Debug complex code issues
    
  • analyzer  
    Model: claude-sonnet-4-20250514 (plugin default)
    Description: Analyze code patterns

Plugin: code-review
  • reviewer
    Model: claude-sonnet-4-20250514 (custom override)
    Description: Review code for issues
```

#### Display Logic

```typescript
function getAgentDisplayInfo(agent: Agent): AgentDisplayInfo {
  const resolvedModel = resolveAgentModel(
    agent.key,
    userSettings.agentSettings,
    threadModel,
    agent.defaultModel
  );
  
  // Determine the source of the model
  let modelSource: string;
  if (userSettings.agentSettings[agent.key] === "inherit") {
    modelSource = "inherited from thread";
  } else if (userSettings.agentSettings[agent.key]) {
    modelSource = "custom override";
  } else {
    modelSource = "plugin default";
  }
  
  return {
    name: agent.name,
    model: resolvedModel,  // MUST be resolved, never "inherit"
    modelSource: modelSource,
    description: agent.description
  };
}
```

### Requirements

- ✅ **MUST** display the resolved model name (e.g., `claude-opus-4-5-20251101`)
- ✅ **MUST NOT** display the literal string `"inherit"`
- ✅ **SHOULD** indicate the source of the model (inherited, custom, or default)
- ✅ **SHOULD** show which agents are affected by `agentSettings`

## 3. API Integration Requirements

### Sending Model to Anthropic API

When invoking an agent, the **resolved** model name must be sent to the API.

#### Correct API Request

```typescript
async function invokeAgent(agentKey: string, prompt: string) {
  const resolvedModel = resolveAgentModel(
    agentKey,
    userSettings.agentSettings,
    threadModel,
    agent.defaultModel
  );
  
  // Send resolved model to API
  const response = await anthropic.messages.create({
    model: resolvedModel,  // e.g., "claude-opus-4-5-20251101"
    messages: [{ role: "user", content: prompt }],
    // ... other parameters
  });
  
  return response;
}
```

#### Requirements

- ✅ **MUST** resolve `"inherit"` to the actual model name before API call
- ✅ **MUST NOT** send the string `"inherit"` to the API
- ✅ **MUST** resolve model before each agent invocation (to handle dynamic model changes)

### Error Handling

If the API receives `"inherit"` as a model name, it will return:

```json
{
  "type": "error",
  "error": {
    "type": "not_found_error",
    "message": "model: inherit"
  }
}
```

This indicates a bug in the resolution logic.

## 4. Test Cases

### Test Case 1: Basic Inherit Resolution

**Setup:**
```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {
    "test-plugin:test-agent": "inherit"
  }
}
```

**Expected:**
- Resolved model: `"claude-opus-4-5-20251101"`
- `/agents` display: Shows `"claude-opus-4-5-20251101 (inherited from thread)"`
- API call: Sends `"claude-opus-4-5-20251101"`

### Test Case 2: Explicit Model Override

**Setup:**
```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {
    "test-plugin:test-agent": "claude-haiku-4-20250513"
  }
}
```

**Expected:**
- Resolved model: `"claude-haiku-4-20250513"`
- `/agents` display: Shows `"claude-haiku-4-20250513 (custom override)"`
- API call: Sends `"claude-haiku-4-20250513"`

### Test Case 3: No agentSettings Override

**Setup:**
```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {}
}
```

Agent default model in plugin: `"claude-sonnet-4-20250514"`

**Expected:**
- Resolved model: `"claude-sonnet-4-20250514"` (from agent plugin definition)
- `/agents` display: Shows `"claude-sonnet-4-20250514 (plugin default)"`
- API call: Sends `"claude-sonnet-4-20250514"`

### Test Case 4: Dynamic Model Change

**Setup:**
1. Start with `"model": "claude-opus-4-5-20251101"`
2. Agent setting: `"test-plugin:test-agent": "inherit"`
3. Change to `"model": "claude-sonnet-4-20250514"`

**Expected:**
- Before change: Resolves to `"claude-opus-4-5-20251101"`
- After change: Resolves to `"claude-sonnet-4-20250514"`
- No restart required for change to take effect

### Test Case 5: Multiple Agents with Mixed Settings

**Setup:**
```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {
    "plugin1:agent1": "inherit",
    "plugin1:agent2": "claude-sonnet-4-20250514",
    "plugin2:agent3": "inherit"
  }
}
```

**Expected:**
- `plugin1:agent1`: Resolves to `"claude-opus-4-5-20251101"` (inherited)
- `plugin1:agent2`: Resolves to `"claude-sonnet-4-20250514"` (explicit)
- `plugin2:agent3`: Resolves to `"claude-opus-4-5-20251101"` (inherited)
- All three properly displayed in `/agents`
- All three send correct model to API

## 5. Known Issues (As of v2.0.76)

### Issue 1: UI Display Bug

**Problem**: The `/agents` command displays the plugin's default model instead of the resolved model from `agentSettings`.

**Example:**
- Settings: `"debugging-toolkit:debugger": "inherit"`
- Thread model: `"claude-opus-4-5-20251101"`
- Current behavior: `/agents` shows `"claude-sonnet-4-20250514"` (plugin default)
- Expected behavior: `/agents` should show `"claude-opus-4-5-20251101"` (resolved)

**Impact**: Users cannot verify their agentSettings configuration through the UI.

### Issue 2: API Integration Bug

**Problem**: When `agentSettings` contains `"inherit"`, the literal string `"inherit"` is sent to the API instead of the resolved model.

**Example:**
- Settings: `"documentation-generation:docs-architect": "inherit"`
- Thread model: `"claude-opus-4-5-20251101"`
- Current behavior: API receives `"model": "inherit"` → 404 error
- Expected behavior: API should receive `"model": "claude-opus-4-5-20251101"`

**Error Response:**
```json
{
  "type": "error",
  "error": {
    "type": "not_found_error",
    "message": "model: inherit"
  },
  "request_id": "req_011CWSWEuEEYRodbdXrWdsP2"
}
```

**Impact**: All agents configured with `"inherit"` fail to execute.

## 6. Validation Criteria

A correct implementation must:

1. ✅ Resolve `"inherit"` to the thread's model at all access points
2. ✅ Display resolved models in `/agents` command
3. ✅ Send resolved models to the API
4. ✅ Never expose the literal string `"inherit"` to users or the API
5. ✅ Support dynamic model changes without restart
6. ✅ Handle missing `agentSettings` entries gracefully
7. ✅ Preserve backward compatibility with explicit model names

## 7. Implementation Checklist

For developers fixing these issues:

- [ ] Implement `resolveAgentModel()` function with proper resolution chain
- [ ] Update `/agents` command to use resolved models for display
- [ ] Update agent invocation code to resolve models before API calls
- [ ] Add unit tests for all test cases in Section 4
- [ ] Add integration test for API calls with `"inherit"` settings
- [ ] Update user documentation to explain `"inherit"` keyword
- [ ] Add validation to reject invalid model names in `agentSettings`
- [ ] Consider caching resolved models for performance
- [ ] Ensure thread model changes trigger re-resolution

## 8. Reference Files

- Example configuration: [agent-settings-example.json](./agent-settings-example.json)
- User documentation: [AGENT_SETTINGS_README.md](./AGENT_SETTINGS_README.md)
- Plugin agent examples: [../plugins/*/agents/*.md](../../plugins/)
