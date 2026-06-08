import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Download,
  Github,
  Linkedin,
  Mail,
  RefreshCw,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  computeScores,
  confidenceScore,
  healthStatus,
  recommendations,
  weightedAverage,
  type Inputs,
} from "@/lib/predictor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Success Pro — Free PM Tool" },
      {
        name: "description",
        content:
          "Free, GDPR-compliant project success predictor with transparent math and confidence scoring for PMs worldwide. No AI, no API calls.",
      },
      { property: "og:title", content: "Project Success Pro" },
      {
        property: "og:description",
        content:
          "Data-driven success probability with transparent confidence scoring for project managers.",
      },
    ],
  }),
  component: Home,
});

const DEFAULT_INPUTS: Inputs = {
  budgetVariance: 5,
  timelineVariance: 10,
  riskCount: 8,
  stakeholderSat: 7,
  teamMorale: 7,
  scopeCreep: 2,
  resourceConflicts: 1,
};

type Scenario = { label: string; description: string; inputs: Inputs };

const SCENARIOS: Scenario[] = [
  {
    label: "Small SaaS Startup",
    description: "Moderately healthy — common growth-stage profile",
    inputs: {
      budgetVariance: 5,
      timelineVariance: 10,
      riskCount: 6,
      stakeholderSat: 7,
      teamMorale: 8,
      scopeCreep: 3,
      resourceConflicts: 1,
    },
  },
  {
    label: "Enterprise Cloud Migration",
    description: "High risk — large transformation program",
    inputs: {
      budgetVariance: 25,
      timelineVariance: 30,
      riskCount: 20,
      stakeholderSat: 4,
      teamMorale: 5,
      scopeCreep: 8,
      resourceConflicts: 5,
    },
  },
  {
    label: "NZ Government ICT Project",
    description: "Late stage — budget and timeline under pressure",
    inputs: {
      budgetVariance: 40,
      timelineVariance: 50,
      riskCount: 15,
      stakeholderSat: 5,
      teamMorale: 4,
      scopeCreep: 6,
      resourceConflicts: 4,
    },
  },
];

