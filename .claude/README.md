# Claude Code Configuration

This directory contains project-specific Claude Code configuration and commands.

## Commands

### `/agents` - List Available Agents

Displays all available agents from installed plugins with their **resolved model configurations** after applying `agentSettings` overrides from `settings.json`.

**Why this command?**

The built-in `/agents` command in Claude Code displays the original `model:` field from agent definitions but doesn't show the resolved model after applying `agentSettings` overrides. This custom command fixes that issue by:

- Reading agent definitions from all installed plugins
- Applying agentSettings overrides from `~/.claude/settings.json`
- Displaying the final resolved model that's actually used at runtime
- Clearly indicating which agents have overridden settings with bold text and icons

**Usage:**
```
/agents
```

**Example Output:**
```
## Available Agents

### Plugin: feature-dev

| Agent | Model | Color | Description |
|-------|-------|-------|-------------|
| code-architect | **inherit** ⚙️ | green | Designs feature architectures... |
| code-explorer | sonnet | blue | Analyzes codebases... |

**Legend:**
- **Bold model** ⚙️ = Overridden by agentSettings in settings.json
- Normal model = Using plugin default
```

**Configuring Agent Settings:**

To override agent model settings, add an `agentSettings` object to `~/.claude/settings.json`:

```json
{
  "agentSettings": {
    "feature-dev:code-architect": "inherit",
    "feature-dev:code-reviewer": "inherit",
    "pr-review-toolkit:code-simplifier": "opus"
  }
}
```

The format is `"plugin-name:agent-name": "model-value"` where model-value can be:
- `inherit` - Use the same model as the parent session (recommended)
- `sonnet` - Claude Sonnet (balanced performance)
- `opus` - Claude Opus (most capable)
- `haiku` - Claude Haiku (fast and efficient)

**Benefits:**
- ✅ Verify that your agentSettings are configured correctly
- ✅ See which agents are using overridden models vs. defaults
- ✅ Quickly check all available agents across plugins
- ✅ Understand actual runtime model usage for debugging

**Note:** Changes to agentSettings take effect immediately without requiring a restart.

### Other Commands

- `/commit-push-pr` - Commit changes, push, and create a PR
- `/oncall-triage` - Triage oncall issues
- `/dedupe` - Find and close duplicate issues

For more information about Claude Code commands, see the [official documentation](https://docs.claude.com/en/docs/claude-code/overview).
