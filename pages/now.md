---
title: Now
description: What I'm working on right now, plus a log of what came before.
updated: 2026-06-10
toc: false
---

What I'm working on this month. Inspired by Derek Sivers' [/now page](https://nownownow.com/about) convention, with a twist: when this page gets updated, the old snapshot moves down into the [log](#log), so you can scroll back through time.

## Working on

Two Kaggle competitions, two open source projects, and a lot of GPUs.

### [NVIDIA Nemotron Model Reasoning Challenge](https://www.kaggle.com/competitions/nvidia-nemotron-model-reasoning-challenge)

Finetuning a 30B hybrid Mamba/MoE model with LoRA to solve synthetic reasoning puzzles: bit manipulation, ciphers, cryptarithms. It's a strange and humbling leaderboard. Hundreds of teams are piled up at 0.86 because the public recipe is that good, and the winner sits at 0.89. I'm running a three-GPU fleet around the clock with an AI agent driving the experiment queue: reverse-engineering puzzle generators, building deterministic chain-of-thought traces the model can actually execute within a token budget, and trying to make RL work where supervised finetuning has clearly hit a wall.

### [Orbit Wars](https://www.kaggle.com/competitions/orbit-wars)

Competing with self-play RL. Currently being humbled: after ~100M training samples my agent just scored its first wins against the tutorial bot. The top of the leaderboard is very far away.

### [Forgewright](https://github.com/keithtyser/forgewright) and [Model Forge](https://github.com/keithtyser/model-forge)

Obsessed with two things: improving the best open source models to make them even better, faster, and uncensored, and streamlining the post-training process to make it easier. Model Forge is the post-training workbench; Forgewright is the multi-agent swarm that runs it autonomously behind one conversational CLI.

## Reading

- **The Alignment Problem**, Brian Christian

## Thinking about

How to detect agentic AI activity, from a cybersecurity perspective. AI is increasing the speed, sophistication, and persistence of cyber attacks. Part of being able to defend against that is being able to detect malicious agentic AI.

## Log

Past snapshots of this page, newest first.

### Apr 18, 2026

Three Kaggle competitions in parallel: the **Nemotron Model Reasoning Challenge** (fine-tuning Nemotron-3-Nano-30B through Tinker, on the DGX Spark), **Orbit Wars** (bot v23b climbing the public leaderboard from 786 to 968), and **[Neurogolf 2026](https://www.kaggle.com/competitions/neurogolf-2026)**: a swarm of AI agents playing code-golf on the original ARC-AGI v1 public training set, iterating against each other until they converge on the shortest correct program per task. Reading *The Alignment Problem*. Thinking about the information-chaos problem in cyber incident response.

---

*Last updated on the date above. When that date gets stale, so does this page. The log keeps the receipts.*
