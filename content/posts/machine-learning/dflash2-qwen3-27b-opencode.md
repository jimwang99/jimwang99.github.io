---
title: "DFlash2 + Qwen3-27B + OpenCode: When a Local Coding Agent Became Usable for My Workflow"
date: 2026-10-07
draft: false
---

DFlash2 + Qwen3-27B + OpenCode made a local coding-agent workflow practical for me. On my usual MNIST task, the agent prepared the environment, wrote and ran a training script, and reported the results within half an hour.[^observations] I could get useful work out of the local agent during the time I had available.

## The task

I asked the agent to write a Python script to train an MNIST model from scratch, using `uv` to manage Python dependencies. The prompt left it responsible for downloading the dataset, installing PyTorch, writing the script, running and monitoring training, handling errors if they occurred, and reporting the results.

This gives me a practical way to observe the whole workflow. Environment setup, generated code, tool execution, and training all have to work together.

## Generation speed through the session

My previous attempt used Claude Code + Ollama + Qwen3-27B on the same machine. It ran for hours and eventually failed overnight because of overheating. This time, I used DFlash2 and speculative decoding with Qwen3-27B, driven by OpenCode. These were my approximate observations during the sessions:[^observations]

| Setup | Condition | Approximate generation rate |
| --- | --- | --- |
| Claude Code + Ollama + Qwen3-27B | Beginning of the session | 10 tokens/s |
| Claude Code + Ollama + Qwen3-27B | After the context grew | 5 tokens/s |
| DFlash2 + Qwen3-27B + OpenCode | Shorter context | 50–60 tokens/s |
| DFlash2 + Qwen3-27B + OpenCode | Long context | 30+ tokens/s |

Long-context performance matters here because code, commands, tool outputs, and previous decisions accumulate as the agent works. It needs to keep generating while inspecting results and deciding what to do next. Slow generation adds waiting throughout that process.

These observations compare complete setups. I have not measured the separate contributions of DFlash2, speculative decoding, or OpenCode. The earlier run also ended in a thermal failure, so the elapsed times do not establish an end-to-end speedup.

## Tool use and the result

I found OpenCode’s integration with Qwen3’s tool-calling schema smoother in this run. Web search and shell tools worked well, with only one failed attempt.[^observations] They let the agent obtain information, prepare the environment, run training, and inspect the output as it worked through the task.

The agent completed the workflow and reported the results. I manually inspected the final Python script and found its coding style and quality high.

For this MNIST task, faster generation and working tool integration made the local setup useful within the time I had available. Whether it can do that consistently on larger coding tasks remains an open question.

[^observations]: Completion time, generation rates, the thermal failure, and the failed-attempt count come from my [original experiment write-up](https://github.com/jimwang99/jimwang99.github.io/blob/69fd3fb699291587f0d438c534d16b86b659fcb9/content/posts/machine-learning/dflash2-qwen3-27b-opencode.md). They are observations from these runs; I did not isolate the effects of individual components.
