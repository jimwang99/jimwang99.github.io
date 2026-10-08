---
title: "DFlash2+Qwen3-27B+OpenCode: When a Local Coding Agent Becomes Usable"
date: 2026-10-07
draft: false
---

At roughly 7–8 tokens/s, my usual coding-agent example task took hours. With DFlash2 and speculative decoding in the new stack, it finished within half an hour. OpenCode’s integration with Qwen3’s tool-calling schema also reduced friction: web search and shell tools worked well, with only one failed attempt.

Those two changes made this local setup practical for the task.

## Key points

- **DFlash2 and speculative decoding made the local coding agent fast enough to use.** Generation reached roughly 30+ tokens/s with long context and 50–60 with shorter contexts. The entire task finished within half an hour.
- **OpenCode’s integration with Qwen3’s tool-calling schema reduced friction.** The agent could use web search and shell tools to carry the workflow through to completion.

## Coding-agent example task

My usual coding-agent example task is to write a Python script to train an MNIST model from scratch, using `uv` to manage Python dependencies.

The prompt is simple. It leaves the agent responsible for figuring out how to download the dataset, install PyTorch with `uv`, write the script, run training, monitor execution, handle errors if they occur, and report the results.

That gives me a practical way to observe the whole agent workflow. The environment setup, generated code, tool execution, and training process all have to work together.

## Speed changed the outcome

My previous attempt used Claude Code + Ollama + Qwen3-27B on the same machine. Generation started at about 10 tokens/s and dropped to roughly 5 tokens/s as the context grew. That run failed overnight because of overheating.

This time, I used DFlash2 and speculative decoding with Qwen3-27B, driven by OpenCode. The generation rates I observed were:

| Setup | Condition | Approximate generation rate |
| --- | --- | --- |
| Claude Code + Ollama + Qwen3-27B | Beginning of the session | 10 tokens/s |
| Claude Code + Ollama + Qwen3-27B | After the context grew | 5 tokens/s |
| DFlash2 + Qwen3-27B + OpenCode | Shorter context | 50–60 tokens/s |
| DFlash2 + Qwen3-27B + OpenCode | Long context | 30+ tokens/s |

These are rough observations from the complete setups. I have not measured the separate contributions of each component.

The long-context performance matters for an agent. Code, commands, tool outputs, and previous decisions accumulate during the session. Slow generation adds waiting across successive steps, including later steps when the agent needs to inspect results and decide what to do next.

At roughly 7–8 tokens/s, this process took hours. With the new setup, the MNIST workflow finished within half an hour. That difference changed whether I could get useful work out of the local agent during the time I had available.

## Tool integration helped it finish

I also found OpenCode’s integration with Qwen3’s tool-calling schema less frictional. Web search and shell tools worked well, with only one failed attempt.

For this task, those tools were part of the execution path. The agent needed to obtain information, prepare the Python environment, run the training script, and inspect its output. Working tool calls let it act on its decisions and continue through the job.

It completed the entire process and reported the results. I manually inspected the final Python script and found its coding style and quality high.
