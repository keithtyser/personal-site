---
title: Now
description: What I'm working on right now, plus a log of what came before.
updated: 2026-11-03
toc: false
---

What I'm working on this month. Inspired by Derek Sivers' [/now page](https://nownownow.com/about) convention, with a twist: when this page gets updated, the old snapshot moves down into the [log](#log), so you can scroll back through time.

## Working on

Just finished [ARC-AGI-2](https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-2) and [ARC-AGI-3](https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-3), which consumed the last month of my life. On the public leaderboards my team is sitting **5 / 5,070** in ARC-AGI-3, in the gold range, and **32 / 3,626** in ARC-AGI-2, in the silver range. The private leaderboard comes out December 4, so for now I'm hoping to hold onto both medals. Our ARC-AGI-3 writeup, paper and video are in [ARC Prize 2026: ARC-AGI-2 and ARC-AGI-3](/blog/arc-prize-2026-arc-agi-2-and-arc-agi-3.html).

I now have a solid group of people to team up with, so I can take on more competitions at once. These two are up first.

### [Gemma 4 Developer Agent](https://www.kaggle.com/competitions/gemma-4-developer-agent)

I'll probably give RL another shot here, and I'll probably fail again.

### [Enveda CASMI 2026](https://www.kaggle.com/competitions/enveda-CASMI26-molecule-id-mass-spectra)

Identifying molecules from their mass spectra. Whatever that means.

## Planned

### [Name That LLM](https://www.kaggle.com/competitions/name-that-llm) and [Verifiable Quantum Circuit Compilation](https://www.kaggle.com/competitions/google-verifiable-quantum-circuit-compilation)

Entered both, the second one from Google Quantum AI. I'll probably compete in both after Gemma and CASMI.

## Thinking about

How I was able to delete half of the experts from Qwen Flash Next and still keep almost the same performance. Were half of them useless? I never thought that was possible, but it really shows how much of the weights you can get rid of, especially for specialized use cases.

## Log

Past snapshots of this page, newest first.

### Nov 3, 2026

**Pokémon TCG AI Battle** is over. Competing solo, I finished **210 / 6,807** for a **silver medal** with a 300M-parameter model trained with behavioral cloning and PPO.

**Kaggriculture** is over too. Our five-person team, QQ Farming, finished **302 / 10,148** for another **silver**. It was a very frustrating competition, but I keep learning more about RL and self-play PPO. What I learned across Orbit Wars, Pokémon, and Kaggriculture is in [Three Simulation Competitions and Three PPO Mistakes](/blog/three-simulation-competitions-three-ppo-mistakes.html). Kaggriculture was also my first time on a team, and it was fun. I don't know if I'll ever compete solo again. I already have my solo gold, so going solo now is mostly a disadvantage. A team means more compute, more ideas, more experiments, more everything, and it's great networking. That puts me at 1 gold, 3 silver, and 6 bronze.

**ARC-AGI-2** and **ARC-AGI-3** closed on Nov 2 after taking over the last month, and I'm super happy to finally be done. On the public leaderboards my team is **5 / 5,070** in ARC-AGI-3 (gold range) and **32 / 3,626** in ARC-AGI-2 (silver range). Winners and the private leaderboard come out December 4. In a perfect world we keep gold in ARC-AGI-3 and a shakeup somehow lifts us into gold in ARC-AGI-2. Overall it was a fun competition. I learned a lot about inference engineering and more about RL (GRPO and RLVR), and I got to use B300s for the first time. I might do a writeup. Before this update I was heading into Pokémon TCG, with ARC-AGI-2 and ARC-AGI-3 planned, and thinking about whether one great general agent harness beats specific harnesses per task.

### Aug 7, 2026

**ROGII Wellbore Geology Prediction** is over. I finished **14 / 6,125** solo for my first Kaggle **gold medal**, climbing 65 places on the private leaderboard from 79th. 607 experiments across 16 focused days, grinding CV down from a 11–15 baseline to 6.2518. That puts me at 1 gold, 1 silver, and 6 bronze, rank **311 / 212,364**, one silver away from Competitions Master. Writeup: [My First Kaggle Gold](/blog/my-first-kaggle-gold-rogii-2026.html).

The **2x RTX PRO 6000 AI workstation** is finished and comes off this page. Threadripper PRO 9965WX, two RTX PRO 6000 Blackwell Max-Q cards, 192 GB of VRAM, 192 GB of ECC system memory, running vLLM eval servers, SFT and LoRA training, behavioral cloning, PPO, and Kaggle work. The build, benchmarks, fan-curve fix, and early problems are in [My 192 GB Blackwell AI Workstation](/blog/my-192gb-blackwell-ai-workstation.html). **Forgewright** and **Model Forge** also come off; I am not actively building on either right now. **ARC-AGI-2** and **ARC-AGI-3** move to planned. Before this update I was resetting after NeuroGolf and getting the workstation busy.

### Jul 15, 2026

**NeuroGolf 2026** is over. I finished **97 / 3,061** with **7,496.25** for my first Kaggle silver medal, competing solo. The last week became an all-consuming loop of ONNX graph golf, agent orchestration, local evaluation, public-candidate screening, and slow submission queues. Before this update I was sitting at 154th, just outside the silver cutoff, and trying to justify the time and tokens already invested. The final push got me safely across the line and into the top 100.

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
