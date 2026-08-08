---
title: "My First Kaggle Gold: ROGII Wellbore Geology"
description: Six years, thirty-odd competitions, six bronze medals, and then a solo gold. What actually changed.
date: 2026-08-07
toc: true
---

I got my first Kaggle gold medal.

I finished **14th out of 6,125 teams** in [ROGII Wellbore Geology Prediction](https://www.kaggle.com/competitions/rogii-wellbore-geology-prediction), competing solo, with a private score of 6.329. It took six years and more than thirty competitions to get here.

I had just woken up from a nap. The first thing I did was open the leaderboard on my phone, not expecting much, because I had ended the competition in 79th on the public board. I stared at the 14 for a while.

<figure>
  <img src="/blog/images/rogii-private-leaderboard.webp" alt="The ROGII private leaderboard top 15. My entry sits at rank 14 with a score of 6.329, marked with a green up-arrow showing a 65-place climb, and a banner reading 'You won a gold medal! Your team placed 14th out of 6125 teams.'" loading="lazy">
</figure>

The solution writeup is [on Kaggle](https://www.kaggle.com/competitions/rogii-wellbore-geology-prediction/writeups/14th-place-a-hierarchical-u-net-stack-with-seed-a) and the code is [on GitHub](https://github.com/keithtyser/rogii-wellbore-geology-solution). This post is about the six years, not the model.

## Before I ever competed

In 2019 or 2020, a classmate in undergrad told me he was entering machine learning competitions on Kaggle. I signed up soon after to look around, and then entered nothing.

Not long after that I took my first data science class. The class ran its own competition, off Kaggle, and I got completely absorbed in it. I spent far more time on it than the grade justified, and I overfit the private test set.

That is funny in hindsight. I learned the most important idea in competitive machine learning before I had made a single submission on the actual site.

A year later a grad school course used [a real Kaggle competition](https://www.kaggle.com/competitions/cs-506-midterm-a1-b1) as its final project. I did not place as well as I wanted. I also did not overfit the public test set, which felt like progress.

## Six years of bronze

For most of the years that followed I competed sporadically. I would enter something, poke at it for a week, and drift away. The competitions I reliably put real effort into were the [March Mania](https://www.kaggle.com/competitions/march-machine-learning-mania-2025) tournaments, which is a strange thing to admit, because March Mania needs more luck than any other competition on the site.

The Brier score rewards gambling. If you overwrite a few predictions to 100% and they land, you jump the leaderboard. If they don't, you're finished. Converting betting lines to probabilities, correcting for longshot bias, and then placing a few deliberate 100% bets is enough to win the whole thing, provided the games cooperate.

In 2025 I did a lot of analysis and three teams stood clearly above the rest. I locked UConn women to win it all at 100%. I locked South Carolina women into the championship game at 100%. I locked the Duke men to win it all at 100%.

Before the Final Four I was sitting in 3rd place. UConn and South Carolina were both there, exactly as predicted. Duke was in the men's Final Four. If my teams held, I could not finish worse than top three and I had a real shot at winning.

Then Duke lost to Houston in a game they choked away. I finished 166th of 1,727 with a bronze.

I will keep entering March Mania, but it excites me less now. Until the metric changes, it is a betting contest with a modeling costume on.

The one that actually stung was the [NFL Big Data Bowl 2026](https://www.kaggle.com/competitions/nfl-big-data-bowl-2026-prediction/leaderboard). I finished 99th of 1,899, only five places away from my first silver.

<figure>
  <img src="/blog/images/rogii-medal-history.webp" alt="My Kaggle competition medal history: one gold, one silver, and six bronze. ROGII at 14 of 6,125 with gold, NeuroGolf at 91 of 2,963 with silver, then bronze finishes in NFL Big Data Bowl 2026, ARC Prize 2024, AMP Parkinson's, March Machine Learning Mania 2025, Orbit Wars, and BirdCLEF+ 2026." loading="lazy">
</figure>

Six bronzes. A bronze is the top 10% and I was glad to have them, but I kept landing in the same band and could not get through to the top 5%. That gets old.

## What actually changed

Four things, and none of them are "I got better at machine learning."

### Build the offline evaluation first

The public leaderboard will fool you. It is easy to watch that number improve and mistake it for progress.

Now the first thing I build in any competition, before any modeling, is a holdout evaluation I can run locally. A good one tells me three things: whether the solution generalizes, how strong it actually is, and roughly where it will land on the leaderboard. Sometimes I need it because daily submissions are capped. Sometimes I need it because the public set is small and noisy. I always need it.

### Then read the data

"Garbage in, garbage out" is one of those lines you learn early and don't understand until much later. Academia gave me clean, well-behaved datasets and let me believe that was normal. Working with real data corrected that, and Kaggle finished the job.

Reading top solution writeups, I kept noticing how often the decisive move was in the data rather than the model: a leak, a quality problem, a way to generate synthetic examples, something odd about how the labels were made. So after the evaluation harness, I spend real time going through the data before I train anything.

### Kaggle is partly an engineering competition

Most competitions want a notebook submission, running offline, with a runtime cap of nine to twelve hours and a fixed amount of compute. That is an engineering problem before it is a modeling one.

It took me too long to learn the basics: installing dependencies from an attached Kaggle dataset, shipping trained weights and source code as datasets, and above all submitting an inference-only notebook. For years I assumed training and inference had to happen inside the same submission. They do not, and believing they did cost me a lot. Once you train elsewhere and submit only the inference step, the runtime budget stops being the thing that decides your ceiling.

[Tufa Labs' duck harness notebook](https://www.kaggle.com/code/jeroencottaar/tufa-labs-duck-harness-june-30-milestone-winner) is a good example of what a well-engineered submission looks like.

### Iterate faster

I spent 16 focused days on ROGII and ran 607 experiments in them.

Coding agents are the reason. Before them I could brute-force a hyperparameter sweep or point AutoML at something, but testing a new architecture or a different preprocessing idea meant a day of implementation each time. Now the gap between having an idea and having a measured result is small enough that I can afford to be wrong most of the time. That matters more than it sounds, because I usually had the ideas. I could just never build them fast enough to find out which ones worked.

## The grind

ROGII was frustrating in a way NeuroGolf never was.

NeuroGolf was 400 small independent problems and an exact scorer, so there was always another measurable gain sitting somewhere. ROGII was one hard problem that refused to move. Reasonable baselines landed around 11 to 15 CV. Getting under 8 took a long time. Then I sat at roughly 7.5 for a stretch, found a real breakthrough down to 6.6, and stalled again at 6.4 for the last few days with nothing left that worked. Seed ensembling took me the rest of the way to a final CV of 6.2518.

That is what 607 experiments buys you. Most of them failed, and for long stretches it looked like they all would.

## Why the leaderboard moved

Everyone knew there would be a shakeup.

A heavily forked [public notebook](https://www.kaggle.com/code/evgendvorkin/rogii-physics-lb-7-872-v48) was sitting in bronze range on the public board at 6.361, built from models with a CV around 10 or 11. That gap is not subtle. It dropped about 1,000 places when the private scores landed.

My own CV tracked the leaderboard closely all the way through, which is not something everyone had. Strong competitors were posting CVs near 6 while scoring 8.5 publicly, and that disagreement is miserable to work with, because you have to decide which number is lying. I never had that problem, so I trusted my CV and picked my final submissions on it.

I moved up 65 places. Most of the top ten climbed too, some by 30 or 40. One team came up 1,561 places into 15th, one spot behind me, which is a good reminder of how little the public board was worth.

## On competing solo

Solo gold is one of the harder things to get on Kaggle, and I did not set out to do it that way. It's just how it happened. Teams help. More people means more ideas tried per day, and the breakthroughs that separate gold from silver often come out of that.

I still prefer solo, for two reasons.

The first is that I can quit whenever I want. This is a hobby. Some competitions stop being fun and I abandon them, which is fine on my own and would not be fine if three other people were counting on me. I don't want to grind something out because I feel obligated to.

The second is imposter syndrome. I worry I won't contribute enough to be worth teaming with. That one I'm less proud of.

## Where this leaves me

At the time of writing this I am rank **311 of 212,364**, still a Competitions Expert. Master needs one more silver or better. Grandmaster needs four more golds.

<figure>
  <img src="/blog/images/rogii-kaggle-ranking.webp" alt="My Kaggle competitions ranking over time, flat around the top 2,000 through 2024 and 2025, then climbing steadily through 2026 before a sharp jump to rank 311." loading="lazy">
</figure>

The chart looks like a hockey stick, and I want to be careful about reading too much into it. Silver and gold three weeks apart is a small sample. My [silver in NeuroGolf](/blog/my-first-kaggle-silver-neurogolf-2026.html) came from a completely different kind of competition, so I can't point to one trick that carried over. What I think happened is that I finally have a way of approaching a new competition: evaluation first, then data, then models, then engineering. Whether that holds up is something the next few competitions will tell me.

The medals matter to me more than the rank does. Each one is evidence that what I built was genuinely strong work, not a lucky draw. I want grandmaster mostly to settle the question of whether any of this is a fluke.

And the competition itself is fun in a way I had almost forgotten. It is the same feeling I got playing sports in high school and video games after that. I also learn a great deal along the way, which is a real part of why I keep entering rather than the excuse I tell people.

Next up is the [Pokémon TCG AI Battle](https://www.kaggle.com/competitions/pokemon-tcg-ai-battle) competition. Reinforcement learning is not my strong suit and I know almost nothing about Pokémon, so I expect to learn a lot.
