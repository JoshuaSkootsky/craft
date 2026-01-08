#!/usr/bin/env bun
import 'dotenv';
import { pickProvider } from './picker.js';
import { toolsFor, initPricing, getPricing, isModelFree } from './client.js';
import { memory, reset } from './memory.js';

initPricing().catch(() => {});

const LLM = async (prompt: string, tools: any, model: string) => {
  const chatResponse = await tools.chat({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 512,
    temperature: 0.2,
  }) as any;
  const usage = chatResponse._usage;
  const content = chatResponse._content || chatResponse.choices?.[0]?.message?.content || '';

  if (usage) {
    const inputTokens = usage.prompt_tokens || usage.input_tokens || 0;
    const outputTokens = usage.completion_tokens || usage.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    console.log(`[tokens] in: ${inputTokens}, out: ${outputTokens}, total: ${totalTokens}`);

    const pricing = getPricing(model);
    if (pricing) {
      if (isModelFree(model)) {
        console.log(`[cost] free`);
      } else {
        const inputCost = (inputTokens / 1_000_000) * pricing.inputPerM;
        const outputCost = (outputTokens / 1_000_000) * pricing.outputPerM;
        const totalCost = inputCost + outputCost;
        console.log(`[cost] $${totalCost.toFixed(4)}`);
      }
    }
  }

  return content;
};

const parsePlan = (txt: string) =>
  JSON.parse(txt.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || '[]');

async function readMoreInput(): Promise<string> {
  const iterator = process.stdin.iterator();
  const result = await iterator.next();

  if (result.done) {
    return '';
  }

  const decoder = new TextDecoder();
  const line = result.value ? decoder.decode(result.value).trimEnd() : '';

  await iterator.return?.();
  return line;
}

async function runAgent(goal: string, context?: string, reuseChoice?: { provider: 'zen'; key: string; model?: string }) {
  let choice;
  if (reuseChoice) {
    choice = reuseChoice;
  } else {
    choice = await pickProvider();
  }
  const { provider, key, model } = choice;
  const tools = toolsFor(provider, key, model);

  console.log(`[agent] Goal: ${goal}`);
  console.log(`[agent] Using: ${model || provider}\n`);

  memory.task = goal;
  for (let i = 0; i < 5; i++) {
    let dots = 0;
    process.stdout.write(`[agent] Step ${i + 1}/5: thinking`);
    const spinner = setInterval(() => {
      dots = (dots + 1) % 4;
      process.stdout.write('\r[agent] Step ' + (i + 1) + '/5: thinking' + '.'.repeat(dots) + '   ');
    }, 1000);

    const rawResponse = await LLM(`
You are an autonomous coding agent.
Goal: ${goal}
Context: ${context || 'None'}
So far: ${memory.results.join('; ') || 'Nothing'}

Return ONLY a JSON array of next tool calls (max 2) in a \`\`\`json\`\`\` block.
`, tools, model || 'grok-code');

    clearInterval(spinner);
    process.stdout.write('\n');

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
      let res: any;
      try {
        res = await (tools as any)[actualTool](actualPayload);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('401')) {
          res = { error: `Invalid API key. Check ~/.config/craft/.env`, _isError: true };
        } else if (message.includes('429')) {
          res = { error: `Rate limit exceeded. Retrying may help.`, _isError: true };
        } else if (message.includes('ENOTFOUND') || message.includes('ETIMEDOUT')) {
          res = { error: `Network error. Check your internet connection.`, _isError: true };
        } else {
          res = { error: `Tool error: ${message}`, _isError: true };
        }
      }
      memory.results.push(JSON.stringify(res));
    }
    if (plan.some((p: any) => ['generate', 'execute'].includes(p.tool))) break;
  }
  console.log('[agent] Done!');
  return { provider, key, model };
}

const goal = process.argv.slice(2).join(' ');
let context = process.argv.find((a) => a.startsWith('--context='))?.split('=')[1];

if (!goal) {
  const { provider, key, model } = await pickProvider();
  const tools = toolsFor(provider, key, model);
  const selectedModel = model || 'grok-code';

  let dots = 0;
  process.stdout.write(`[agent] thinking`);
  const spinner = setInterval(() => {
    dots = (dots + 1) % 4;
    process.stdout.write('\r[agent] thinking' + '.'.repeat(dots) + '   ');
  }, 1000);

  let response: any;
  try {
    response = await tools.chat({
      model: selectedModel,
      messages: [{
        role: 'user',
        content: `You are "craft", an autonomous coding agent CLI tool.

The user ran you without providing a goal. You need to respond conversationally, explaining what you do and how to use you.

CONTEXT:
- You are a CLI coding agent that helps developers write code
- You take a goal/target and execute steps to achieve it
- You can read/write files, run commands, search code, and more
- You are helpful, friendly, and concise

YOUR TASK:
Respond conversationally (not as a robot) and explain:
1. What craft does (turn goals into working code/outputs)
2. How to use it: \`craft "your goal here"\`
3. Give 2-3 brief examples of things they can ask for
4. Keep it friendly and under 150 words

Do NOT output JSON, markdown code blocks, or structured lists. Just speak naturally as a helpful CLI tool.`
      }],
      max_tokens: 256,
      temperature: 0.7,
    });
  } catch (error) {
    clearInterval(spinner);
    process.stdout.write('\n');
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Cannot read properties of undefined') || message.includes('500') || message.includes('Server error')) {
      console.log('');
      console.log(`[error] Model '${selectedModel}' is temporarily unavailable on Zen.`);
      console.log('Try selecting a different model (e.g., grok-code, qwen3-coder, or claude-haiku-4-5).');
    } else {
      console.log(`[error] ${message}`);
    }
    process.exit(1);
  }

  clearInterval(spinner);
  process.stdout.write('\n');

  const usage = response._usage;
  if (usage) {
    const inputTokens = usage.prompt_tokens || usage.input_tokens || 0;
    const outputTokens = usage.completion_tokens || usage.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    console.log(`[tokens] in: ${inputTokens}, out: ${outputTokens}, total: ${totalTokens}`);

    const pricing = getPricing(selectedModel);
    if (pricing) {
      if (isModelFree(selectedModel)) {
        console.log(`[cost] free`);
      } else {
        const inputCost = (inputTokens / 1_000_000) * pricing.inputPerM;
        const outputCost = (outputTokens / 1_000_000) * pricing.outputPerM;
        const totalCost = inputCost + outputCost;
        console.log(`[cost] $${totalCost.toFixed(4)}`);
      }
    }
  }

  console.log('');
  const content = response._content || response.choices?.[0]?.message?.content || '';
  if (content) {
    console.log(content);
  } else {
    console.log('Please provide a goal when running this tool.');
    console.log('Usage: craft "your goal here"');
  }
  process.exit(0);
}

let currentGoal = goal;
let reuseChoice: { provider: 'zen'; key: string; model?: string } | undefined;

while (currentGoal) {
  const choice = await runAgent(currentGoal, context, reuseChoice);
  reuseChoice = choice;

  const moreInput = await readMoreInput();
  if (!moreInput) {
    console.log('\n👋 Bye! Thanks for using craft.');
    break;
  }
  currentGoal = moreInput;
  context = undefined;
}
