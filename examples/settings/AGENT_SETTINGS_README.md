# Agent Settings Configuration Guide

This guide explains how to configure agent models using the `agentSettings` field in your `settings.json` file.

## Overview

The `agentSettings` configuration allows you to override the default model used by specific agents from plugins. This is useful when you want certain agents to use different models based on their complexity or cost requirements.

## Configuration Location

Add `agentSettings` to your `settings.json` file in one of these locations:

- **Global (User-level)**: `~/.claude/settings.json`
- **Project-level**: `.claude/settings.json` in your project root

## Configuration Format

```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {
    "plugin-name:agent-name": "model-identifier",
    "another-plugin:agent-name": "inherit"
  }
}
```

### Key Format

The key must be in the format `plugin-name:agent-name`:
- **plugin-name**: The name of the plugin providing the agent (e.g., `debugging-toolkit`, `unit-testing`)
- **agent-name**: The specific agent within that plugin (e.g., `debugger`, `test-automator`)

### Value Options

The value can be either:

1. **`"inherit"`** (Recommended): The agent will use the same model as the parent thread
   - Inherits from the `model` field in settings.json
   - Automatically updates when you change your main model
   - Ensures consistent model usage across your session

2. **Specific Model Name**: Explicitly set a model for the agent
   - `"claude-opus-4-5-20251101"` - Most capable, highest cost
   - `"claude-sonnet-4-20250514"` - Balanced capability and cost
   - `"claude-haiku-4-20250513"` - Fast, cost-effective for simple tasks

## Example Configuration

```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {
    "debugging-toolkit:debugger": "inherit",
    "unit-testing:test-automator": "inherit",
    "documentation-generation:docs-architect": "inherit",
    "code-review:reviewer": "claude-sonnet-4-20250514",
    "quick-tasks:simple-helper": "claude-haiku-4-20250513"
  }
}
```

In this example:
- Most agents inherit the Opus 4.5 model from the main thread
- Code review uses Sonnet (sufficient for review tasks, lower cost)
- Quick tasks use Haiku (fastest, most cost-effective)

## Expected Behavior

### Model Resolution

When using `"inherit"`, the system should:

1. **At Configuration Time**: Recognize that the agent should inherit the parent model
2. **At Display Time** (e.g., `/agents` command): Show the resolved model name (e.g., `claude-opus-4-5-20251101`), not the literal string `"inherit"`
3. **At Runtime** (API calls): Send the resolved model name to the API, never the string `"inherit"`

#### Model Resolution Chain

```
agentSettings["plugin:agent"] → model in settings.json → default model
```

If an agent is not in `agentSettings`, it uses the model defined in its plugin definition.

### The `/agents` Command

The `/agents` command should display:

```
Available Agents:

Plugin: debugging-toolkit
  • debugger
    Model: claude-opus-4-5-20251101 (inherited)
    Description: Debug complex code issues

Plugin: unit-testing
  • test-automator
    Model: claude-opus-4-5-20251101 (inherited)
    Description: Generate and run unit tests

Plugin: code-review
  • reviewer
    Model: claude-sonnet-4-20250514 (custom)
    Description: Review code for issues
```

**Note**: The displayed model should be the **resolved** model, not `"inherit"`.

## Common Use Cases

### Use Inherit for Consistency

```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {
    "my-plugin:important-agent": "inherit",
    "my-plugin:another-agent": "inherit"
  }
}
```

All agents follow your main model choice. Change once, update everywhere.

### Mixed Strategy for Cost Optimization

```json
{
  "model": "claude-opus-4-5-20251101",
  "agentSettings": {
    "complex-analysis:deep-reviewer": "inherit",
    "simple-tasks:formatter": "claude-haiku-4-20250513",
    "medium-tasks:validator": "claude-sonnet-4-20250514"
  }
}
```

- Complex analysis uses Opus (inherited)
- Simple formatting uses Haiku (cost-effective)
- Validation uses Sonnet (balanced)

## Troubleshooting

### Issue: API Returns 404 "model: inherit" Error

**Problem**: The API receives the literal string `"inherit"` instead of a resolved model name.

**Solution**: Ensure your Claude Code version properly resolves `"inherit"` before making API calls. This should happen automatically in the application code.

**Workaround**: Temporarily replace `"inherit"` with explicit model names:
```json
{
  "agentSettings": {
    "my-plugin:my-agent": "claude-opus-4-5-20251101"
  }
}
```

### Issue: `/agents` Command Shows Wrong Model

**Problem**: The `/agents` command displays the plugin's default model instead of the model from `agentSettings`.

**Expected**: Should show the resolved model from `agentSettings`.

**Temporary Verification**: Check your token usage in `~/.claude/stats-cache.json` to confirm agents are actually using the correct model at runtime:

```json
{
  "dailyModelTokens": [
    {
      "date": "2025-12-24",
      "tokensByModel": {
        "claude-opus-4-5-20251101": 1021608
      }
    }
  ]
}
```

If your token stats show the correct model, then `agentSettings` is working at runtime even if the display is incorrect.

## Best Practices

1. **Use `"inherit"` by default**: Keeps configuration simple and consistent
2. **Override selectively**: Only specify explicit models when you have a clear reason (cost, speed, capability)
3. **Document your choices**: Add comments (using `_comment` fields) explaining why certain agents use specific models
4. **Test your configuration**: After changing `agentSettings`, use a test agent call to verify it works
5. **Monitor token usage**: Check `~/.claude/stats-cache.json` to ensure agents are using expected models

## Finding Agent Names

To discover available agents and their names:

1. Run the `/agents` command in Claude Code
2. Check plugin documentation in the `plugins/` directory
3. Look for `.md` files in plugin `agents/` directories
4. The agent name is typically the filename without `.md` extension

## Version Compatibility

- **agentSettings introduced**: Claude Code 1.0.64
- **Dynamic model selection**: Claude Code 2.0.28
- **inherit keyword**: Available since agentSettings introduction

## Related Documentation

- [Plugin System Overview](../README.md)
- [Agent Development Guide](../../plugins/plugin-dev/skills/agent-development/SKILL.md)
- [Settings Configuration](https://docs.claude.com/en/docs/claude-code/settings)

## Reference Implementation

See [agent-settings-example.json](./agent-settings-example.json) for a complete working example.
