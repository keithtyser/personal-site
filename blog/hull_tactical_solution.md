---
title: "Hull Tactical Market Prediction: A TabM Approach"
description: Walk-forward validation, TabM, and volatility-aware exposure sizing for the Hull Tactical Kaggle competition.
date: 2025-12-16
toc: false
---

This is the first Kaggle competition I've seriously competed in for a while. It's also the most fun I've had with one from a pure modeling perspective. I love the March Mania competitions, but that's because I love basketball and March Madness. This one was different. The problem itself was interesting: dynamic market exposure, risk-adjusted returns, real financial mechanics. It felt like building something that could actually trade.

## The Competition

Hull Tactical runs an ETF that dynamically allocates between equities and cash. The competition asks you to predict daily market exposure between 0 (100% cash) and 2 (200% leveraged long). You're scored on risk-adjusted returns with penalties for excessive volatility and underperforming the market.

The metric is adjusted Sharpe ratio. Two penalties apply:
- Volatility penalty if your strategy vol exceeds 1.2x market vol
- Return penalty if you lag the market (quadratic, so large gaps hurt badly)

You get ~140 features covering macro indicators, momentum signals, and market internals. Daily data spanning decades.

## Why the Public Leaderboard Was Useless

The competition organizers were upfront about this. The API rows available during training overlap with the training set. The labels are public. They said it explicitly:

> "Without careful handling, models trained directly on the full training set may overfit, resulting in inflated leaderboard scores... Internally, our approach is to build walk-forward models and evaluate them on non-overlapping out-of-sample periods to better assess true performance."

So the public LB was meaningless. A model could score well by memorizing training data, then completely fail on the private test set. The only way to trust your results was to build your own offline evaluation.

## Walk-Forward Validation

I implemented walk-forward out-of-sample (WFO) validation. The idea: simulate how the model would have performed if deployed historically, retraining as new data arrived.

The setup:
- Training window: 756 days (~3 years)
- Out-of-sample window: 84 days (~4 months)
- Embargo: 7 days between train and test (prevents leakage)
- Roll forward, repeat

This produces 11 non-overlapping OOS periods. For each, I train on the preceding 3 years, predict the next 4 months, and compute the competition metric. The Sharpe ratio of these 11 metrics tells me how consistent the model is across different market regimes.

A model with mean=2.0 and std=0.5 (Sharpe=4.0) is more trustworthy than mean=2.5 and std=1.5 (Sharpe=1.67). The second model might have gotten lucky in a few periods. The first one performed consistently.

This became my north star. Every experiment was judged by WFO Sharpe, not by any leaderboard score.

## The Model

