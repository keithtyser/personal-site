---
title: "Three Simulation Competitions and Three PPO Mistakes"
description: "What I learned about reinforcement learning from Orbit Wars, Pokémon TCG, and Kaggriculture. Each competition showed me a different mistake."
date: 2026-10-03
toc: true
---

From April to September, I entered three Kaggle simulation competitions: [Orbit Wars](https://www.kaggle.com/competitions/orbit-wars), the [Pokémon TCG AI Battle](https://www.kaggle.com/competitions/pokemon-tcg-ai-battle), and [Kaggriculture](https://www.kaggle.com/competitions/kaggriculture). In each competition, you submit an agent. The agent plays against the agents of other teams on a live ladder, and the ladder sets your rank.

In all three competitions, my goal was to win with self-play reinforcement learning (RL) using PPO (proximal policy optimization). In the last two competitions, I started PPO from a behavioral cloning (BC) model.

| Competition | Final agent | Result |
|---|---|---|
| Orbit Wars | Heuristic bot | Bronze, 348 / 4,729 |
| Pokémon TCG | 300M model, BC + PPO | Silver, 210 / 6,807 |
| Kaggriculture | 5.35M model, BC + PPO | Silver range, not final |

In each competition, I fixed one mistake from the previous competition. Then I made a new mistake:

- In Orbit Wars, PPO did not learn.
- In Pokémon, PPO worked, but my model was too large for my compute.
- In Kaggriculture, my model was small, but its task was too large.

## Orbit Wars: PPO did not learn

Orbit Wars is a real-time space strategy game. Each player starts with one planet on a 100×100 board, and planets make ships. On each turn, you send fleets at an angle toward other planets. A sun destroys fleets that fly through it. Comets move across the board on a schedule.

I started my main RL attempt in late May. The network did not aim the fleets. The policy selected a source planet, a target planet, and one of six ship fractions. A predictive-aim routine calculated the angle. The network was small, with approximately 32,000 parameters.

I put most of my effort into speed. My first Python environment ran 7 steps per second. Then I wrote a batched PyTorch version for the AMD GPU in my home PC. This version ran approximately 7,500 steps per second on full games. In approximately 71 hours, the run recorded approximately 1.43 billion transitions.

The optimizer metrics looked correct, but the agent did not become strong. The best league checkpoint won approximately one third of its games against my own heuristic bot.

Looking at the code closer, I realized the problems were not in the optimizer:

- The simulator made most training games shorter: 64–256 turns. The real game has 500 turns.
- The simulator did not have comets until late in the run.
- My parity test against the official engine covered only 11–23 steps of random play.
- The agent trained against proxy opponents, not against the bots that it had to beat.
- Each evaluation used only two games per opponent.

My simulator was fast, but it simulated a different game. Also, my evaluations used too few games to show the problem. I was very unprepared to do RL but failing at it taught me a lot. I ended up just submitting a heuristic bot and received a bronze medal at rank 348.

The winner, Isaiah ([code](https://github.com/IsaiahPressman/kaggle-orbit-wars)), trained a 200M-parameter transformer with pure self-play. The training used 15 billion steps and approximately 2,400 B200 GPU-hours. He also rewrote the game engine in Rust.

From this result, I learned the wrong lesson. I thought that RL in these competitions needs a datacenter, and I kept this belief for two more competitions. But a counterexample was available in early May. The team in second place at that time [posted their RL lessons](https://www.kaggle.com/competitions/orbit-wars/discussion/697725). They trained a 600K-parameter model from scratch with self-play. The training took approximately three days on one rented RTX 5090, and their GPU budget was approximately $150. Therefore my problem is not compute, it's a skill issue.

## Pokémon TCG: PPO worked, but the model was too large

Pokémon was a different type of problem. At each decision, the engine gives the agent a short list of legal options, and the agent selects one option. A game has approximately 100 decisions. The agent also selects its 60-card deck.

### BC first, and a bug that hid the results

In this competition, I started with BC. BC trains a policy to predict the moves of strong players from public replays. Then PPO makes that policy stronger. My first BC model was a 13M-parameter transformer, and it scored 523 on the ladder. This score was too low.

The cause was a bug. All of my initial BC submissions used a fallback move. The function `torch.set_grad_enabled(False)` is thread-local, and the Kaggle harness called my agent from a different thread. Thus, the network path did not run correctly, and my fallback selected option zero for each decision. After I fixed the bug, the same 13M BC file scored 878. BC alone put me in the bronze medal range.

### The parts of the recipe that worked

PPO then made the BC policy stronger. I will use these parts again:

- Start from BC. Use a KL penalty toward a reference policy. Move the reference policy to each new promoted checkpoint. Do not keep it frozen at BC.
- Promote a checkpoint only when it beats the current best checkpoint in a head-to-head test with sufficient games. A fixed 600-game gate let noise through, so I changed to a sequential probability ratio test.
- Measure each checkpoint against a fixed baseline that does not change. A policy can beat its parent and still not improve against other opponents.
- Train against a league, not only against the current policy. My league started with five PPO runs on five different decks, with one shared opponent pool. Later, I added public agents and 42 behavioral clones of top ladder agents.

### I made the model too large

My 13M PPO run improved for only a short time, so I decided that the model was too small. Being the overly ambitious person I am, I selected the largest model that fit the Kaggle submission limit of 197.7 MiB after 5-bit quantization. 300 million parameters. Looking back, it's kind of funny that I thought that was a good idea.

This decision made the competition expensive. The 13M model made approximately 60,000 self-play decisions per second on my two GPUs. The 300M model made approximately 1,700–2,000 decisions per second on one GPU. A PCIe fault caused my second GPU to disconnect many times. Thus, I rented GPUs on Vast for the main run. At the end, I used an H200.

The 300M model continued to learn. Iteration 851 of the final PPO run won my silver medal. It scored 963 and finished at rank 210 of 6,807. But at iteration 779, the model had only approximately 71 million decisions of experience. That is approximately 200 times less experience than the Orbit Wars winner used. Later checkpoints did not beat iteration 851 on the ladder.

I did not find out what that model could do with full training. Also, I did not do the most important experiment: a medium-size model that could play many more games in the same weeks. I asked, "What is the largest model that fits the submission limit?" The correct question was, "What is the largest model that I can train to convergence before the deadline?"

The Pokémon ladder also showed me that ladder scores have much noise. At one point, I submitted the exact same agent twice (at the exact same time) and there was a difference of over 500 ELO between the two.

## Kaggriculture: the model had too much to learn

Kaggriculture is a two-player farming game. Each player has a 10×10 farm. A game has 30 in-game days, and each day has 24 turns. At the end, the player with more money wins.

During the game, you do these tasks:

- Hire workers and buy land.
- Plant wheat, carrots, tomatoes, strawberries, and melons.
- Keep geese, cows, and sheep.
- Sell products in a shared town market. The prices change when the two players sell.

I was on a five-person team, QQ Farming. This section is about my part of the work: the PPO policy. Both of our final submissions used this policy.

### I fixed the model size

I did not make the 300M mistake again. The final policy had 5.35 million parameters. It had these parts:

- A small CNN for the two farms
- Tokens for workers, market items, and history
- A three-layer transformer
- A GRU that keeps memory through the full season
- Autoregressive decoders for workers and market orders

### I did not fix the action space

On each turn, the network made these decisions for each worker:

1. A PASS/ACT gate.
2. One of 44 command templates. Examples are "move north", "water", "harvest", "plant a crop", and "pick up an item".
3. A quantity, if the command needs one.

After the worker decisions, the network wrote up to ten ordered market requests. Each request had 23 possible types and up to 233 possible quantities. The network also selected each movement step, one tile at a time. The policy had no task layer.

On held-out games, this was approximately 25 decisions for each player on each turn. That is approximately 18,000 decisions for each player in each game. The model had to learn how to move before it could learn how to farm.

Before this, I tried a different approach. I tried training a macro version first. The network selected production jobs from approximately 1,100 candidates. A hand-written executor then moved the workers to do the jobs. This version lost all its games, and it also lost all four games against an agent that does nothing.

The problem was the executor. It did not use fertilizer. Also, it could not express approximately one quarter of the actions of the strong players. I did not fix the abstraction. Instead, I changed to primitive actions. My thought process was that the policy should be able to learn everything. Unfortunately the action space was way too large to learn, even with over 1.7 million games of training.

### The BC model was accurate, but it did not win

The BC data had 22,185 games from the organizer's top-episode datasets. That is 31.9 million player-turns. The data included both seats, with winners and losers. After 11 epochs, I tested the model on 650 games that it did not see in training. It predicted the worker command correctly 85.7% of the time. It predicted the market request correctly 86.0% of the time.

The model still did not win one game against a strong bot.

<figure>
  <picture>
    <source media="(max-width: 640px)" srcset="/blog/images/kaggriculture-bc-accuracy-vs-wins-mobile.svg">
    <img src="/blog/images/kaggriculture-bc-accuracy-vs-wins.svg" alt="The held-out worker-command accuracy of the Kaggriculture BC model increased from 76.2 percent at epoch 1 to 85.7 percent at epoch 11. Against three strong bots, the model won 0 of 24 games at each epoch." loading="lazy">
  </picture>
  <figcaption>At each epoch, the model played the same 24 games against three strong bots. The model always beat an agent that does nothing, and it beat weak bots. It did not beat a strong bot.</figcaption>
</figure>

This result confused me, because BC worked in Pokémon. Now I think that the cause was the action space again:

- **Errors compound.** In Pokémon, one wrong selection in 100 decisions usually does not lose the game. In Kaggriculture, 86% accuracy over 18,000 decisions causes the model to leave the states of the teacher early. After that, the model must improvise.
    - Example 1: One opponent clone had 95% accuracy. On turn 3, it moved north and did not pick up a sheep. All of its later purchases expected the sheep. The clone had no money by turn 96.
    - Example 2: Another clone followed its teacher until approximately turn 200. Then it made different decisions, mostly in the market, and its animals starved.
- **Some of the accuracy was easy.** The teacher selected ACT for 94% of worker slots. Thus, a model that always selects ACT gets 94% accuracy on the gate.
- **I cloned an average player, not a winner.** The data had both seats, with winners and losers. An average player does not beat strong bots.
- **I trained on requests, not on results.** The 3rd-place team found that many strong bots send market orders that are too large. The engine silently makes these orders smaller. If you clone the raw orders, your model learns orders that the engine does not execute.

### PPO improved the policy, but toward the wrong target

PPO started from the BC checkpoint I trained. It ran until the deadline on September 30, approximately 11.5 days. Earlier in September, I also used PPO with other models.

The setup had these parts:

- **Simulator.** A JAX port of the game engine ran on the GPU, and the policy ran in PyTorch. I did parity tests against the official engine.
- **Hardware.** I used two RTX PRO 6000 GPUs on my workstation. For the last five days, I rented an eight-GPU machine. It made approximately 16 full games per second.
- **Opponents.** Approximately 87% of the training games were against real scripted bots from the ladder and from my teammates. The pool had 52 bots from 29 different authors. The sampler selected more games against the bots that beat the policy.
- **Reward.** A win/loss reward gave almost no signal, because the policy lost 98% of its games. Thus, I added reward terms for the cash margin and the final cash.

During 8.3 million games, the policy improved steadily:

- In the first few hours, its cash deficit against the strong bots decreased from $64–82k to approximately $28k.
- By day five, it won half of its games against AFS R2, one of the strongest bots on our panel.
- On September 28, it had the highest rating in the internal arena of our team.
- On a fixed panel of eight bots, its score increased from less than 20% to 98%.

Some bugs did not show errors:

- For one day, changes to the learning rate had no effect. The saved optimizer state replaced the new value.
- In bf16, the replay calculated the probability of a full turn incorrectly. Each turn has approximately 25 factors. With the learning rate at zero, the PPO clip still activated on 22% of turns.

The ladder score did not follow the panel score closely.

<figure>
  <picture>
    <source media="(max-width: 640px)" srcset="/blog/images/kaggriculture-ppo-panel-vs-ladder-mobile.svg">
    <img src="/blog/images/kaggriculture-ppo-panel-vs-ladder.svg" alt="Two charts with the same x-axis, the PPO update. Top chart: the score against the same eight bots increased from approximately 16 percent to 98 percent between updates 119 and 3,529. A marker shows the evaluator change at update 2,149. Bottom chart: the Kaggle ladder scores of eleven pure-PPO submissions between updates 2,239 and 3,519. The scores are between 1,605 and 2,399. They decreased while the panel score increased, and the last score is 2,040. A line shows the silver cutoff at 2,048." loading="lazy">
  </picture>
  <figcaption>Top: each evaluation used 128 games against the same eight bots. The bold line is a rolling mean of nine evaluations. At update 2,149, the evaluator changed from the official CPU engine to greedy play on the GPU simulator. Thus, the two halves are not one continuous measurement. Bottom: ladder scores on October 3. Old submissions stop playing and their scores freeze, so these scores are approximate.</figcaption>
</figure>

Pure-PPO submissions had ladder scores from 1,605 to 2,399. On average, later checkpoints did better, but the result was not reliable. My panel gave three checkpoints scores of 98%, 100%, and 97%. On the ladder, they scored 2,166, 2,399, and 2,040.

My best ladder result did not come from pure PPO. It came from a hybrid agent. PPO played days 0–11, and then a deterministic planner from a teammate played days 12–29. This hybrid scored 2,433. The planner works at the task level and calculates sales with a price model. My policy almost never found this behavior through exploration.

Thus, I think the issue was that my policy did not have task-level planning. More training time wouldn't have helped much.

My panel was also too similar to my training pool. In internal tests, the final policy beat three bots from my teammates in 84–92% of games. On the ladder, those same bots scored approximately 600 points more than my policy. If your policy trains against the panel, the panel is not a held-out evaluation.

### What the top teams did differently

The top teams published their solutions. Each solution did something important that my solution did not do:

- **M & M & P & Q, 1st place when they posted** ([preview](https://www.kaggle.com/competitions/kaggriculture/discussion/745073), [code](https://github.com/msdsm/kaggriculture-solution)) used a 10.2M-parameter transformer. Their model also outputs primitive unit actions. They did five rounds of BC. The first round used 34 top public submissions. Later rounds added demonstrations from their heuristic planner, for weaknesses that they found in replays. Then they used self-play PPO for approximately 8.29 million games on up to 17 A100 GPUs and 29 A30 GPUs. At inference, rules repair actions that conflict or waste resources. A C++ search planner plays the final day.
- **3rd place** ([writeup](https://www.kaggle.com/competitions/kaggriculture/discussion/745119)) did not use RL or search. Their network predicts the target tile and an action for each unit. A shortest-path rule moves the unit. Before they made this decision, they measured the moves of their teacher. Each step was a shortest-path move toward the next job of the unit. They trained on the actions that the engine executed, and they selected checkpoints only by money on paired seeds. Across eight versions, validation accuracy had a negative correlation with money.
- **7th place** ([writeup](https://www.kaggle.com/competitions/kaggriculture/discussion/745367)) cloned the newest versions of the strongest team. Each unit selects a task, then a target tile, then a raw action. RL increased the result by approximately $1,000 for each game. But the noise from game to game was approximately $4,000.
- **10th place** ([code](https://github.com/CarsonBurke/kaggriculture)) trained a 947k-parameter actor for approximately 10 hours on one RTX 5090. They used BC on games where the two players had ratings of 2,600 or more. Then they used a self-play PPO league with a win/draw/loss reward and held-out reference agents.

One number surprised me. My PPO lineage played approximately 8.3 million games, almost the same number as M & M & P & Q. Thus, the number of games was not my problem.

In all these solutions, the network did not have to learn low-level execution from reward only. A rule did the execution, or the network cloned players who already won, or both. My network had to find the execution itself, and it started from a clone of average players.

### Current result

For now, our team is in the silver medal range. The final evaluation continues for approximately two more weeks.

## What I will do in the next competition

### 1. Representation and action space first

This is the most important lesson. When I debug, I will examine these items first, before hyperparameters and before throughput:

- What does the network see?
- What does the network select?
- Is the architecture correct for these inputs and outputs?

Use an action space where each decision is important. Do not let the model use capacity on tasks that a rule can do exactly. Before you use an abstraction, compare it with the actions of strong players. The 3rd-place team made sure that each teacher step was a shortest-path move before they used a movement rule. I did not make sure that my macro executor could do the actions of the teachers, and it could not.

### 2. Use BC as a start, and test it only in full games

BC was sufficient for the bronze range in Pokémon. In Kaggriculture, BC alone did not win against strong bots. Per-decision accuracy did not predict either result. Clone players who win. Clone the actions that the engine executed. Select checkpoints by their results in full games.

### 3. Size the model for the training budget, not for the submission limit

The quality of a model depends on the number of games that you can use to train it. Start small, and make sure that the full training loop works. Make the model larger only when the small model does not improve any more. The M & M & P & Q team increased their model from 6 to 12 blocks during the competition. Their 24-block model did not go into a final submission.

### 4. You do not need a datacenter

Because of the Orbit Wars winner, I thought that RL needs a large amount of compute. But in each competition this year, there were many strong teams who used only one consumer GPU:

- **Orbit Wars:** In May, the second-place team trained a 600K-parameter model with self-play from scratch. The training took approximately three days on one rented RTX 5090.
- **Pokémon:** The [27th-place team](https://www.kaggle.com/competitions/pokemon-tcg-ai-battle/discussion/738158) used pure self-play PPO without BC. Their 12M-parameter model trained at approximately 30 games per second on one RTX 3090.
- **Kaggriculture:** The 10th-place agent trained for approximately 10 hours on one RTX 5090. The 7th-place model pretrained in less than one hour on one RTX 5090.

More compute can help. In Kaggriculture, M & M & P & Q used tens of A100 GPUs, and the Orbit Wars winner used much more. But a large amount of compute is not necessary. My largest run used eight RTX PRO 6000 GPUs for five days, and it did not get near those single-GPU agents. Those teams gave their models a problem that the models could learn quickly. I did not.

### 5. Self-play alone is usually not sufficient

Self-play alone can work. The Orbit Wars winner used only self-play, with approximately 2,400 B200 GPU-hours. Without that budget, different opponents help a lot. Use past checkpoints, public agents, clones of top ladder players, and the bots of your teammates. But keep some opponents out of training. If you do not, your evaluation shows only how well your policy knows its training opponents.

### 6. Build an evaluation that you trust, then check it

Use fixed held-out opponents, paired seeds, both seats, and an internal arena where each agent plays each other agent. Then test the exact package in an environment that is as near to the real harness as possible. In Pokémon, my worst failure was not a modeling failure. It was a thread-local flag. Also, expect noise on the ladder. The same Pokémon file scored from 731 to 1,004.

### 7. Throughput last

A GPU simulator removes the CPU bottleneck, and it is useful. But build it after the six steps above. In Orbit Wars, I made a simulator faster, but it did not simulate the real game. In Kaggriculture, my simulator could run games more than 100 times faster than my policy could select actions. The cause was the policy: it made 25 sequential decisions on each turn. A smaller action space also gives more throughput.

## The next competition

After three competitions, my pipeline is good. It has these parts:

- BC into PPO
- A league with clones
- Gated promotions
- Paired-seed evaluation
- An internal arena
- A GPU simulator

Each part came from a mistake in an earlier competition.

But I did not yet use the first week for the most important part: the representation and the action space. In the next simulation competition, I will do that part first. I want the next competition to start soon.
