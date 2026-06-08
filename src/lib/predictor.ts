export type Inputs = {
  budgetVariance: number;
  timelineVariance: number;
  riskCount: number;
  stakeholderSat: number;
  teamMorale: number;
  scopeCreep: number;
  resourceConflicts: number;
};

export type Scores = {
  budget: number;
  timeline: number;
  risk: number;
  stakeholder: number;
  morale: number;
};

// Each subscore 0-100. Higher = better.
export function computeScores(i: Inputs): Scores {
  // Budget: 0 variance = 100. ±5% acceptable. Penalize over more than under.
  const budgetPenalty =
    i.budgetVariance >= 0 ? i.budgetVariance * 3 : Math.abs(i.budgetVariance) * 1.5;
  const budget = clamp(100 - budgetPenalty);

  // Timeline: delayed worse than ahead.
  const tlPenalty =
    i.timelineVariance >= 0 ? i.timelineVariance * 2.5 : Math.abs(i.timelineVariance) * 1;
  const timeline = clamp(100 - tlPenalty);

  // Risks: each risk costs 5pts; scope creep + resource conflicts add weight.
  const risk = clamp(100 - i.riskCount * 5 - i.scopeCreep * 4 - i.resourceConflicts * 4);

  const stakeholder = clamp(i.stakeholderSat * 10);
  const morale = clamp(i.teamMorale * 10);

  return { budget, timeline, risk, stakeholder, morale };
}

export function weightedAverage(s: Scores): number {
  // Weights sum to 1.
  const w = { budget: 0.2, timeline: 0.2, risk: 0.25, stakeholder: 0.2, morale: 0.15 };
  return Math.round(
    s.budget * w.budget +
      s.timeline * w.timeline +
      s.risk * w.risk +
      s.stakeholder * w.stakeholder +
      s.morale * w.morale,
  );
}

export function healthStatus(pct: number): {
  label: string;
  tone: "success" | "warning" | "danger";
} {
  if (pct >= 80) return { label: "GREEN (Healthy)", tone: "success" };
  if (pct >= 50) return { label: "YELLOW (Moderate Risk)", tone: "warning" };
  return { label: "RED (High Risk)", tone: "danger" };
}

export function confidenceScore(
  i: Inputs,
  s: Scores,
): {
  value: number;
  message: string;
  warning?: string;
} {
  // Three-component confidence: completeness, pattern clarity, outlier detection.
  // Every calculation is deterministic, transparent, and runs 100% in the browser.
  const total = weightedAverage(s);

  const completeness = calculateDataCompleteness(i);
  const clarity = calculatePatternClarity(i, total);
  const outlierScore = detectOutliers(i);

  const value = Math.round(completeness * 0.4 + clarity * 0.4 + outlierScore * 0.2);

  let message: string;
  let warning: string | undefined;

  if (value >= 80) {
    message = "High confidence — data patterns are clear and consistent";
  } else if (value >= 60) {
    message = "Moderate confidence — some data points are ambiguous";
    warning = "Consider collecting more historical data for better accuracy";
  } else {
    message = "Low confidence — insufficient data patterns detected";
    warning = "Low confidence due to incomplete or outlier data";
  }

  return { value, message, warning };
}

function calculateDataCompleteness(i: Inputs): number {
  let score = 100;

  if (i.budgetVariance > 50 || i.budgetVariance < -50) score -= 15;
  if (i.timelineVariance > 50 || i.timelineVariance < -50) score -= 15;
  if (i.riskCount > 50) score -= 20;
  if (i.scopeCreep > 20) score -= 15;
  if (i.resourceConflicts > 10) score -= 15;

  if (i.budgetVariance >= -10 && i.budgetVariance <= 10) score += 5;
  if (i.timelineVariance >= -10 && i.timelineVariance <= 10) score += 5;
  if (i.stakeholderSat >= 7 && i.stakeholderSat <= 9) score += 5;
  if (i.teamMorale >= 7 && i.teamMorale <= 9) score += 5;

  return Math.max(0, Math.min(100, score));
}

function calculatePatternClarity(i: Inputs, successProbability: number): number {
  let score = 100;

  if (successProbability >= 80) {
    if (i.budgetVariance > 10) score -= 20;
    if (i.timelineVariance > 10) score -= 20;
    if (i.riskCount > 20) score -= 25;
  }

  if (successProbability <= 40) {
    if (i.budgetVariance < -10) score -= 15;
    if (i.stakeholderSat >= 8) score -= 20;
    if (i.teamMorale >= 8) score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

function detectOutliers(i: Inputs): number {
  let score = 100;

  const values = [
    i.budgetVariance,
    i.timelineVariance,
    i.riskCount,
    i.stakeholderSat * 10,
    i.teamMorale * 10,
    i.scopeCreep * 5,
    i.resourceConflicts * 10,
  ];

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);

  for (const v of values) {
    if (Math.abs(v - mean) > 2 * stdDev) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function recommendations(i: Inputs, s: Scores): string[] {
  const recs: { score: number; text: string }[] = [];
  if (s.risk < 70)
    recs.push({
      score: 100 - s.risk,
      text: `Reduce risk exposure: prioritize and mitigate top 3 of your ${i.riskCount} active risks this week`,
    });
  if (s.morale < 75)
    recs.push({
      score: 90 - s.morale,
      text: "Boost team morale — run a retrospective and address top 2 blockers; consider 1 contractor to reduce burnout",
    });
  if (s.stakeholder < 80)
    recs.push({
      score: 95 - s.stakeholder,
      text: "Increase stakeholder communication cadence to weekly status + monthly steering reviews",
    });
  if (s.budget < 75)
    recs.push({
      score: 100 - s.budget,
      text: `Stabilize budget: re-baseline forecast (${i.budgetVariance > 0 ? "over" : "under"} by ${Math.abs(i.budgetVariance)}%) and freeze low-value scope`,
    });
  if (s.timeline < 75)
    recs.push({
      score: 100 - s.timeline,
      text: `Recover timeline: fast-track critical path (currently ${i.timelineVariance > 0 ? `${i.timelineVariance}% delayed` : "on track"}) and apply WIP limits`,
    });
  if (i.scopeCreep >= 3)
    recs.push({
      score: 60 + i.scopeCreep * 3,
      text: "Lock scope: enforce a change-control board for any new feature requests",
    });
  if (i.resourceConflicts >= 2)
    recs.push({
      score: 55 + i.resourceConflicts * 4,
      text: "Resolve resource conflicts: align BAU vs. project allocation with the PMO",
    });

  if (recs.length === 0)
    return [
      "Project is healthy — maintain current cadence",
      "Document lessons learned for the PMO knowledge base",
      "Celebrate the team — recognition sustains morale",
    ];

  return recs
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.text);
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}
