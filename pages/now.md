---
title: Now
description: What I'm working on right now, plus a log of what came before.
updated: 2026-07-13
toc: false
---

What I'm working on this month. Inspired by Derek Sivers' [/now page](https://nownownow.com/about) convention, with a twist: when this page gets updated, the old snapshot moves down into the [log](#log), so you can scroll back through time.

## Working on

Finishing one Kaggle competition hard, lining up two more, and bringing a new workstation online. Still chasing a first silver medal.

### [Neurogolf 2026](https://www.kaggle.com/competitions/neurogolf-2026)

Still the main focus until it ends. Sitting right on the silver medal line at **154 / 3,022** (silver is 151 or higher). Pushing hard to get over the line, but it's mostly hillclimbing with LLMs and burning a lot of tokens. Not learning as much as I'd like at this stage, but I've invested enough time and tokens that I'm close and want to finish it out.

### [ARC-AGI-2](https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-2) and [ARC-AGI-3](https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-3)

Already in both. Excited to put full focus here once Neurogolf is done. These are the competitions I actually want to sink into.

### [Forgewright](https://github.com/keithtyser/forgewright) and [Model Forge](https://github.com/keithtyser/model-forge)

Obsessed with two things: improving the best open source models to make them even better, faster, and uncensored, and streamlining the post-training process to make it easier. Model Forge is the post-training workbench; Forgewright is the multi-agent swarm that runs it autonomously behind one conversational CLI. The new workstation should let me push both of these a lot harder.

### 2x RTX PRO 6000 AI Workstation

All the parts are finally here. Putting it together this Friday. Pics and updates to come. Two 96 GB Blackwell Max-Q GPUs should be a big step up for Model Forge, Forgewright, and the ARC competitions.

## Reading

- **The Alignment Problem**, Brian Christian

## Thinking about

How to create the best agent harness. Is it better to build one great general harness, or specific harnesses per task/workflow?

## Log

Past snapshots of this page, newest first.

### Jul 13, 2026

**Orbit Wars** is over. Finished **348 / 4,729** for a **bronze medal**, which I'm pretty happy with given it was a heuristic-only agent. I never got a stable RL training pipeline working, so self-play didn't pan out, but I learned a lot trying. That puts me at **6 bronze medals** and rank **1,042 / 210,359** on Kaggle. Still no silver or gold; Kaggle is brutal. Before this update the active slate was Neurogolf plus Orbit Wars, plus Forgewright and Model Forge. If time allows later I may try the new Pokémon TCG agent competition.

### Jun 15, 2026

Main focus was **Neurogolf 2026**, with **Orbit Wars** still active (self-play RL; humbled after ~100M samples just starting to beat the tutorial bot). Building **Forgewright** and **Model Forge**. Reading *The Alignment Problem*. Thinking about detecting agentic AI activity for cyber defense.

### Jun 10, 2026

The **NVIDIA Nemotron Model Reasoning Challenge** ended and it didn't go how I'd hoped: 658 out of 4,354 teams, no medal, and my score slipped from 0.86 on the public leaderboard to 0.85 on the private one. It was one of the most frustrating competitions I've ever entered. I never broke that 0.86 plateau no matter what I threw at it: reverse-engineered puzzle generators, deterministic chain-of-thought traces tuned to a token budget, LoRA sweeps on the hybrid Mamba/MoE model, RL where supervised finetuning had clearly stalled. Hundreds of teams piled up at 0.86 because the public recipe was that good, and the top score was 0.92. It was addicting in the way only a hard plateau can be. I burned a lot of GPU hours and learned a lot, and I expect to learn more once the top teams publish their solutions. Also competing in **Orbit Wars** with self-play RL, and building **Forgewright** and **Model Forge**.

### Apr 18, 2026

Three Kaggle competitions in parallel: the **Nemotron Model Reasoning Challenge** (fine-tuning Nemotron-3-Nano-30B through Tinker, on the DGX Spark), **Orbit Wars** (bot v23b climbing the public leaderboard from 786 to 968), and **[Neurogolf 2026](https://www.kaggle.com/competitions/neurogolf-2026)**: a swarm of AI agents playing code-golf on the original ARC-AGI v1 public training set, iterating against each other until they converge on the shortest correct program per task. Reading *The Alignment Problem*. Thinking about the information-chaos problem in cyber incident response.

---

*Last updated on the date above. When that date gets stale, so does this page. The log keeps the receipts.*