I used [TabM](https://github.com/yandex-research/tabm), a tabular deep learning architecture published at ICLR 2025 by Yandex Research. The [paper](https://arxiv.org/abs/2410.24210) makes a compelling case: MLPs with parameter-efficient ensembling outperform the attention-based and retrieval-based architectures that dominated recent tabular deep learning.

The core idea is batch ensembling. A traditional deep ensemble trains k separate MLPs and averages their predictions. TabM fits all k members into a single MLP-like structure through weight sharing. Each forward pass produces k predictions per input. You average them at inference.

Two things make this work better than you'd expect:

**Parallel training.** All ensemble members train simultaneously. You can monitor ensemble performance during training and stop when the ensemble is optimal, not when individual members are. Traditional ensembles train sequentially; you can't do this.

**Weight sharing as regularization.** The ensemble members share most parameters. This isn't just efficient. It constrains the members to stay similar, which reduces overfitting. The paper shows individual predictions are weak, but collectively powerful. The shared structure forces diversity in the right way.

TabM scales well. The paper benchmarks on datasets up to 13M rows. People have run it on 100M+.

Final architecture:
- `d_block=512` (hidden dimension)
- `n_blocks=6` (depth)
- `k=24` (ensemble members per forward pass)
- 13 seeds for outer bagging (13 TabM models, each with 24 internal members)
- Early stopping with patience=12

Training took about 10 minutes on GPU for all 13 seeds.

## Feature Engineering

The raw features are already informative. I added three types of derived features:

**Rolling statistics at multiple windows.** Instead of just 21-day momentum and volatility, I computed them at 5, 10, 21, 42, 63, and 126 days. This gives the model visibility into short, medium, and long-term trends simultaneously.

**Regime indicators.** Binary features flagging market states:
- `regime_high_vol`: current 21-day vol above its 63-day median
- `regime_uptrend` / `regime_downtrend`: 63-day momentum sign
- `regime_crisis`: high vol AND downtrend
- `regime_risk_on`: low vol AND uptrend

These help the model recognize when market dynamics shift.

**Historical percentiles.** Where does current vol or momentum rank in the past year? A percentile of 0.95 means "volatility is in the 95th percentile of recent history." This self-normalizing context helped more than any other feature addition (+11% to WFO Sharpe).

## The Exposure Mapping

Raw model output is a predicted excess return. This needs to become an exposure between 0 and 2.

The standard approach: sigmoid mapping. Positive predictions go above 1.0 (long), negative predictions go below 1.0 (defensive).

The problem: a fixed sigmoid treats all market conditions equally. A prediction of +0.0001 gets the same exposure whether volatility is 10% or 40%.

**Vol-adaptive scaling** fixed this. Instead of a fixed sigmoid scale, I compute:

```python
vol_ratio = current_vol / median_vol
vol_ratio = clip(vol_ratio, 0.5, 2.0)
dynamic_scale = base_scale * vol_ratio
```

When volatility is twice the historical median, the sigmoid compresses toward neutral (exposure ~1.0). When volatility is half the median, the sigmoid expands and bets get more aggressive.

This single change improved WFO Sharpe by 12%.

## What Worked

| Change | Sharpe Impact |
|--------|---------------|
| val_frac 0.12 → 0.08 | +43% |
| Percentile features | +11% |
| Vol-adaptive scaling | +12% |
| Multiple rolling windows | +5% |
| Regime indicators | +2% |

The val_frac change was surprising. Using only 8% of training data for validation (instead of 12%) meant more training data. The model stopped early anyway due to patience, so the extra epochs didn't cause overfitting.

## What Didn't Work

**Huber loss.** Switched from MSE to Huber to reduce sensitivity to outliers. Sharpe dropped 50%. Reverted immediately.

**Feature selection.** Identified 33 features with negative permutation importance and dropped them. Sharpe dropped 30%. The "useless" features apparently contained signal the model was using.

**Confidence weighting.** When the 13 seeds disagreed (high prediction variance), shrink the prediction toward zero. No effect. The seeds agreed too closely for this to matter.

**Regime-based exposure modulation.** Shrink bets by 50% in crisis regimes, expand by 20% in risk-on regimes. Sharpe dropped 22%. The vol-adaptive scaling already captured what mattered; adding regime logic on top just added noise.

**Second-order features.** Momentum acceleration, volatility acceleration, cross-timeframe momentum agreement. Sharpe dropped 21%. More features, more noise.

**Tighter vol-ratio bounds.** Changed [0.5, 2.0] to [0.7, 1.5] for less extreme adjustments. Sharpe dropped 4%. The wider bounds were optimal.

**PiecewiseLinearEmbeddings.** The TabM paper shows that adding feature embeddings (TabM†) consistently outperforms vanilla TabM. I tried it. Sharpe dropped 68%, from 3.39 to 1.08. One period went negative.

Why? The paper benchmarks on large, static datasets up to 13M rows. I had 8,000 training rows and financial time series with regime changes. The embeddings compute bin boundaries from training data. Those boundaries don't generalize when market conditions shift. The extra parameters (142 features × 12 embedding dims) overfit on small data. And my features were already engineered - winsorized, rolling stats, percentile-normalized. The embeddings had nothing useful to add.

The pattern: every attempt to add complexity after vol-adaptive scaling made things worse. The signal is weak. Additional features or logic just inject noise.

## Final Results

Walk-forward out-of-sample validation (11 periods, 84 trading days each):

- **Sharpe: 3.39**
- Mean metric: 1.88
- Std: 0.55
- Min metric: 1.04
- Max metric: 2.75
- Total return: +171%
- Max drawdown: -8.2%

Starting point was Sharpe ~0.5. Final solution achieved nearly 7x improvement.

## What I Learned

The biggest gains came from:
1. More training data (smaller validation split)
2. Self-normalizing features (percentiles)
3. Vol-adaptive bet sizing

Everything else was noise. I tried a lot of clever ideas. Regime-based exposure modulation. Confidence weighting when model seeds disagreed. Second-order momentum features. Each one made things worse. The pattern was clear: once you have a solid model and sensible risk management, additional complexity just injects noise.

Markets are efficient. The signal is faint. Respect that.

The WFO framework was the real win. It gave me confidence that my improvements were real, not artifacts of overfitting. When I saw Sharpe go from 0.5 to 3.39 across 11 independent periods, I knew I was onto something. The public LB never told me anything useful.

This competition reminded me why I enjoy this stuff. The iteration loop was tight. Ideas could be tested in minutes. The feedback was immediate and quantitative. No ambiguity about whether something worked. Just numbers going up or down.

I'll be watching the private LB closely over the next 6 months.
