import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChartState } from "@/components/ui/chart-states";
import { Columns } from "@/components/ui/columns";
import { Comparison } from "@/components/ui/comparison";
import { DataTable, type DataColumn } from "@/components/ui/data-table";
import { Empty } from "@/components/ui/empty";
import { Meter } from "@/components/ui/meter";
import { Period } from "@/components/ui/period";
import { RadialKpi } from "@/components/ui/radial-kpi";
import { Ranking } from "@/components/ui/ranking";
import { Stat, StatGroup } from "@/components/ui/stat";
import { Table, type TableColumn } from "@/components/ui/table";
import { TimeSeries } from "@/components/ui/time-series";
import { toast } from "@/components/ui/toast";
import { formatDollars, formatInteger } from "@/lib/format";
import { monthLabels, reportRanges, type DateRange, type ReportPeriod } from "@/lib/report-period";
import { locale, messages } from "@/messages";

import { Piece, Sector, State } from "../Piece";
import { SectionPage } from "./SectionPage";

const t = messages.workbench.demos.data;
const units = t.units;

// ── Demo data: a generic SaaS, made up and deterministic ────────────────────

/** Today in the viewer's calendar, so the demo periods always end yesterday. */
function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const TODAY = localToday();

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const utcMs = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));

/** Every day of a range, as ISO dates. */
function daysOf({ from, to }: DateRange): string[] {
  const days: string[] = [];
  for (let ms = utcMs(from); ms <= utcMs(to); ms += 86_400_000) days.push(isoDay(ms));
  return days;
}

/** Every month of a range, as `YYYY-MM`. */
function monthsOf({ from, to }: DateRange): string[] {
  const index = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
  const months: string[] = [];
  for (let i = index(from); i <= index(to); i++) months.push(`${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`);
  return months;
}

/** A plausible, repeatable curve: a trend plus two waves. */
function curve(n: number, base: number, growth: number, amplitude: number, seed: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.round(base + growth * i + amplitude * Math.sin(i * 0.9 + seed) + amplitude * 0.5 * Math.sin(i * 2.3 + seed * 2))),
  );
}

const DAYS = daysOf(reportRanges("30d", TODAY)!.current);
const MONTHS = monthsOf(reportRanges("12m", TODAY)!.current).map(monthLabels);
const VISITORS = curve(DAYS.length, 320, 6, 40, 1);
const NORTH = curve(DAYS.length, 180, 3, 25, 2);
const SOUTH = curve(DAYS.length, 120, 1.5, 20, 4);
const SIGNUPS = curve(MONTHS.length, 60, 7, 12, 3);

const usDate = new Intl.DateTimeFormat(locale, { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "UTC" });

// ── Table ──────────────────────────────────────────────────────────────────

type RegionRow = { region: string; accounts: number; visitors: number; revenue: number };

const REGION_ROWS: RegionRow[] = t.regions.map((region, i) => ({
  region,
  accounts: [412, 286, 198, 131][i]!,
  visitors: [18_240, 12_975, 9_310, 6_402][i]!,
  revenue: [48_600, 31_250, 22_980, 14_105][i]!,
}));

const REGION_COLUMNS: TableColumn<RegionRow>[] = [
  { id: "region", header: t.table.region, cell: (r) => r.region, primary: true },
  { id: "accounts", header: t.table.accounts, cell: (r) => formatInteger(r.accounts), align: "end" },
  { id: "visitors", header: t.table.visitors, cell: (r) => formatInteger(r.visitors), align: "end" },
  { id: "revenue", header: t.table.revenue, cell: (r) => formatDollars(r.revenue), align: "end" },
];

// ── Data table ─────────────────────────────────────────────────────────────

type Account = { id: string; name: string; plan: string; region: string; since: string; seats: number; mrr: number };

const PRICE: Record<string, number> = { Free: 0, Pro: 12, Team: 20, Enterprise: 35 };

const ACCOUNTS: Account[] = t.dataTable.names.map((name, i) => {
  const plan = t.dataTable.plans[(i * 3) % 4]!;
  const seats = 1 + ((i * 7) % 23);
  return {
    id: String(i + 1),
    name,
    plan,
    region: t.regions[(i * 5 + 1) % 4]!,
    since: isoDay(Date.UTC(2023, 0, 15) + i * 47 * 86_400_000),
    seats,
    mrr: (PRICE[plan] ?? 0) * seats,
  };
});

const toOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

const ACCOUNT_COLUMNS: DataColumn<Account>[] = [
  { id: "name", header: t.dataTable.account, cell: (a) => a.name, value: (a) => a.name, primary: true },
  {
    id: "plan",
    header: t.dataTable.plan,
    cell: (a) => a.plan,
    value: (a) => a.plan,
    filter: { options: toOptions(t.dataTable.plans) },
  },
  {
    id: "region",
    header: t.dataTable.region,
    cell: (a) => a.region,
    value: (a) => a.region,
    filter: { options: toOptions(t.regions) },
  },
  {
    id: "since",
    header: t.dataTable.since,
    cell: (a) => usDate.format(new Date(utcMs(a.since))),
    value: (a) => a.since,
    align: "end",
  },
  { id: "seats", header: t.dataTable.seats, cell: (a) => formatInteger(a.seats), value: (a) => a.seats, align: "end" },
  { id: "mrr", header: t.dataTable.mrr, cell: (a) => formatDollars(a.mrr), value: (a) => a.mrr, align: "end" },
];

