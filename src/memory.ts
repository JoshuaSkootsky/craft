// Persistent scratchpad for the agent
export const memory = {
  task:    '',
  steps:   [] as string[],
  results: [] as string[],
};

export function reset() {
  memory.task = '';
  memory.steps.length = 0;
  memory.results.length = 0;
}
