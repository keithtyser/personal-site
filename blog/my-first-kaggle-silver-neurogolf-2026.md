---
title: "My First Kaggle Silver: NeuroGolf 2026"
description: I finished 97th in NeuroGolf 2026 after using coding agents to optimize 400 ONNX models.
date: 2026-07-15
toc: true
---

I finally earned my first Kaggle silver medal.

I finished **97th out of 3,061 entries** in [NeuroGolf 2026](https://www.kaggle.com/competitions/neurogolf-2026), with a final score of **7,496.25**. That put me in the top 3.2%, 2.43 points inside the top 100, and comfortably above the silver cutoff.

After six bronze medals, getting the first silver feels great. Mostly, though, I feel relieved. This competition was fascinating, but it consumed an absurd amount of time, attention, and AI tokens. I am very happy it is over.

## Working with coding agents

Most of the implementation work ran through Codex subagents and headless Codex workers, with a few other models used on selected problems. I chose the tasks, set priorities, managed the shared state, reviewed results, and controlled the submission budget.

The prompts had to be specific. "Make the solution better" produced vague ideas. Naming one task, its current cost, the evaluator, and the required ONNX builder produced code I could test.

## Starting fast, then burning out

I started the competition very early and briefly reached **rank 5 on May 6**. With 400 mostly independent targets and an exact evaluator, the competition suited coding agents. Early on, every new worker seemed capable of finding another measurable gain.

I also burned out quickly. NeuroGolf was consuming my weekly Codex and Claude Code usage limits, and those were the same limits I wanted for Forgewright, Model Forge, ARC, and everything else I was building. Spending most of that capacity on another round of ONNX micro-optimization became hard to justify, so I backed off and lost the early leaderboard position.

### The WebUI detour

I also tried GPT-5.5 Pro and GPT-5.6 Sol Pro through the ChatGPT WebUI. On my account, the WebUI did not have the obvious weekly meter I saw in the coding CLIs. Its practical limits were request throttling and bot detection. Those two models found some of my best gains.

The tabs could not see my local files. Every run needed a self-contained prompt with the task corpus, current cost, evaluator behavior, and expected artifact. I then had to copy the code back into my local build and validation pipeline. Doing that by hand across hundreds of tasks was too slow.

I tried automating the handoff with [OLmatter's ChatGPT WebUI Bridge](https://github.com/OLmatter/chatgpt-bridge). I got it working late, but Codex sent requests too quickly and hit rate limits. It also had trouble parsing responses and sometimes gave the tabs prompts that returned suggestions instead of finished ONNX code. GPT-5.6 Sol Ultra could spend a long time repairing the bridge when I needed it to work on tasks. I shut the experiment down. It might have become useful with an earlier start and a better queue, but the final week was too late to tune it.

## What NeuroGolf actually was

Each NeuroGolf submission contained **400 separate ONNX models**, one for each transformation task in the original ARC-AGI v1 training set. Each model had to solve its task correctly while using as little charged memory and as few parameter elements as possible.

For a correct task, the scorer was effectively:

```text
cost   = intermediate tensor bytes + parameter elements
points = max(1, 25 - ln(max(1, cost)))
```

Inputs and outputs were free. Compute was free. Intermediate tensors were not. Parameter initializers were charged by element count rather than byte size. Correctness came from the sign of the output.

That incentive structure inverted normal inference optimization. A network could do a ridiculous amount of computation and still be excellent if it wrote directly to the free output. Recomputing something three times was often cheaper than materializing it once. A tiny boolean intermediate could matter more than a huge contraction.

In practice, it was 400 small program-golf problems expressed as ONNX graphs.

## The workflow that finally worked

My central data structure was a **champion registry**: the cheapest model I currently trusted for each task. Every champion had a task ID, cost, source, SHA-256 hash, and validation receipt. A candidate could replace it only if it was both correct under the required gates and strictly cheaper.

The loop became:

1. Rank tasks by plausible score gain and architectural tractability.
2. Give one task to one worker.
3. Recover the actual transformation rule before touching the graph.
4. Build a deterministic ONNX candidate and its source.
5. Run structural checks, all known examples, both ONNX Runtime modes, and task-specific stress tests.
6. Compare the official cost against the current champion.
7. Overlay accepted hashes onto the highest live-proven 400-model ZIP.
8. Bundle mature gains; isolate uncertain operators or semantics in one-task Kaggle probes.

I maintained two candidate lanes. The original-work lane produced new architectures and graph rewrites. The public-artifact lane monitored public Kaggle datasets and GitHub repositories, preserved provenance, deduplicated candidates by task and hash, and evaluated only models that were actually cheaper than my current base.

Public models never bypassed validation. A public package score did not prove that one model would improve my stronger package, and several apparent wins failed the current checker or hidden distribution. I kept exact source URLs and hashes for anything I adopted and excluded encrypted or privately offered material.

Across 100 matched campaign submissions, my evaluator's median absolute prediction error was about **0.0028**, and 97 predictions were within 0.05. The large misses usually came from whole-task failures: a hidden semantic case, processor incompatibility, package mistake, or runtime issue could erase almost an entire task.

## Score over time

Kaggle's full submission export reaches back to April 16, giving me a complete 91-day score history. I made **2,140 submission attempts** across 52 active UTC dates: 1,770 completed with a score and 370 ended in an error. The very first completed submission scored **84.27**.

<figure>
  <img src="/blog/images/neurogolf-full-score-history.svg" alt="Cumulative high-water chart of my NeuroGolf public score from 84.27 on April 16 to 7,496.25 on July 15, with daily bars showing 2,140 submission attempts, including 1,770 completed submissions and 370 errors." loading="lazy">
  <figcaption>The line follows every new completed-submission high, while the bars show all attempts by UTC date. Kaggle rescored historical entries after checker changes, so the plot uses the scores attached to those original timestamps today, not necessarily the number displayed on that day.</figcaption>
</figure>

## The last few days

The last week was the part I will remember. I started the final 55 hours at rank 168 and kept crossing the rank-151 silver line as other competitors improved. The first goal was simply to get back over the line. Then it became rank 130 with a cushion, then top 100.

<figure>
  <img src="/blog/images/neurogolf-last-55-hours-rank.svg" alt="My leaderboard rank over the final 55 hours, moving from rank 168 to rank 97 while repeatedly crossing the rank-151 silver cutoff." loading="lazy">
</figure>

## The last-week public-solution scramble

Strong public packages and commits kept appearing in the final days. Public solution sharing was still allowed when the material was genuinely public, although it was strongly discouraged during the final week. Kaggle disabled new competition notebooks, but existing notebooks could still be updated and solutions could still appear as standalone datasets or GitHub repositories.

When a strong public bundle landed, dozens of entries could absorb overlapping gains at once. Standing still meant moving backward. Among the final-day artifacts I screened were [Sebastian Gil's 7,310 verified blend](https://www.kaggle.com/datasets/sebastiangil00/neurogolf-7310-verified-blend) and late commits from [`lljjcc426/NGC-work`](https://github.com/lljjcc426/NGC-work). I compared each task hash against my champion registry and ran cheaper candidates through the same local checks as my own models.

One last-day upload claimed a **7,957-point** score. Its creator accused top-five teams of cheating and trading solutions, threatened a release before the deadline, and posted an offer to sell the package for $1,000 in Bitcoin. I had no evidence for those claims. A [later Kaggle discussion](https://www.kaggle.com/competitions/neurogolf-2026/discussion/726541) identified the encrypted archive as the public baseline, so I discarded it.

I climbed **71 places**, from rank 168 to **97th**, safely inside silver.

## The technical ideas that paid

The most reliable optimization was producer substitution: inline an intermediate's producer into the final output contraction.

Task303 originally built row and column summaries before combining them. I inlined both summaries into a single final `Einsum`. The graph repeated the input and did more arithmetic, but it stopped storing both charged tensors. Cost fell from **700 to 220**, worth **+1.157 points**.

<figure>
  <img src="/blog/images/neurogolf-task303-arc.svg" alt="Task303 ARC example: a blue-and-black input grid becomes an output where the complete black row and column are red." loading="lazy">
</figure>

Task298 was a different kind of simplification. A general ring-decomposition algorithm turned out to be unnecessary: across the available distribution, the important colors could be recovered from three fixed coordinates. Replacing the general procedure with direct sampling and construction cut cost from **14,912 to 1,349**, worth **+2.403 points**.

<figure>
  <img src="/blog/images/neurogolf-task298-arc.svg" alt="Task298 ARC example: the colors of three nested square rings rotate positions in the output." loading="lazy">
</figure>

Five tasks ended at **zero cost and the full 25 points**. Three were simple direct input-to-output graphs. The stranger pair, Tasks 087 and 140, implemented a fixed 3x3 rotation with one attribute-only `LpPool`. With no initializer and no intermediate tensor, the scorer saw zero cost. Those two models alone added **3.219 points**.

<figure>
  <img src="/blog/images/neurogolf-zero-cost-rotations.svg" alt="ARC examples for Tasks 087 and 140, each rotating a 3-by-3 grid by 180 degrees." loading="lazy">
</figure>

The final breakthrough was Task162, which fills available 3x3 black regions with blue. An earlier correct model cost 2,323 because it materialized a local activation over a window grid. I expanded those factors directly inside the final contraction instead. The P13 version reached cost 876 after full validation. With minutes left, P14 removed another sentinel row and synthesized its bias from existing coverage:

```text
memory = 16 bytes
params = 822 elements
cost   = 838
```

It did vastly more computation than the old graph and stored almost nothing.

<figure>
  <img src="/blog/images/neurogolf-task162-arc.svg" alt="Task162 ARC example: a blue 3-by-3 square fills one empty region in a green-and-black grid." loading="lazy">
</figure>

## What local validation missed

Task096 passed 266 stored cases in both runtime modes plus hundreds of translations, then failed on Kaggle. Task279 passed 266 cases, 1,862 symmetry transforms, and 9,428 layout translations twice. Its isolated overlay still lost about 16.56 points.

Case counts did not measure generator coverage. My tests could vary symmetry and placement while preserving a hidden part of the task's structure. High-arity `Einsum`, sparse initializers, and quantized graphs also produced failures that the local runtime did not predict. I isolated unfamiliar operator families in one-task probes.

Each final ZIP also received package-level checks for the 400 root files, overlay diff, entry order, model hashes, and checksum. Near the deadline, one stale base could silently throw away hours of gains.

## The honest cost

The official export records **1,770 completed submissions**. Many were controlled one-task probes spread across the month, but too many small gains should have waited for a larger bundle.

The last week turned into a full-time operations exercise. I watched the leaderboard, screened public candidates, assigned tasks to agents, reconciled model hashes, ran the evaluators, built packages, and managed a grading queue that could take half an hour. I pushed the workstation hard enough to crash it once and had to cap evaluator concurrency.

The token consumption was also excessive. Parallel agents worked because the 400 tasks were independent, but adding workers without narrow assignments mostly created noise. Every result still had to pass the same deterministic gate.

I am proud of the medal, but I would not want every competition to demand this pace. Earlier bundling and stricter resource caps would have saved a lot of time and tokens.

## Final artifacts

I published the exact final package at [keithtyser/neurogolf-2026-final-submission](https://github.com/keithtyser/neurogolf-2026-final-submission).

```text
Score:      7,496.25
Place:      97 / 3,061
ZIP files:  400 ONNX models
ZIP SHA256: d90f10e8b58b1360db7d80bcd8cc239f06ce227a6823f6204413312c5bd57ea8
```

Thanks to the organizers and to everyone who published models or failure reports I could independently verify.

The leaderboard tabs are closed. Next up: ARC.
