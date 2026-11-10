---
title: "ARC Prize 2026: ARC-AGI-2 and ARC-AGI-3"
description: "On the public leaderboards, my teams were 5th of 5,070 in ARC-AGI-3 and 32nd of 3,626 in ARC-AGI-2. This post gives our ARC-AGI-3 writeup, paper and video, and a short summary of ARC-AGI-2."
date: 2026-11-10
toc: false
---

ARC Prize 2026 closed on November 2. I was in both of its Kaggle competitions, on two different teams. These are our results on the public leaderboards:

- [ARC-AGI-3](https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-3): Team Turducken was **5th of 5,070**, with a score of **56.02**.
- [ARC-AGI-2](https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-2): この遥かなる旅路に祝福を was **32nd of 3,626**, with a score of **70.14**.

Kaggle will publish the private leaderboards on December 4.

## ARC-AGI-3 with Team Turducken

We published three items about our ARC-AGI-3 entry:

- [Stuffing the Turducken](https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-3/writeups/public-lb-5th-stuffing-the-turducken) is our solution writeup on Kaggle. It describes the harness, the speed work, the ideas that failed and the changes that we would make next time.
- [Abundant Tokens, General Tools: Unlocking Small-Model Reasoning on ARC-AGI-3](https://www.kaggle.com/competitions/arc-prize-2026-paper-track/writeups/new-writeup-1794166748883) is our paper for the ARC Prize 2026 paper track. It is shorter than the writeup. It also tells which conclusions our noisy results support and which they do not.
- [The video](https://www.youtube.com/watch?v=JLo5RymlK5E) shows how our solution works.

<figure>
  <iframe src="https://www.youtube-nocookie.com/embed/JLo5RymlK5E" title="Stuffing the Turducken | Team Turducken's ARC-AGI-3 Solution" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
  <figcaption>Team Turducken's video about our ARC-AGI-3 solution.</figcaption>
</figure>

### What we built

ARC-AGI-3 has 110 games that the agent has not seen before. The agent must play all of them on one 96 GB RTX PRO 6000 in approximately nine hours. The agent does not receive the rules of a game. It must find the goal and the rules while it plays.

Our entry used Qwen3.8 Flash Next with 4-bit weights on the SGLang fork from Daniel Franzen. We started from his public Milestone 2 notebook, which uses the harness from Tufa Labs. A turducken is a chicken in a duck in a turkey. In our entry, the Tufa Labs harness is the chicken, Daniel's notebook is the duck and our engineering is the turkey.

The model played each game in a separate conversation. It played with Python code that it wrote. It kept a notes file, and the notes stayed when the harness removed old turns from the conversation. At the start of each level, the model wrote a description of a solved level in its notes. The functions that the model wrote stayed available until the end of the game.

Most of our score increase was a result of more speed. Throughput for a full run increased from 605 to **2,150 generated tokens per second**, with 32 games on the GPU at the same time. In three weeks, our score increased from 7.36 to 41.97, mostly because of speed work. Harness changes then increased it to 52.82. A last speed change increased it to 56.02.

### What we learned

- Token quality became more important than token count. After 56.02, all of our faster builds had lower scores. These builds were faster because of lossy changes, which change the text that the model writes. We did not see when the quality of each token became more important than the number of tokens.
- Many local improvements did not transfer to Kaggle. We did fourteen paired comparisons. Twelve showed an improvement in our local evaluation, but only three of those twelve showed an improvement on Kaggle. Some ideas targeted problems that we saw in the 25 public games. These ideas usually did not help on the hidden games.
- General tools helped more than advice for specific games. Runs with notes, a longer context window and reusable code had better scores. Advice for specific games sometimes caused problems. For example, we told the agent to ignore segmented bars at the edge of the screen. In one game, an edge bar showed the goal.

## ARC-AGI-2

My ARC-AGI-2 team had four members: NT, ngyzly, Slow∞Loop and me. The team name was この遥かなる旅路に祝福を, which means approximately "a blessing on this long journey".

ARC-AGI-2 has 240 hidden grid puzzles, and the solver can give two answers for each puzzle. It must solve all of them in 12 hours on four 24 GB NVIDIA L4 GPUs. We used the same model as in ARC-AGI-3, Qwen3.8 Flash Next with 4-bit weights. Our server was a patched vLLM that used all four GPUs. We started from the public ARC-AGI-3 recipe for Flash Next. This recipe used the 4-bit weights from Daniel Franzen, the patched vLLM runtime from Lord Han Solo and the MTP drafter from albucino.

For each puzzle, the model wrote a Python function and ran it on the training examples. The harness accepted a function only when its output was the same as every training output. The output of that function on the test input was our answer.

Our first Flash Next submission, on October 5, had a score of 42.64. At the end of October, our score was 70.14. As in ARC-AGI-3, most of the increase was a result of inference work:

- We decreased the startup time from approximately 47 minutes to less than 6 minutes.
- We kept only one copy of each KV head, so more cache fit on the GPUs.
- We removed approximately half of the experts. On average, each layer kept 257 of its 512 experts.

The other increases were a result of harness changes and of how we divided the token budget between the attempts.

## Thanks

Thank you to Son Pham, Mark Barney, NT, ngyzly, Slow∞Loop and Ronen Dunlea. Thank you also to Tufa Labs, Daniel Franzen, Lord Han Solo and albucino. We used the work that they shared publicly.
