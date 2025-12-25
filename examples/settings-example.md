# Example agentSettings Configuration

This directory contains example configuration files for Claude Code.

## settings.example.json

Example configuration for overriding agent model settings:

```json
{
  "agentSettings": {
    "feature-dev:code-architect": "inherit",
    "feature-dev:code-explorer": "inherit",
    "feature-dev:code-reviewer": "inherit",
    "pr-review-toolkit:code-simplifier": "inherit",
    "pr-review-toolkit:comment-analyzer": "inherit",
    "pr-review-toolkit:pr-test-analyzer": "inherit",
    "pr-review-toolkit:type-design-analyzer": "inherit",
    "pr-review-toolkit:silent-failure-hunter": "inherit",
    "pr-review-toolkit:code-reviewer": "inherit",
    "hookify:conversation-analyzer": "inherit",
    "plugin-dev:agent-creator": "opus",
    "plugin-dev:plugin-validator": "sonnet",
    "plugin-dev:skill-reviewer": "sonnet"
  }
}
```

## How to Use

1. **Copy this example to your user settings:**
   ```bash
   # Create .claude directory if it doesn't exist
   mkdir -p ~/.claude
   
   # Copy and modify the example
   cp examples/settings.example.json ~/.claude/settings.json
   ```

2. **Customize for your needs:**
   - Edit `~/.claude/settings.json`
   - Set agents to `inherit` to use your session's model
   - Or specify `sonnet`, `opus`, or `haiku` for specific models
   - Only include agents you want to override (not all agents required)

3. **Verify your configuration:**
   ```bash
   # Run the custom /agents command
   claude
   # Then type: /agents
   ```

## Model Options

- **`inherit`** (recommended) - Agent uses the same model as your current session
  - Benefit: Consistent model across your workflow
  - Use case: When you want all agents to use your preferred model
  
- **`sonnet`** - Claude Sonnet (balanced performance)
  - Benefit: Good balance of capability and cost
  - Use case: General-purpose tasks, code review, analysis
  
- **`opus`** - Claude Opus (most capable)
  - Benefit: Best quality for complex tasks
  - Use case: Architecture design, complex refactoring, critical reviews
  
- **`haiku`** - Claude Haiku (fast and efficient)
  - Benefit: Fast response time, lower cost
  - Use case: Simple tasks, quick checks, formatting

## Common Patterns

### Pattern 1: All agents inherit (simplest)
```json
{
  "agentSettings": {
    "feature-dev:code-architect": "inherit",
    "feature-dev:code-explorer": "inherit",
    "pr-review-toolkit:code-reviewer": "inherit"
  }
}
```
**Use when:** You want consistency and to control model from your session settings.

### Pattern 2: Critical agents use Opus
```json
{
  "agentSettings": {
    "feature-dev:code-architect": "opus",
    "plugin-dev:agent-creator": "opus",
    "pr-review-toolkit:code-reviewer": "sonnet",
    "pr-review-toolkit:code-simplifier": "sonnet"
  }
}
```
**Use when:** You want best quality for architecture/design, balanced for reviews.

### Pattern 3: Mixed based on task complexity
```json
{
  "agentSettings": {
    "feature-dev:code-architect": "opus",
    "feature-dev:code-explorer": "sonnet",
    "pr-review-toolkit:comment-analyzer": "haiku",
    "pr-review-toolkit:type-design-analyzer": "sonnet"
  }
}
```
**Use when:** You want to optimize cost/performance for each agent's specific role.

## Tips

1. **Start with `inherit`** - Simplest approach, then optimize based on usage
2. **Monitor token usage** - Check `~/.claude/stats-cache.json` to see actual usage
3. **Test changes** - Use `/agents` command to verify your settings are applied
4. **Update incrementally** - Only override agents you actively use

## Troubleshooting

**Problem:** `/agents` shows original model, not my override
**Solution:** Check that:
- Your settings file is at `~/.claude/settings.json` (not `.claude/settings.json`)
- The JSON is valid (use a JSON validator)
- The agent key format is `plugin-name:agent-name` (use `/agents` to see available agents)

**Problem:** Changes not taking effect
**Solution:** Changes should be immediate. If not:
- Verify JSON syntax is correct
- Check file permissions on `~/.claude/settings.json`
- Restart Claude Code if needed

For more help, see the [Claude Code documentation](https://docs.claude.com/en/docs/claude-code/overview).
