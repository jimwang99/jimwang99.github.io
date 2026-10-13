---
title: "DFlash2 + Qwen3-27B + OpenCode: When a Local Coding Agent Became Usable for My Workflow"
date: 2026-10-07
draft: false
---

## TL;DR

DFlash2 + Qwen3-27B + OpenCode made a local coding-agent workflow practical for me: it completed my MNIST task within half an hour. These are observations from my [experiment write-up](https://github.com/jimwang99/jimwang99.github.io/blob/69fd3fb699291587f0d438c534d16b86b659fcb9/content/posts/machine-learning/dflash2-qwen3-27b-opencode.md).

The prompt was simple: write a Python script to train an MNIST model from scratch, using `uv` for dependencies. The agent had to download the dataset, install PyTorch, write and run the script, monitor training, handle errors if they occurred, and report the results.

My earlier attempt used Claude Code + Ollama + Qwen3-27B on the same machine. Generation started near 10 tokens/s and fell to roughly 5 as context grew. It ran for hours and eventually failed overnight because of overheating.

With DFlash2 and speculative decoding in the new stack, I observed roughly 50–60 tokens/s at shorter context and 30+ at long context.

That long-context performance mattered. Code, commands, and tool outputs accumulate during an agent session. Slow generation adds waiting each time the agent inspects a result and decides what to do next.

Tool use also felt smoother. OpenCode’s integration with Qwen3’s tool-calling schema worked well for web search and shell tools, with only one failed attempt. The agent completed the workflow, and I judged the final script’s coding style and quality to be high after manual inspection.

Several parts of the stack changed together. I have not isolated their contributions, and the earlier thermal failure prevents a clean comparison of completion times.

For this MNIST task, the new setup was fast enough to produce useful work during the time I had available. Consistent performance on larger coding tasks is still an open question.

<!--more-->

## Introduction

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
