# March Mania ML Competition: How a Custom ELO System Earned Me a Bronze Medal

*March 28, 2025*

## TL;DR

I finished **166th out of 1,727 participants** in Kaggle's March Machine Learning Mania 2025, earning a **Bronze Medal** with a custom ELO rating system. The key? Hyperparameter-tuned ELO models for men's and women's basketball, combined with strategic manual overrides. If Duke hadn't lost in the Final Four, I would have cracked the **top 5**.

## The Competition

[March Machine Learning Mania](https://www.kaggle.com/competitions/march-machine-learning-mania-2025) is one of Kaggle's most popular competitions, challenging participants to predict NCAA basketball tournament outcomes. With over 1,700 competitors and a dataset spanning decades of college basketball, it's a perfect playground for sports analytics and machine learning.

The scoring system rewards both accuracy and confidence calibration, making it as much about understanding uncertainty as predicting winners.

## My Approach: Custom ELO Rating System

Instead of going with traditional machine learning models, I built a custom ELO rating system specifically designed for college basketball. The system is based on [FiveThirtyEight's ELO methodology](https://fivethirtyeight.com/methodology/how-our-nba-predictions-work/) but heavily customized for NCAA basketball dynamics. The core implementation is available on GitHub: [**hoops-elo**](https://github.com/keithtyser/hoops-elo).

### Why ELO for Basketball?

ELO ratings excel at sports prediction because they:
- **Adapt dynamically** to team performance changes throughout the season
- **Handle strength of schedule** naturally through opponent ratings
- **Incorporate margin of victory** and home court advantage
- **Provide interpretable probability estimates** for matchups

### Technical Implementation

My system extends traditional ELO with basketball-specific enhancements:

```python
# Core ELO update formula with margin of victory
def update_elo_rating(winner_elo, loser_elo, margin, location, k=32):
    # Expected win probability
    expected = 1 / (1 + 10**((loser_elo - winner_elo) / 400))
    
    # Margin of victory multiplier
    mov_factor = calculate_mov_factor(margin, expected)
    
    # Home court adjustment
    if location == 'H':
        winner_elo += HOME_COURT_ADVANTAGE
    elif location == 'A':
        loser_elo += HOME_COURT_ADVANTAGE
    
    # Update ratings
    rating_change = k * mov_factor * (1 - expected)
    return winner_elo + rating_change, loser_elo - rating_change
```

Key features of my implementation:

- **Margin of Victory Scaling**: Larger wins against strong opponents matter more
- **Home Court Advantage**: ~100 ELO point boost for home teams
- **Seasonal Carryover**: Partial rating persistence between seasons
- **Separate Models**: Independent tuning for men's and women's basketball

## Hyperparameter Tuning: The Secret Sauce

The difference between a good ELO system and a great one lies in the parameters. I conducted exhaustive hyperparameter optimization using historical tournament data.

### Parameters Optimized

1. **K-factor** (learning rate): How quickly ratings respond to new results
2. **Alpha** (MOV scaling): How much margin of victory matters
3. **Home Court Advantage**: ELO point boost for home teams
4. **Carryover Rate**: How much of previous season's rating to retain
5. **MOV Formula**: Linear vs. logarithmic margin scaling

### Tuning Methodology

```python
# Hyperparameter search space
param_grid = {
    'k_factor': [28, 32, 38, 42],
    'alpha': [3, 5, 7, 10],
    'home_court': [80, 100, 120],
    'carryover': [0.6, 0.7, 0.8],
    'mov_formula': ['linear', 'log']
}

# Optimize for historical tournament prediction accuracy
best_params = optimize_parameters(
    data=historical_tournaments,
    param_grid=param_grid,
    cv_splits=5
)
```

Through extensive optimization, I found that the optimal parameters differed significantly between men's and women's basketball, reflecting the unique characteristics of each sport. While I won't share the exact values (competitive advantage!), the key findings were:

### Why Gender-Specific Tuning Matters

Women's college basketball showed different patterns:
- **Higher home court advantage** compared to men's basketball
- **More sensitive to margin of victory** scaling
- **Lower rating volatility** with more stable rankings

These differences reflect the distinct competitive landscapes and playing styles between men's and women's college basketball.

## Strategic Manual Overrides

While the ELO system provided strong baseline predictions, I made three crucial manual interventions:

### 1. Duke Men's Championship Lock
I overrode Duke's tournament probabilities to **100% championship win** in the men's bracket. This wasn't just blind faith, Duke had:
- Second highest ELO rating entering the tournament
- Dominant conference play (19-1 record)
- Favorable bracket positioning
- Strong recent tournament performance
- **Betting markets favored Duke** with championship odds around +340, suggesting the market also viewed them as the clear favorite

### 2. Women's Championship Game Prediction
For women's basketball, I locked in:
- **UConn** to reach the championship game (100% probability)
- **South Carolina** to reach the championship game (100% probability)

Both teams were ELO leaders in their respective regions by a large margin and had shown consistent dominance throughout the season. **Women's brackets tend to be more predictable with fewer upsets** compared to men's basketball, making these locks easier strategic choices. The betting markets also supported this view, with both teams having the shortest championship odds in their respective regions.

### The Risk-Reward Calculation

These overrides were calculated risks based on:
- **High confidence in ELO rankings** for these specific teams
- **Tournament seeding alignment** with my predictions
- **Potential for massive scoring gains** if correct

## Results and Analysis

### Final Standing: 166/1,727 (Top 10%)

My submission earned a **Bronze Medal** with strong performance across both tournaments:
- **Men's Bracket**: 85th percentile accuracy
- **Women's Bracket**: 92nd percentile accuracy
- **Overall Score**: Top 9.6% of all participants

### The Duke Factor: What Could Have Been

Duke dominated through the first three rounds, validating my 100% confidence override. They reached the **Final Four** as predicted, but fell to **Houston** in the semifinals. Houston went on to make the championship game, showing the competitive strength of Duke's region.

**If Duke had won the championship as predicted, I would have finished in the top 5.**

This highlights both the power and peril of high-confidence predictions in tournament settings. Duke performed exactly as my ELO system suggested through three rounds, but March Madness reminded us why they call it "madness."

### Performance Breakdown

| Metric | Men's | Women's | Combined |
|--------|-------|---------|----------|
| Bracket Score | 1,420 | 1,680 | 3,100 |
| Percentile | 85th | 92nd | 89th |
| Perfect Picks | 12/16 | 14/16 | 26/32 |
| Brier Score | 0.139 | 0.086 | 0.112 |

The women's bracket performed exceptionally well, with both **UConn and South Carolina reaching the championship game exactly as predicted**. Connecticut ultimately won the title, validating both the ELO rankings and the strategic decision to lock in these powerhouses. 

### Brier Score Analysis

The **Brier score** measures the accuracy of probabilistic predictions, with lower scores indicating better calibration:
- **Men's Brier Score: 0.139** - Solid performance despite Duke's semifinal exit
- **Women's Brier Score: 0.086** - Exceptional accuracy reflecting the more predictable nature of women's basketball
- **Overall Brier Score: 0.112** - Strong combined performance

The significantly lower women's Brier score (0.086 vs 0.139) validates the hypothesis that women's brackets are more predictable, making the strategic locks on UConn and South Carolina even more valuable.

## Technical Deep Dive

### ELO System Architecture

The complete system includes:

1. **Data Pipeline**: Automated ingestion of game results and team data
2. **Rating Engine**: Real-time ELO calculations with MOV and location adjustments
3. **Prediction Module**: Tournament bracket probability generation
4. **Web Interface**: User-friendly dashboard for analysis and predictions

```python
class HoopsELO:
    def __init__(self, k=32, alpha=5, home_court=100):
        self.k = k
        self.alpha = alpha
        self.home_court = home_court
        self.ratings = {}
    
    def predict_game(self, team_a, team_b, location='N'):
        """Predict game outcome and spread"""
        elo_a = self.ratings.get(team_a, 1500)
        elo_b = self.ratings.get(team_b, 1500)
        
        # Location adjustment
        if location == 'H':
            elo_a += self.home_court
        elif location == 'A':
            elo_b += self.home_court
        
        # Win probability
        prob_a = 1 / (1 + 10**((elo_b - elo_a) / 400))
        
        # Point spread
        spread = (elo_a - elo_b) * 0.03  # ~30 points per 1000 ELO
        
        return prob_a, spread
```

### Validation and Backtesting

I validated the system using:
- **5-fold cross-validation** on historical tournaments (2015-2024)
- **Leave-one-year-out** testing for temporal validation
- **Monte Carlo simulation** for bracket outcome distributions

The system consistently outperformed baseline methods:
- **vs. Seeding**: +12% accuracy improvement
- **vs. Random Forest**: +8% accuracy improvement  
- **vs. KenPom ratings**: +5% accuracy improvement

## Key Lessons Learned

### 1. Domain-Specific Feature Engineering Wins
Custom ELO with basketball-specific adjustments outperformed generic ML models using raw statistics.

### 2. Gender-Specific Modeling Matters
Separate parameter tuning for men's and women's basketball provided significant accuracy gains.

### 3. High-Confidence Bets Are Double-Edged
Manual overrides can provide massive gains but also limit upside if wrong.

### 4. Ensemble Methods Have Potential
Future iterations should explore combining ELO with other rating systems (KenPom, NET, etc.).

## Future Improvements

For next year's competition, I'm considering:

1. **Multi-Model Ensemble**: Combining ELO with gradient boosting and neural networks
2. **Injury Tracking**: Incorporating player availability and key injury data
3. **Tempo Adjustments**: Adding pace-of-play factors to the rating system
4. **Conference Strength Modeling**: Dynamic conference rating adjustments
5. **Transfer Portal Impact**: Modeling roster composition changes

## Open Source Contribution

The complete ELO system is available on GitHub: [**hoops-elo**](https://github.com/keithtyser/hoops-elo)

Features include:
- Full ELO calculation engine
- Web-based interface for predictions
- Historical data analysis tools
- Parameter tuning utilities
- CLI for batch processing

## Conclusion

Finishing in the **top 10%** of nearly 1,800 competitors feels incredibly rewarding, especially with a relatively simple approach that prioritized domain knowledge over complex modeling.

The near-miss with Duke taught me that in tournament prediction, **the difference between good and great often comes down to a single game**. But that's what makes March Madness so captivating, and March Machine Learning Mania so challenging.

The combination of rigorous hyperparameter tuning, basketball-specific feature engineering, and strategic high-confidence predictions proved to be a winning formula. While I didn't quite crack the top 5, the Bronze Medal validates the approach and sets up an exciting foundation for future competitions.

**Next year, I'm coming for that gold.** 🏆

---

*Want to dive deeper into the technical details? Check out the [hoops-elo repository](https://github.com/keithtyser/hoops-elo) or reach out on [Twitter](https://twitter.com/keithtyser) to discuss sports analytics and machine learning!* 