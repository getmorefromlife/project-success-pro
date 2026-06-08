# Project Success Predictor

A data-driven success probability tool for project managers. Built by a Senior ICT Project Manager who codes.

## Why This Exists

67% of projects fail globally (PMI). Most PMs rely on gut feel or opaque dashboards. This tool provides a transparent, repeatable scoring framework — no hidden formulas, no API calls, no costs.

Created as a portfolio centrepiece demonstrating the intersection of **project management domain expertise** and **modern software engineering**.

## Live Demo

[Add deployment URL here — GitHub Pages, Cloudflare Workers, or Vercel]

## Features

| Capability                  | Detail                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **7-metric input form**     | Budget variance, timeline variance, risk count, stakeholder satisfaction, team morale, scope creep, resource conflicts |
| **Weighted scoring engine** | 5 dimensions with transparent weights (risk 25%, budget/timeline/stakeholder 20% each, morale 15%)                     |
| **Health classification**   | GREEN (≥80), YELLOW (50–79), RED (<50) — standard traffic-light system                                                 |
| **Confidence scoring**      | 3-component rule-based: data completeness + pattern clarity + outlier detection                                        |
| **Smart recommendations**   | 7 conditional, priority-sorted suggestions with regenerate button                                                      |
| **6 visualizations**        | SVG gauge, bar/line/radar charts, industry comparison, trend projection                                                |
| **PDF export**              | A4 report with scores, breakdown, and recommendations (jsPDF, client-side)                                             |
| **Save & share**            | localStorage history, URL-based sharing with input hydration                                                           |
| **No data leaves browser**  | All computation is client-side. GDPR compliant by design.                                                              |

## Scoring Model

The success probability is a **weighted average** of 5 dimension scores:

```
Risk (25%) + Budget (20%) + Timeline (20%) + Stakeholder (20%) + Morale (15%)
```

Each dimension score is a transparent formula:

- **Budget**: `100 − abs(variance) × [3 if over, 1.5 if under]`
- **Timeline**: `100 − abs(variance) × [2.5 if delayed, 1 if ahead]`
- **Risk**: `100 − (risks×5 + scope creep×4 + resource conflicts×4)`
- **Stakeholder/Morale**: slider value × 10

Asymmetric penalties reward early warning signs: being over-budget hurts 3× more than being under.

## Confidence Score (Not AI)

The confidence score measures how much to trust the prediction using three rule-based checks:

1. **Data Completeness** — penalizes extreme or missing-looking values
2. **Pattern Clarity** — checks if metrics logically align with the final score
3. **Outlier Detection** — flags statistical anomalies (values >2σ from mean)

No machine learning. No API calls. No hidden complexity. Every number is traceable back to a formula.

## Tech Stack

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| Framework  | React 19 + TanStack Start (SSR) |
| Routing    | TanStack Router (file-based)    |
| Styling    | Tailwind CSS v4 + shadcn/ui     |
| Charts     | Recharts                        |
| PDF        | jsPDF                           |
| Build      | Vite 7 + Bun                    |
| Deployment | Cloudflare Workers (Nitro)      |
| Package    | Bun (24h supply-chain guard)    |

## Why This Matters for My Portfolio

I'm a Senior ICT Project Manager pursuing NZ visa sponsorship (Green List Tier 2 — ICT Project Manager). This app proves I can:

- **Ship production software** — not just manage it
- **Build with modern stack** — React 19, TanStack, TypeScript, Tailwind v4
- **Design domain-aware logic** — the scoring model reflects real PM heuristics (asymmetric penalties, risk weighting)
- **Prioritize privacy** — GDPR compliance by architecture, not by checkbox
- **Communicate clearly** — transparent formulas, no marketing fluff

## Getting Started

```bash
bun install
bun dev      # development server
bun build    # production build
bun preview  # preview production build
```

## License

MIT — free forever. No API keys, no subscriptions, no data collection.
