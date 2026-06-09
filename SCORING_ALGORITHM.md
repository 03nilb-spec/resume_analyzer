# ATS Scoring Algorithm

## Weights

- Keyword match: 40%
- Semantic similarity: 30%
- Experience relevance: 20%
- Formatting: 10%

## JD-Aware Matching

When a JD is supplied, the analyzer extracts target terms from:

- The broad skill library.
- JD signal terms such as reporting, dashboard, stakeholder, SQL, Power BI, and forecasting.
- Repeated meaningful JD terms.

This makes missing-skill detection more useful when the JD includes requirements outside the original skill dictionary.

## AI Layer

AI insights do not modify ATS scoring. They are additive coaching sections rendered after ATS analysis.