// ── Period ─────────────────────────────────────────────────────────────────

function PeriodDemo({ name }: { name: string }) {
  const [value, setValue] = useState<ReportPeriod>("30d");
  return <Period value={value} onValueChange={setValue} today={TODAY} name={name} />;
}

export function DataPage() {
  const first = VISITORS[0]!;
  const last = VISITORS[VISITORS.length - 1]!;
  const visitorsTotal = VISITORS.reduce((a, v) => a + v, 0);
  const channels = t.comparison.channels.map((label, i) => ({ label, value: [212, 148, 96, 61, 34][i]! }));
  const regionVisitors = t.regions.map((label, i) => ({ label, value: [18_240, 12_975, 9_310, 6_402][i]! }));
  const regionSignups = t.regions.map((label, i) => ({ label, value: [86, 34, 21, 3][i]! }));
  const sources = t.ranking.sources.map((label, i) => ({ label, value: [4_120, 2_310, 1_480, 1_150, 640, 410, 220, 95][i]! }));

  return (
    <SectionPage id="data">
      <Sector title={t.sectors.tables.title} summary={t.sectors.tables.summary}>
        <Piece id="table">
          <State label={t.table.regular} note={t.table.regularNote} wide>
            <Table caption={t.table.caption} columns={REGION_COLUMNS} rows={REGION_ROWS} rowKey={(r) => r.region} />
          </State>
          <State label={t.table.empty} note={t.table.emptyNote} wide>
            <Table
              caption={t.table.caption}
              columns={REGION_COLUMNS}
              rows={[]}
              rowKey={(r) => r.region}
              empty={<Empty title={t.table.emptyTitle} description={t.table.emptyHint} />}
            />
          </State>
        </Piece>

        <Piece id="data-table">
          <State label={t.dataTable.label} note={t.dataTable.note} wide>
            <DataTable
              caption={t.dataTable.caption}
              hiddenCaption
              columns={ACCOUNT_COLUMNS}
              rows={ACCOUNTS}
              rowKey={(a) => a.id}
              searchLabel={t.dataTable.search}
              searchPlaceholder={t.dataTable.searchPlaceholder}
            />
          </State>
        </Piece>
      </Sector>

      <Sector title={t.sectors.numbers.title} summary={t.sectors.numbers.summary}>
        <Piece id="stat">
          <State label={t.stat.panel} note={t.stat.panelNote} wide>
            <StatGroup label={t.stat.groupLabel} className="w-full">
              <Stat
                label={t.stat.visitors}
                value={visitorsTotal}
                comparison={{ previous: Math.round(visitorsTotal / 1.12), to: t.stat.toPrevious }}
                trend={{ values: VISITORS, label: t.stat.visitorsTrend(formatInteger(first), formatInteger(last)) }}
              />
              <Stat label={t.stat.signups} value={412} comparison={{ previous: 448, to: t.stat.toPrevious }} />
              <Stat
                label={t.stat.tickets}
                value={86}
                comparison={{ previous: 104, to: t.stat.toPrevious, higherIsBetter: false }}
              />
              <Stat label={t.stat.refunds} value={null} />
            </StatGroup>
          </State>
          <State label={t.stat.showcase} note={t.stat.showcaseNote} wide>
            <StatGroup label={t.stat.showcaseLabel} variant="showcase" className="w-full">
              <Stat label={t.stat.accounts} value={69_842} rounding="thousands" detail={t.stat.accountsDetail} />
              <Stat label={t.stat.countries} value={23} detail={t.stat.countriesDetail} />
              <Stat label={t.stat.integrations} value={140} detail={t.stat.integrationsDetail} />
              <Stat label={t.stat.replies} value={1_204} detail={t.stat.repliesDetail} />
            </StatGroup>
          </State>
        </Piece>

        <Piece id="meter">
          <State label={t.meter.goal} note={t.meter.goalNote}>
            <div className="w-full space-y-5">
              <Meter label={t.meter.signups} value={96} target={120} unit={units.signups} />
              <Meter label={t.meter.trials} value={239} target={240} unit={units.trials} />
            </div>
          </State>
          <State label={t.meter.past} note={t.meter.pastNote}>
            <div className="w-full space-y-5">
              <Meter label={t.meter.reached} value={132} target={120} unit={units.upgrades} />
            </div>
          </State>
          <State label={t.meter.limit} note={t.meter.limitNote}>
            <div className="w-full space-y-5">
              <Meter label={t.meter.seats} value={8} target={10} unit={units.seats} kind="limit" />
            </div>
          </State>
        </Piece>

        <Piece id="radial-kpi">
          <State label={t.radialKpi.below} note={t.radialKpi.belowNote}>
            <RadialKpi
              title={t.radialKpi.title}
              description={t.radialKpi.description}
              value={34}
              target={45}
              unit={units.signups}
              comparison={{ previous: 30, to: t.radialKpi.toPrevious }}
              facts={[
                { label: t.radialKpi.goal, value: 45 },
                { label: t.radialKpi.done, value: 34 },
                { label: t.radialKpi.today, value: 3 },
              ]}
              className="max-w-sm"
            />
          </State>
          <State label={t.radialKpi.past} note={t.radialKpi.pastNote}>
            <RadialKpi
              title={t.radialKpi.upgrades}
              description={t.radialKpi.upgradesDescription}
              value={60}
              target={45}
              unit={units.upgrades}
              className="max-w-sm"
            />
          </State>
        </Piece>

        <Piece id="period">
          <State label={t.period.full} note={t.period.fullNote} wide>
            <PeriodDemo name="period-full" />
          </State>
          <State label={t.period.column} note={t.period.columnNote}>
            <PeriodDemo name="period-column" />
          </State>
        </Piece>
      </Sector>

      <Sector title={t.sectors.charts.title} summary={t.sectors.charts.summary}>
        <Piece id="time-series">
          <State label={t.timeSeries.area} note={t.timeSeries.areaNote} wide>
            <TimeSeries title={t.timeSeries.visitors} dates={DAYS} series={[{ label: t.table.visitors, values: VISITORS }]} unit={units.visitors} area />
          </State>
          <State label={t.timeSeries.two} note={t.timeSeries.twoNote} wide>
            <TimeSeries
              title={t.timeSeries.byRegion}
              dates={DAYS}
              series={[
                { label: t.regions[0]!, values: NORTH },
                { label: t.regions[1]!, values: SOUTH },
              ]}
              unit={units.visitors}
            />
          </State>
        </Piece>

        <Piece id="columns">
          <State label={t.columns.one} note={t.columns.oneNote} wide>
            <Columns title={t.columns.signups} categories={MONTHS} series={[{ label: t.stat.signups, values: SIGNUPS }]} unit={units.signups} />
          </State>
          <State label={t.columns.two} note={t.columns.twoNote} wide>
            <Columns
              title={t.columns.byPlan}
              categories={MONTHS.slice(-6)}
              series={[
                { label: t.columns.free, values: SIGNUPS.slice(-6) },
                { label: t.columns.paid, values: SIGNUPS.slice(-6).map((v) => Math.round(v * 0.45)) },
              ]}
              unit={units.signups}
            />
          </State>
        </Piece>

        <Piece id="comparison">
          <State label={t.comparison.soft} note={t.comparison.softNote}>
            <Comparison
              title={t.comparison.signups}
              items={channels}
              valueLabel={t.comparison.valueSignups}
              unit={units.signups}
              highlight={t.comparison.channels[0]}
              categoryHeader={t.comparison.channel}
            />
          </State>
          <State label={t.comparison.second} note={t.comparison.secondNote}>
            <Comparison
              title={t.comparison.visitors}
              items={regionVisitors}
              valueLabel={t.comparison.valueVisitors}
              unit={units.visitors}
              highlight={t.regions[2]}
              others="second"
              categoryHeader={t.comparison.region}
            />
          </State>
        </Piece>

        <Piece id="ranking">
          <State label={t.ranking.all} note={t.ranking.allNote}>
            <Ranking title={t.ranking.byRegion} items={regionSignups} unit={units.signups} />
          </State>
          <State label={t.ranking.folded} note={t.ranking.foldedNote}>
            <Ranking title={t.ranking.bySource} items={sources} unit={units.visitors} limit={4} />
          </State>
        </Piece>

        <Piece id="chart-states">
          <State label={t.chartStates.loadingPlot} note={t.chartStates.loadingPlotNote}>
            <ChartState title={t.chartStates.visitors} shape="plot" state="loading" />
          </State>
          <State label={t.chartStates.loadingBars} note={t.chartStates.loadingBarsNote}>
            <ChartState title={t.chartStates.regions} shape="bars" state="loading" rows={4} />
          </State>
          <State label={t.chartStates.empty} note={t.chartStates.emptyNote}>
            <ChartState
              title={t.chartStates.signups}
              shape="plot"
              state="empty"
              message={t.chartStates.emptyMessage}
              description={t.chartStates.emptyHint}
            >
              <Button variant="secondary" size="sm" onClick={() => toast(t.chartStates.switching)}>
                {t.chartStates.showYear}
              </Button>
            </ChartState>
          </State>
          <State label={t.chartStates.error} note={t.chartStates.errorNote}>
            <ChartState
              title={t.chartStates.revenue}
              shape="plot"
              state="error"
              description={t.chartStates.errorHint}
              onRetry={() => toast(t.chartStates.retrying)}
              code="req_3c91d0e4"
              alive={false}
            />
          </State>
        </Piece>
      </Sector>
    </SectionPage>
  );
}
