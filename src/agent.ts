#!/usr/bin/env bun
import 'dotenv';
import { pickProvider } from './picker.js';
import { toolsFor } from './client.js';
import { memory, reset } from './memory.js';

const LLM = async (prompt: string, tools: any, model: string) => {
  const { choices } = await tools.chat({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 512,
    temperature: 0.2,
  });
  return choices[0]?.message?.content || '';
};

const parsePlan = (txt: string) =>
  JSON.parse(txt.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || '[]');

async function runAgent(goal: string, context?: string) {
  const { provider, key, model } = await pickProvider();
  const tools = toolsFor(provider, key, model);

  memory.task = goal;
  for (let i = 0; i < 5; i++) {
    const rawResponse = await LLM(`
You are an autonomous coding agent.
Goal: ${goal}
Context: ${context || 'None'}
So far: ${memory.results.join('; ') || 'Nothing'}

Return ONLY a JSON array of next tool calls (max 2) in a \`\`\`json\`\`\` block.
`, tools, model || 'grok-code');
    console.log('[llm raw]', rawResponse);
    const plan = parsePlan(rawResponse);
    for (const item of plan) {
      const { tool, payload, args, tool_name, parameters, name, arguments: argumentsObj } = item;
      const actualTool = tool || tool_name || name || '';
      let actualPayload: any;
      
      if (payload) {
        actualPayload = payload;
      } else if (args) {
        actualPayload = args;
      } else if (parameters) {
        actualPayload = parameters;
      } else if (argumentsObj) {
        actualPayload = argumentsObj;
      } else {
        const { tool: _, tool_name: __, name: ___, arguments: ____, ...rest } = item;
        actualPayload = rest;
      }
      
      console.log(`[${actualTool}]`, actualPayload);
      const res = await (tools as any)[actualTool](actualPayload);
      memory.results.push(JSON.stringify(res));
    }
    if (plan.some((p: any) => ['generate', 'execute'].includes(p.tool))) break;
  }
  console.log('Agent finished. Memory:', memory);
}

const goal = process.argv[2];
const context = process.argv.find((a) => a.startsWith('--context='))?.split('=')[1];

if (!goal) {
  console.error('Usage: craft "<goal>" [--context=<context>]');
  process.exit(1);
}

await runAgent(goal, context);
