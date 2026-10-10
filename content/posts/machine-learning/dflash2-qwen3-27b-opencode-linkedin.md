DFlash2 + Qwen3-27B + OpenCode made a local coding-agent workflow practical for me: it completed my MNIST task within half an hour. These are observations from my [experiment write-up](https://github.com/jimwang99/jimwang99.github.io/blob/69fd3fb699291587f0d438c534d16b86b659fcb9/content/posts/machine-learning/dflash2-qwen3-27b-opencode.md).

The prompt was simple: write a Python script to train an MNIST model from scratch, using `uv` for dependencies. The agent had to download the dataset, install PyTorch, write and run the script, monitor training, handle errors if they occurred, and report the results.

My earlier attempt used Claude Code + Ollama + Qwen3-27B on the same machine. Generation started near 10 tokens/s and fell to roughly 5 as context grew. It ran for hours and eventually failed overnight because of overheating.

With DFlash2 and speculative decoding in the new stack, I observed roughly 50–60 tokens/s at shorter context and 30+ at long context.

That long-context performance mattered. Code, commands, and tool outputs accumulate during an agent session. Slow generation adds waiting each time the agent inspects a result and decides what to do next.

Tool use also felt smoother. OpenCode’s integration with Qwen3’s tool-calling schema worked well for web search and shell tools, with only one failed attempt. The agent completed the workflow, and I judged the final script’s coding style and quality to be high after manual inspection.

Several parts of the stack changed together. I have not isolated their contributions, and the earlier thermal failure prevents a clean comparison of completion times.

For this MNIST task, the new setup was fast enough to produce useful work during the time I had available. Consistent performance on larger coding tasks is still an open question.
