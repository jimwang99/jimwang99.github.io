# 端侧 coding agent 变得可用

这次用 DFlash2 + Qwen3-27B + OpenCode 跑完 MNIST 任务后，我觉得这套本地 coding agent 对类似任务已经实用了。它完成了环境准备、脚本编写、模型训练和结果汇报，整个过程在半小时内结束。这样的等待时间，对我来说已经可以接受。

## 一个完整的 coding-agent 任务

为测试coding agents，我常用的例子是：让 agent 写一个 Python 脚本，从头训练 MNIST 模型，用 `uv` 管理 Python 依赖。

Prompt 很简单，具体执行留给 agent。它需要进行搜索去弄清楚怎么下载数据集、怎么用 `uv` 安装 PyTorch，然后写脚本、运行训练、监控执行。如果遇到错误，还要处理错误，最后汇报结果。

这个任务让我能观察完整的 agent workflow。环境配置、生成的代码、工具调用和训练过程都得顺利运行，任务才能完成。生成代码之后，agent 还需要debug、执行代码、读懂输出，再决定下一步做什么。

## 长 Context (上下文) 情况下，等待仍然可以接受

之前我在同一台机器上用过 Claude Code + Ollama + Qwen3-27B。生成速度开始时大约是 10 tokens/s，随着 context 增长降到约 5 tokens/s。那次跑了几个小时，最后在夜里因为过热而失败。这次换成 OpenCode 驱动 Qwen3-27B，使用 DFlash2 做 speculative decoding。Context 较短时，我观察到的生成速度约为 50–60 tokens/s；context 较长时，仍有 30+ tokens/s。

对这个任务来说，我关心的是 agent 在后面的步骤里还能否保持可接受的速度。代码、命令、工具输出和之前的决策会不断进入 context。Agent 每次查看运行结果、决定下一步时，都还要继续生成。生成慢，等待就会累积到整个任务里。

这些数字是完整配置在实际运行中的粗略观察。我没有分别测量 DFlash2、speculative decoding 和 OpenCode 各自贡献了多少。前一次运行因为过热退出导致没有完成，因此也不能直接用整个任务的耗时计算加速比。

## 顺畅的工具调用让长时任务得以继续

这次我也觉得 OpenCode 与 Qwen3 tool-calling schema 的配合更顺畅。Web search 和 shell 工具都工作得比较好，只有一次失败的尝试。在这个任务里，工具调用贯穿执行过程：查找信息、准备 Python 环境、启动训练、查看输出。Agent 需要通过这些工具执行自己的决定，再根据执行结果继续工作。生成速度改善了等待时间，工具调用则让这些步骤能接着往下走。最后，agent 完成了整个流程并汇报结果。我手动检查了生成的 Python 脚本，觉得代码风格、注释和质量都不错。

我的判断范围就是对于类似 MNIST 训练这样规模的中小型编程任务：这套配置的生成速度和工具配合，让本地 coding agent 能在可接受的时间内完成有用的工作。它能否在更大的 coding 任务中稳定做到这一点，还需要继续观察。