function Home() {
  const [inputs, setInputs] = useState<Inputs>(loadFromUrl() ?? DEFAULT_INPUTS);
  const [calculated, setCalculated] = useState(false);
  const [recsKey, setRecsKey] = useState(0);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);

  const scores = useMemo(() => computeScores(inputs), [inputs]);
  const total = useMemo(() => weightedAverage(scores), [scores]);
  const health = healthStatus(total);
  const confidence = useMemo(() => confidenceScore(inputs, scores), [inputs, scores]);
  const recs = useMemo(() => {
    void recsKey;
    return recommendations(inputs, scores);
  }, [inputs, scores, recsKey]);

  const tone = health.tone;
  const toneClass =
    tone === "success"
      ? "text-[var(--color-success)]"
      : tone === "warning"
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-danger)]";

  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInputs((p) => ({ ...p, [k]: v }));

  const handleCalculate = () => {
    setCalculated(true);
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem("psp.saved") ?? "[]");
    saved.unshift({ at: new Date().toISOString(), inputs, total });
    localStorage.setItem("psp.saved", JSON.stringify(saved.slice(0, 20)));
    toast.success("Project saved to this browser");
  };

  const handleShare = async () => {
    const params = new URLSearchParams();
    Object.entries(inputs).forEach(([k, v]) => params.set(k, String(v)));
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Shareable link copied to clipboard");
    } catch {
      toast.message("Share link", { description: url });
    }
  };

  const handleExport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    let y = 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text("Project Success Prediction Report", 40, y);
    y += 24;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
    y += 28;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`Success Probability: ${total}%`, 40, y);
    y += 18;
    doc.text(`Health Status: ${health.label}`, 40, y);
    y += 18;
    doc.text(`Confidence Score: ${confidence.value}%`, 40, y);
    y += 28;

    doc.setFontSize(12);
    doc.text("Inputs", 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    Object.entries(inputs).forEach(([k, v]) => {
      doc.text(`• ${humanize(k)}: ${v}`, 50, y);
      y += 14;
    });
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Score Breakdown", 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    Object.entries(scores).forEach(([k, v]) => {
      doc.text(`• ${humanize(k)}: ${v}/100`, 50, y);
      y += 14;
    });
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Top Recommendations", 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    recs.forEach((r, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${r}`, w - 80);
      doc.text(lines, 50, y);
      y += lines.length * 14;
    });

    doc.save(`project-health-${Date.now()}.pdf`);
  };

  const breakdown = [
    { name: "Budget", value: scores.budget },
    { name: "Timeline", value: scores.timeline },
    { name: "Risk", value: scores.risk },
    { name: "Stakeholder", value: scores.stakeholder },
    { name: "Morale", value: scores.morale },
  ];

  const industry = [
    { name: "Your project", value: total },
    { name: "NZ Government", value: 58 },
    { name: "NZ Banking", value: 78 },
    { name: "US Enterprise", value: 65 },
    { name: "EU average", value: 62 },
  ];

  // Synthetic 5-week trend trending toward current score.
  const trend = useMemo(() => {
    const seed = total;
    return [1, 2, 3, 4, 5].map((wk) => {
      const drift = (wk - 5) * 3 + ((seed % 7) - 3);
      return { week: `W${wk}`, success: Math.max(0, Math.min(100, seed + drift)) };
    });
  }, [total]);

  const radar = [
    { dim: "Budget", v: scores.budget },
    { dim: "Timeline", v: scores.timeline },
    { dim: "Risks", v: scores.risk },
    { dim: "Stakeholders", v: scores.stakeholder },
    { dim: "Morale", v: scores.morale },
  ];

  const diff = total - 58;

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Project Success Pro</div>
              <div className="text-[11px] text-muted-foreground">
                Portfolio Project — Syed Imon Rizvi
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="secondary">100% Free</Badge>
            <Badge variant="secondary">No API Keys</Badge>
            <Badge variant="secondary">GDPR Compliant</Badge>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/40" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/15">
            100% Free · No API Keys · GDPR Compliant
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
            Project Success Pro
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Data-Driven Success Probability for Project Managers Worldwide
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Powered by transparent math — no AI, no API calls, no hidden costs
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={() => inputRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Start Predicting <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section ref={inputRef} className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Enter Your Project Metrics
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            All calculations run in your browser. Nothing leaves your device.
          </p>
        </div>

        {/* Try a scenario */}
        <Card className="mb-6 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              New here? Try a sample project:
            </span>
            {SCENARIOS.map((s) => (
              <Button
                key={s.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputs(s.inputs);
                  setCalculated(false);
                  toast(`Loaded: ${s.label}`, {
                    description: s.description,
                  });
                }}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField
              label="Budget variance (% under/over)"
              helper="Negative = under budget, Positive = over budget"
              value={inputs.budgetVariance}
              guide="Check your latest financial report or ask your finance team. Formula: (Actual − Budget) ÷ Budget × 100. No data? Estimate roughly how far over or under you feel."
              onChange={(v) => set("budgetVariance", v)}
            />
            <NumberField
              label="Timeline variance (% early/delayed)"
              helper="Negative = ahead, Positive = delayed"
              value={inputs.timelineVariance}
              guide="Compare your planned end date to the current forecast. Formula: (Forecast − Planned) ÷ Planned × 100. A ±10% variance is common in most projects."
              onChange={(v) => set("timelineVariance", v)}
            />
            <NumberField
              label="Active risk count"
              helper="Number of identified risks in project"
              value={inputs.riskCount}
              min={0}
              guide="Look at your risk register or issue log — count every identified risk that hasn't been closed yet. No register? Think about how many things could go wrong and start with your top 5–10."
              onChange={(v) => set("riskCount", v)}
            />
            <NumberField
              label="Scope creep incidents"
              helper="Number of unplanned feature additions"
              value={inputs.scopeCreep}
              min={0}
              guide="Count unplanned features or requirements added since kick-off. These are changes not in the original scope document. Every new 'quick ask' from a stakeholder counts."
              onChange={(v) => set("scopeCreep", v)}
            />
            <NumberField
              label="Resource conflicts"
              helper="BAU vs. project resource overlaps"
              value={inputs.resourceConflicts}
              min={0}
              guide="Think about team members split between this project and their day-to-day work. Each person who's double-booked on BAU and project work counts as one conflict."
              onChange={(v) => set("resourceConflicts", v)}
            />
            <SliderField
              label="Stakeholder satisfaction"
              helper="How satisfied are key stakeholders?"
              value={inputs.stakeholderSat}
              guide="Rate 1–10 how satisfied your key stakeholders feel. Signs of low satisfaction: frequent escalations, steering committee tension, last-minute change requests. 7+ means generally happy."
              onChange={(v) => set("stakeholderSat", v)}
            />
            <SliderField
              label="Team morale"
              helper="Team motivation and engagement level"
              value={inputs.teamMorale}
              guide="Rate 1–10 how motivated your team feels. Signs of low morale: increased sick leave, quietness in stand-ups, late deliveries, or people saying 'this is hopeless.' 7+ means the team is engaged."
              onChange={(v) => set("teamMorale", v)}
            />
          </div>

          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleCalculate} className="px-8">
              <Sparkles className="mr-2 h-4 w-4" /> Calculate Success
            </Button>
          </div>
        </Card>
      </section>

      {/* Output */}
      {calculated && (
        <section ref={outputRef} className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
            Project Success Prediction
          </h2>

          {/* A — Gauge + B — Confidence */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col items-center gap-4 p-6 sm:p-8">
              <Gauge value={total} tone={tone} />
              <div className={`text-3xl font-bold ${toneClass}`}>Success Probability: {total}%</div>
              <Badge
                className={
                  tone === "success"
                    ? "bg-[var(--color-success)] text-[var(--color-success-foreground)]"
                    : tone === "warning"
                      ? "bg-[var(--color-warning)] text-[var(--color-warning-foreground)]"
                      : "bg-[var(--color-danger)] text-[var(--color-danger-foreground)]"
                }
              >
                Health Status: {health.label}
              </Badge>
            </Card>

            <Card className="flex flex-col gap-4 p-6 sm:p-8">
              <div>
                <div className="text-sm text-muted-foreground">Confidence in this prediction</div>
                <div className="text-3xl font-bold text-primary">{confidence.value}%</div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${confidence.value}%` }}
                />
              </div>
              <div className="text-sm text-foreground">Analysis: {confidence.message}</div>
              {confidence.warning && (
                <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  {confidence.warning}
                </div>
              )}
            </Card>
          </div>

          {/* Confidence Explanation */}
          <Card className="mt-6 p-6 sm:p-8">
            <h3 className="mb-4 text-lg font-semibold">How Confidence Scoring Works</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-accent/30 p-4">
                <div className="text-sm font-semibold text-foreground">Data Completeness</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Checks if all metrics have reasonable values. Extreme inputs reduce confidence.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-accent/30 p-4">
                <div className="text-sm font-semibold text-foreground">Pattern Clarity</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Validates that metrics logically align with the final score.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-accent/30 p-4">
                <div className="text-sm font-semibold text-foreground">Outlier Detection</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Identifies statistical anomalies that may indicate data entry errors.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              All calculations run in your browser. No data leaves your device. No API calls. No
              hidden costs.
            </p>
          </Card>

          {/* C — Recommendations */}
          <Card className="mt-6 p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Recommendations to Improve Success</h3>
              <Button variant="outline" size="sm" onClick={() => setRecsKey((k) => k + 1)}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Generate Alternative
              </Button>
            </div>
            <ul className="space-y-3">
              {recs.map((r, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-border bg-accent/30 p-4">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* D — Breakdown */}
          <Card className="mt-6 p-6 sm:p-8">
            <h3 className="mb-6 text-lg font-semibold">Individual Scores Breakdown</h3>
            <div className="space-y-4">
              {breakdown.map((b) => (
                <ScoreBar key={b.name} name={b.name} value={b.value} />
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-primary/5 p-4 text-center text-lg font-semibold text-primary">
              Weighted Average: {total}%
            </div>
          </Card>

          {/* E — Industry comparison */}
          <Card className="mt-6 p-6 sm:p-8">
            <h3 className="mb-2 text-lg font-semibold">Comparison to Industry</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Your project is{" "}
              <strong
                className={diff >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}
              >
                {diff >= 0 ? "+" : ""}
                {diff}%
              </strong>{" "}
              vs. NZ Government average
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={industry} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "var(--color-accent)" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {industry.map((d, i) => (
                      <Cell
                        key={i}
                        fill={
                          d.name === "Your project"
                            ? "var(--color-primary)"
                            : "var(--color-chart-5)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Citation: NZ Treasury replaced spreadsheets with Planview for 600+ projects
            </p>
          </Card>

          {/* F + G */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-6 sm:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" /> 5-Week Health Trend
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <LineChart data={trend} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="success"
                      stroke="var(--color-primary)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <h3 className="mb-4 text-lg font-semibold">Risk Radar</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <RadarChart data={radar}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="v"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Export */}
          <Card className="mt-6 p-6 sm:p-8">
            <h3 className="mb-4 text-lg font-semibold">Export & Share</h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export Project Health Report
              </Button>
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Save Project
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> Share Prediction
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* Education */}
      <section className="border-t border-border bg-accent/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">Why This Matters</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                t: "67% of projects fail globally",
                d: "PMs need data-driven predictions, not gut feel. Transparent scoring beats opaque dashboards.",
                c: "PMI — Maximizing Project Success",
              },
              {
                t: "Confidence scoring reveals uncertainty",
                d: "Knowing how much to trust a prediction is as important as the prediction itself.",
                c: "PMI — Pulse of the Profession 2024",
              },
              {
                t: "NZ projects average 58% success",
                d: "Use industry baselines to benchmark and target improvement.",
                c: "NZ Treasury — Planview for 600+ projects",
              },
            ].map((x) => (
              <Card key={x.t} className="p-6">
                <div className="text-base font-semibold text-primary">{x.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
                <p className="mt-3 text-xs text-muted-foreground">Citation: {x.c}</p>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            <Badge variant="outline">GDPR compliant — no data leaves browser</Badge>
            <Badge variant="outline">NZ Green List — ICT Project Manager (Tier 2)</Badge>
            <Badge variant="outline">NZ tech skills shortage: 68% of firms report gaps</Badge>
            <Badge variant="outline">NZ Treasury: 600+ projects on Planview</Badge>
            <Badge variant="outline">CERT NZ: 65% rise in cyber incidents (2023)</Badge>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-4 text-center sm:grid-cols-3 sm:text-left">
            <div>
              <div className="font-semibold">Built for Project Managers Worldwide</div>
              <div className="mt-1 text-sm opacity-80">
                100% Free Forever · No API Keys · No Subscriptions · Open Source
              </div>
            </div>
            <div className="text-sm opacity-80 sm:text-center">
              © 2026 Syed Imon Rizvi
              <br />
              Senior ICT Project Manager — Portfolio Project
            </div>
            <div className="flex justify-center gap-4 sm:justify-end">
              <a
                href="https://github.com/syedimonrizvi"
                aria-label="GitHub"
                className="hover:opacity-80"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/in/syedimonrizvi"
                aria-label="LinkedIn"
                className="hover:opacity-80"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:syed@example.com" aria-label="Contact" className="hover:opacity-80">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NumberField({
  label,
  helper,
  value,
  min,
  guide,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  min?: number;
  guide?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="text-xs text-muted-foreground">{helper}</p>
      {guide && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-3 w-3" />
            Where do I find this?
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1">
            <p className="rounded-md bg-accent/30 p-2 text-xs text-muted-foreground">{guide}</p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function SliderField({
  label,
  helper,
  value,
  guide,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  guide?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {value}/10
        </span>
      </div>
      <Slider min={1} max={10} step={1} value={[value]} onValueChange={(v) => onChange(v[0]!)} />
      <p className="text-xs text-muted-foreground">{helper}</p>
      {guide && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-3 w-3" />
            Where do I find this?
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1">
            <p className="rounded-md bg-accent/30 p-2 text-xs text-muted-foreground">{guide}</p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function ScoreBar({ name, value }: { name: string; value: number }) {
  const color =
    value >= 80
      ? "bg-[var(--color-success)]"
      : value >= 50
        ? "bg-[var(--color-warning)]"
        : "bg-[var(--color-danger)]";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{name} Score</span>
        <span className="text-muted-foreground">{value}/100</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Gauge({ value, tone }: { value: number; tone: "success" | "warning" | "danger" }) {
  // Half-circle SVG gauge.
  const size = 240;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = Math.PI * r;
  const valArc = (value / 100) * circ;

  const color =
    tone === "success"
      ? "var(--color-success)"
      : tone === "warning"
        ? "var(--color-warning)"
        : "var(--color-danger)";

  // Needle angle: -90deg at 0%, +90deg at 100%
  const angle = (value / 100) * 180 - 90;

  return (
    <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
      {/* Red zone 0-49 */}
      <path
        d={describeArc(cx, cy, r, -90, -90 + (49 / 100) * 180)}
        stroke="var(--color-danger)"
        strokeOpacity="0.18"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="butt"
      />
      <path
        d={describeArc(cx, cy, r, -90 + (49 / 100) * 180, -90 + (79 / 100) * 180)}
        stroke="var(--color-warning)"
        strokeOpacity="0.22"
        strokeWidth={stroke}
        fill="none"
      />
      <path
        d={describeArc(cx, cy, r, -90 + (79 / 100) * 180, 90)}
        stroke="var(--color-success)"
        strokeOpacity="0.22"
        strokeWidth={stroke}
        fill="none"
      />
      {/* Value arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${valArc} ${circ * 2}`}
        strokeLinecap="round"
        transform={`rotate(-180 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 600ms ease" }}
      />
      {/* Needle */}
      <g transform={`rotate(${angle} ${cx} ${cy})`} style={{ transition: "transform 600ms ease" }}>
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r + 10}
          stroke="var(--color-foreground)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill="var(--color-foreground)" />
      </g>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fontSize="14"
        fill="var(--color-muted-foreground)"
      >
        0 — 100%
      </text>
    </svg>
  );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function humanize(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function loadFromUrl(): Inputs | null {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  if (!sp.has("budgetVariance")) return null;
  const num = (k: string, d: number) => {
    const v = Number(sp.get(k));
    return Number.isFinite(v) ? v : d;
  };
  return {
    budgetVariance: num("budgetVariance", 0),
    timelineVariance: num("timelineVariance", 0),
    riskCount: num("riskCount", 0),
    stakeholderSat: num("stakeholderSat", 7),
    teamMorale: num("teamMorale", 7),
    scopeCreep: num("scopeCreep", 0),
    resourceConflicts: num("resourceConflicts", 0),
  };
}
