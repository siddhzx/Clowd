# Claude Code Examples

This directory contains examples and reference implementations for Claude Code features.

## Contents

### [Settings Examples](./settings/)

Configuration examples for Claude Code settings.json files:

- **[agent-settings-example.json](./settings/agent-settings-example.json)**: Complete example showing how to configure agent model overrides using `agentSettings`
- **[agent-settings-resolver.ts](./settings/agent-settings-resolver.ts)**: TypeScript reference implementation showing proper model resolution logic with executable test cases
- **[AGENT_SETTINGS_README.md](./settings/AGENT_SETTINGS_README.md)**: User-friendly guide to configuring agent settings, including the `"inherit"` keyword
- **[AGENT_SETTINGS_SPEC.md](./settings/AGENT_SETTINGS_SPEC.md)**: Technical specification for the `agentSettings` feature, including resolution logic, UI requirements, and test cases

### [Hooks](./hooks/)

Examples of custom hooks for Claude Code.

## Using These Examples

### Agent Settings Configuration

To use agent model overrides:

1. Copy `settings/agent-settings-example.json` content to your `~/.claude/settings.json` or `.claude/settings.json`
2. Modify the `agentSettings` section to specify models for your installed agents
3. Use `"inherit"` to have agents use your main thread's model
4. Use explicit model names (e.g., `"claude-haiku-4-20250513"`) for specific requirements

See the [Agent Settings README](./settings/AGENT_SETTINGS_README.md) for detailed documentation.

### Running the Reference Implementation

To run the TypeScript reference implementation and see test cases:

```bash
cd examples/settings
npx tsx agent-settings-resolver.ts
```

This will execute all test cases and demonstrate proper model resolution.

### Finding Agent Names

To discover which agents are available to configure:

1. Run `/agents` in Claude Code to see all installed agents
2. Check plugin documentation in the `plugins/` directory
3. Agent names are typically in the format: `plugin-name:agent-name`

## Contributing Examples

When adding new examples:

1. Create a descriptive filename
2. Include inline comments explaining key concepts
3. Add a reference in this README
4. Follow the existing structure and conventions

## Related Documentation

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/overview)
- [Plugin System](../plugins/README.md)
- [Agent Development Guide](../plugins/plugin-dev/skills/agent-development/SKILL.md)
