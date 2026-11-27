---
title: "superpowers 用了一阵之后"
date: 2026-09-25 22:59:32
tags: [OpenCode, AI, 随记]
---

起因是 OpenCode v2 改了 Plugin API，omo 插件失效，而 omo 没有更新。我转去用 superpowers，用了一阵又觉得它太重。

为了搞清楚「重」在哪，我让五个子代理并行逐字审了一遍它自己的技能文档。结果很清楚：15 个技能里 13 个超过它自己定的 500 词目标；`writing-skills` 是目标的 7.6 倍；`brainstorming` + `writing-plans` + `subagent-driven-development` 三段加起来约 59KB，差不多 15k tokens，还不算子代理重读代码库的开销。它一边写着「DRY. YAGNI. TDD.」，一边又要求跨任务重复代码——这类矛盾不止一处。

但我没有直接换掉它。Matt Pocock 那套把流程做成手动触发、可跳过，用起来更轻；两套同时开着反而会重复触发同一类技能，模型挑哪个不可预测。

所以最后的选择是拆开用。在 Flind Player 项目里禁用 11 个重型流程技能，只保留 `verification-before-completion`；再装 Matt 的 10 个技能，其中 `implement`、`handoff`、`retro` 要主动 `@` 才触发。

中间配置错过一次：第一次字段写错，deny 根本没生效，面板里还显示 58 个 skills，追问之后才纠正过来。这件事给我的提醒是：配置完一定要自己验证，不能只听它说「已完成」。

要不要彻底卸载 superpowers，等用两周再说。
