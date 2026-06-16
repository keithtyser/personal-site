---
title: Now
description: What I'm working on right now, plus a log of what came before.
updated: 2026-06-15
toc: false
---

What I'm working on this month. Inspired by Derek Sivers' [/now page](https://nownownow.com/about) convention, with a twist: when this page gets updated, the old snapshot moves down into the [log](#log), so you can scroll back through time.

## Working on

Two Kaggle competitions, two open source projects, and a lot of GPUs.

### [Neurogolf 2026](https://www.kaggle.com/competitions/neurogolf-2026)

My main focus right now. A swarm of AI agents playing code-golf on the original ARC-AGI v1 public training set, iterating against each other until they converge on the shortest correct program per task.

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

### Jun 10, 2026

The **NVIDIA Nemotron Model Reasoning Challenge** ended and it didn't go how I'd hoped: 658 out of 4,354 teams, no medal, and my score slipped from 0.86 on the public leaderboard to 0.85 on the private one. It was one of the most frustrating competitions I've ever entered. I never broke that 0.86 plateau no matter what I threw at it: reverse-engineered puzzle generators, deterministic chain-of-thought traces tuned to a token budget, LoRA sweeps on the hybrid Mamba/MoE model, RL where supervised finetuning had clearly stalled. Hundreds of teams piled up at 0.86 because the public recipe was that good, and the top score was 0.92. It was addicting in the way only a hard plateau can be. I burned a lot of GPU hours and learned a lot, and I expect to learn more once the top teams publish their solutions. Also competing in **Orbit Wars** with self-play RL, and building **Forgewright** and **Model Forge**.

### Apr 18, 2026

Three Kaggle competitions in parallel: the **Nemotron Model Reasoning Challenge** (fine-tuning Nemotron-3-Nano-30B through Tinker, on the DGX Spark), **Orbit Wars** (bot v23b climbing the public leaderboard from 786 to 968), and **[Neurogolf 2026](https://www.kaggle.com/competitions/neurogolf-2026)**: a swarm of AI agents playing code-golf on the original ARC-AGI v1 public training set, iterating against each other until they converge on the shortest correct program per task. Reading *The Alignment Problem*. Thinking about the information-chaos problem in cyber incident response.

---

*Last updated on the date above. When that date gets stale, so does this page. The log keeps the receipts.*
