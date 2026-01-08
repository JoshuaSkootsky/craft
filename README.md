# craft

An coding agent built with Bun, mostly on top of the Zen/Opencode API.

Give it a goal and watch it write code for you.



## Install

```bash
bun install -g @skootsky/craft
```

## Usage

```bash
# Run the agent with a task
craft "write a CLI timer in Rust"

# With context
craft "add tests" --context=/path/to/project
```

## Setup

1. Copy `.env.example` to `.env`
2. Add at least one API key:
   - `API_KEY_ZEN` for Open Code Zen

3. Set `DEFAULT_PROVIDER` env var to skip provider selection (optional)

Note: Multi model is very tempting, but also makes dialing in quality and taste very hard. I have attempted to split the difference by only doing OpenCode Zen models (which are a good collection!)

You might want to focus on Anthropic or OpenAI models from your favorite providers. That's up to you. Getting this right is an important part of building with AI, they aren't all the same, and not all providers are the same.

## Commands

| Command | Description |
|---------|-------------|
| `craft "<goal>"` | Run the agent with a task |
| `bun run build` | Build for distribution |
| `bun run dev` | Run from source (fast iteration) |

## Project Structure

```
src/
  agent.ts      # Main CLI entry point
  client.ts     # LLM client wrapper
  memory.ts     # Persistent scratchpad for agent state
  picker.ts     # Provider selection
  providers.ts  # Available LLM providers
```

## Features

- **Native Bun parsing**: Uses `process.argv` instead of commander
- **Memory system**: Tracks task, steps, and results across iterations
- **Multi-provider support**: OpenAI, Claude, and Zen integration
- **Cost estimates** for [Zen (Opencode) models](https://opencode.ai/docs/zen/). 
- **Structured logging**: Wide, canonical event logging throughout

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
