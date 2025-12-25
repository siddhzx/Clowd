---
description: List all available agents with their resolved model configurations
allowed-tools: ["Glob", "Read"]
---

# List Available Agents

Display all available agents from installed plugins, showing their resolved model configurations after applying agentSettings overrides from settings.json.

## Steps

1. **Find all agent definition files** using Glob:
   ```
   pattern: "**/agents/*.md"
   ```
   This will search recursively for all agent files in plugins directories.

2. **Load agentSettings from settings.json**:
   - Use Read to load `~/.claude/settings.json`
   - Parse the `agentSettings` object if it exists
   - agentSettings format: `{ "plugin-name:agent-name": "model-value", ... }`

3. **For each agent file found**:
   - Use Read to load the agent file
   - Parse frontmatter to extract:
     - `name`: Agent identifier
     - `model`: Original model value
     - `description`: Agent description (first line only)
     - `color`: Visual color identifier
   - Determine the plugin name from the file path
   - Construct the agent key as `plugin-name:agent-name`
   - Check if agentSettings has an override for this agent
   - Use the override model if present, otherwise use the original model

4. **Group agents by plugin** and display in a formatted table:

```
## Available Agents

### Plugin: feature-dev

| Agent | Model | Color | Description |
|-------|-------|-------|-------------|
| code-architect | **inherit** ⚙️ | green | Designs feature architectures by analyzing existing... |
| code-explorer | sonnet | blue | Analyzes codebases to extract patterns... |
| code-reviewer | **inherit** ⚙️ | cyan | Reviews code for quality and best practices... |

### Plugin: pr-review-toolkit

| Agent | Model | Color | Description |
|-------|-------|-------|-------------|
| code-simplifier | **inherit** ⚙️ | magenta | Simplifies complex code while maintaining... |
| comment-analyzer | sonnet | blue | Analyzes code comments for quality... |

**Legend:**
- **Bold model** ⚙️ = Overridden by agentSettings in settings.json
- Normal model = Using plugin default

**Total**: 5 agents (3 with agentSettings overrides)
```

5. **Add helpful footer**:

```
---

### About agentSettings

Agent model settings can be overridden in `~/.claude/settings.json`:

\```json
{
  "agentSettings": {
    "plugin-name:agent-name": "inherit",
    "another-plugin:another-agent": "opus"
  }
}
\```

**Available models:**
- `inherit` - Use the same model as the parent session
- `sonnet` - Claude Sonnet (balanced performance)
- `opus` - Claude Opus (most capable)
- `haiku` - Claude Haiku (fast and efficient)

Changes to agentSettings take effect immediately.
```

## If No Agents Found

If no agent files exist:

```
## No Agents Available

No plugin agents are currently installed.

To install plugins with agents:
1. Use `/plugins discover` to browse available plugins
2. Many plugins in the marketplace include specialized agents
3. See the [plugins documentation](https://docs.claude.com/en/docs/claude-code/plugins) for more information

Example plugins with agents:
- **feature-dev**: Architecture, exploration, and review agents
- **pr-review-toolkit**: Comprehensive PR review agents
- **code-review**: Automated code review agents
```

## Error Handling

- If `~/.claude/settings.json` doesn't exist or can't be read, continue without agentSettings
- If an agent file has malformed frontmatter, skip it and note the error
- If Glob or Read operations fail, display a helpful error message

## Notes

- Agent descriptions should be truncated to ~50 characters with "..." if longer
- Plugin names are derived from the file path (e.g., `plugins/feature-dev/agents/` → `feature-dev`)
- The resolved model is what's actually used at runtime, not just the declared model
