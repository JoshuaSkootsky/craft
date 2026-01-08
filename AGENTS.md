# Agent Guidelines

## Running Commands

- Use `bun run` for scripts defined in package.json
- Use `bunx` for one-off commands (e.g., `bunx tsx script.ts`)
- Use `bun test` for running tests
- Use `bun build --compile` for creating standalone binaries

## Package Management

**Always use `bun` for package management, never `npm` or `yarn`.**

```bash
# Add dependencies
bun add <package>

# Install all dependencies
bun install

# Remove dependencies
bun remove <package>
```

Using bun ensures:
- Faster installs
- Proper lockfile format
- Bun-native package resolution

## Examples

```bash
# Run the agent
bun run src/agent.ts "write a CLI tool in Rust"

# Run tests
bun test

# Compile to binary
bun build src/agent.ts --compile --outfile zen-agent
```

## Logging

Use wide, canonical event logging throughout the codebase. Log:

- Tool invocations with inputs/outputs
- Agent decisions and reasoning
- Errors with context and stack traces
- Significant state transitions

Logs should be structured, machine-parseable, and include timestamps when possible.

Example:
```typescript
console.log(`[tool:${tool}]`, payload);
console.log(`[agent] Goal: ${goal}, Step: ${i}`);
console.error(`[error]`, { error, context });
```

## Testing

Non-comprehensive smoke tests are encouraged. Focus on:

- Happy path verification
- Critical error handling
- Interface contracts

Avoid over-specifying behavior. Test that things work, not how they work.
