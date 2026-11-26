import { useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { Stat, StatGroup, type StatTrend } from "@/components/ui/stat";
import { Table, type TableColumn } from "@/components/ui/table";
import { TimeSeries } from "@/components/ui/time-series";
import { toast } from "@/components/ui/toast";
import { formatDollars, formatInteger } from "@/lib/format";
import type { ReportPeriod } from "@/lib/report-period";
import { locale, messages } from "@/messages";

import { Piece, PieceNote, Sector, State } from "../Piece";
import { SectionPage } from "./SectionPage";
import {
  CHANNEL_SIGNUPS,
  DAYS,
  DEMO_DAILY,
  MONTHS_12,
  MONTHS_THIS_YEAR,
  NORTH_SOURCE_VISITORS,
  REGION_DEMO_REQUESTS,
  REGION_REVENUE,
  REGION_SIGNUPS,
  REGION_VISITORS,
  SIGNUPS_12,
  SIGNUPS_DAILY,
  SIGNUPS_FREE,
  SIGNUPS_PAID,
  SIGNUPS_THIS_YEAR,
  SOURCE_VISITORS,
  TICKETS_DAILY,
  TODAY,
  TOTALS,
  UPGRADES_DAILY,
  VISITORS,
  VISITORS_NORTH,
  VISITORS_SOUTH,
} from "./data-demo";

const t = messages.workbench.demos.data;
const units = t.units;

/** A trend for a stat card, named from its first and last day. */
const trendOf = (what: string, values: readonly number[]): StatTrend => ({
  values,
  label: t.stat.trend(what, formatInteger(values[0]!), formatInteger(values.at(-1)!)),
});

/** The comparison every stat card on this page makes. */
const vsAugust = (previous: number, higherIsBetter?: boolean) => ({ previous, to: t.stat.toAugust, higherIsBetter });

const pair = <T,>(labels: readonly string[], values: readonly T[]) => labels.map((label, i) => ({ label, value: values[i]! }));

// ── Table ──────────────────────────────────────────────────────────────────

type RegionRow = { region: string; manager: string; visitors: number; signups: number; revenue: number };

const REGION_ROWS: RegionRow[] = t.regions.map((region, i) => ({
  region,
  manager: t.table.managers[i]!,
  visitors: REGION_VISITORS[i]!,
  signups: REGION_SIGNUPS[i]!,
  revenue: REGION_REVENUE[i]!,
}));

const REGION_COLUMNS: TableColumn<RegionRow>[] = [
  { id: "region", header: t.table.region, cell: (r) => r.region, primary: true },
  { id: "manager", header: t.table.manager, cell: (r) => r.manager },
  { id: "visitors", header: t.table.visitors, cell: (r) => formatInteger(r.visitors), align: "end" },
  { id: "signups", header: t.table.signups, cell: (r) => formatInteger(r.signups), align: "end" },
  { id: "revenue", header: t.table.revenue, cell: (r) => formatDollars(r.revenue), align: "end" },
];

// ── Data table ─────────────────────────────────────────────────────────────

type Account = { id: string; name: string; plan: string; region: string; since: string; seats: number; mrr: number };

const PRICE: Record<string, number> = { Free: 0, Pro: 12, Team: 20, Enterprise: 35 };
const usDate = new Intl.DateTimeFormat(locale, { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "UTC" });

const ACCOUNTS: Account[] = t.dataTable.names.map((name, i) => {
  const plan = t.dataTable.plans[(i * 3) % 4]!;
  const seats = 1 + ((i * 7) % 23);
  return {
    id: String(i + 1),
    name,
    plan,
    region: t.regions[(i * 5 + 1) % 4]!,
    since: new Date(Date.UTC(2023, 0, 15) + i * 47 * 86_400_000).toISOString().slice(0, 10),
    seats,
    mrr: (PRICE[plan] ?? 0) * seats,
  };
});

const ENTERPRISE = ACCOUNTS.filter((a) => a.plan === "Enterprise");

const toOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

const ACCOUNT_COLUMNS: DataColumn<Account>[] = [
  { id: "name", header: t.dataTable.account, cell: (a) => a.name, value: (a) => a.name, primary: true },
  {
    id: "plan",
    header: t.dataTable.plan,
    cell: (a) => <Badge>{a.plan}</Badge>,
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
    cell: (a) => usDate.format(new Date(`${a.since}T00:00:00Z`)),
    value: (a) => a.since,
    align: "end",
  },
  { id: "seats", header: t.dataTable.seats, cell: (a) => formatInteger(a.seats), value: (a) => a.seats, align: "end" },
  { id: "mrr", header: t.dataTable.mrr, cell: (a) => formatDollars(a.mrr), value: (a) => a.mrr, align: "end" },
];

// ── Period ─────────────────────────────────────────────────────────────────

function PeriodDemo({ name, initial = "30d", today = TODAY }: { name: string; initial?: ReportPeriod; today?: string }) {
  const [value, setValue] = useState<ReportPeriod>(initial);
  return <Period value={value} onValueChange={setValue} today={today} name={name} />;
}

// ── The page ───────────────────────────────────────────────────────────────

const VISITORS_TREND = trendOf(t.stat.visitors, VISITORS);
const SIGNUPS_TREND = trendOf(t.stat.signups, SIGNUPS_DAILY);
const UPGRADES_TREND = trendOf(t.stat.upgrades, UPGRADES_DAILY);
const DEMO_TREND = trendOf(t.stat.demoRequests, DEMO_DAILY);
const TICKETS_TREND = trendOf(t.stat.tickets, TICKETS_DAILY);

const CHANNELS = pair(t.comparison.channels, CHANNEL_SIGNUPS);
const REGIONS_BY_VISITORS = pair(t.regions, REGION_VISITORS);
const VISITOR_SERIES = [{ label: t.table.visitors, values: VISITORS }] as const;

export function DataPage() {
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
          <PieceNote paragraphs={t.table.explain} />
        </Piece>

        <Piece id="data-table">
          <State label={t.dataTable.label} note={t.dataTable.note} wide>
            <DataTable
              caption={t.dataTable.caption}
              columns={ACCOUNT_COLUMNS}
              rows={ACCOUNTS}
              rowKey={(a) => a.id}
              searchLabel={t.dataTable.search}
              searchPlaceholder={t.dataTable.searchPlaceholder}
            />
          </State>
          <State label={t.dataTable.few} note={t.dataTable.fewNote} wide>
            <DataTable
              caption={t.dataTable.fewCaption}
              columns={ACCOUNT_COLUMNS}
              rows={ENTERPRISE}
              rowKey={(a) => a.id}
              searchLabel={t.dataTable.search}
              searchPlaceholder={t.dataTable.searchPlaceholder}
            />
          </State>
          <PieceNote paragraphs={t.dataTable.explain} />
        </Piece>
      </Sector>

      <Sector title={t.sectors.numbers.title} summary={t.sectors.numbers.summary}>
        <Piece id="stat">
          <State label={t.stat.up} note={t.stat.upNote}>
            <Stat className="w-full" label={t.stat.visitors} value={TOTALS.visitors.september} comparison={vsAugust(TOTALS.visitors.august)} trend={VISITORS_TREND} />
          </State>
          <State label={t.stat.down} note={t.stat.downNote}>
            <Stat className="w-full" label={t.stat.signups} value={TOTALS.signups.september} comparison={vsAugust(TOTALS.signups.august)} trend={SIGNUPS_TREND} />
          </State>
          <State label={t.stat.downGood} note={t.stat.downGoodNote}>
            <Stat
              className="w-full"
              label={t.stat.tickets}
              value={TOTALS.tickets.september}
              comparison={vsAugust(TOTALS.tickets.august, false)}
              trend={TICKETS_TREND}
            />
          </State>
          <State label={t.stat.flat} note={t.stat.flatNote}>
            <Stat className="w-full" label={t.stat.upgrades} value={TOTALS.upgrades.september} comparison={vsAugust(TOTALS.upgrades.august)} trend={UPGRADES_TREND} />
          </State>
          <State label={t.stat.noBase} note={t.stat.noBaseNote} fill>
            <Stat
              className="w-full"
              label={t.stat.demoRequests}
              value={TOTALS.demoRequests.september}
              comparison={vsAugust(TOTALS.demoRequests.august)}
              trend={DEMO_TREND}
            />
          </State>
          <State label={t.stat.noData} note={t.stat.noDataNote} fill>
            <Stat className="w-full" label={t.stat.refunds} value={null} trend={{ values: [], label: t.stat.refunds }} />
          </State>
          <PieceNote paragraphs={t.stat.explain} />
        </Piece>

        <Piece id="stat-group">
          <State label={t.statGroup.panel} note={t.statGroup.panelNote} wide>
            <StatGroup label={t.statGroup.groupLabel} className="w-full">
              <Stat label={t.stat.visitors} value={TOTALS.visitors.september} comparison={vsAugust(TOTALS.visitors.august)} trend={VISITORS_TREND} />
              <Stat label={t.stat.signups} value={TOTALS.signups.september} comparison={vsAugust(TOTALS.signups.august)} trend={SIGNUPS_TREND} />
              <Stat
                label={t.statGroup.upgradesLong}
                value={TOTALS.upgrades.september}
                comparison={vsAugust(TOTALS.upgrades.august)}
                trend={UPGRADES_TREND}
              />
              <Stat
                label={t.stat.demoRequests}
                value={TOTALS.demoRequests.september}
                comparison={vsAugust(TOTALS.demoRequests.august)}
                trend={DEMO_TREND}
              />
            </StatGroup>
          </State>
          <State label={t.statGroup.showcase} note={t.statGroup.showcaseNote} wide>
            <StatGroup label={t.statGroup.showcaseLabel} variant="showcase" className="w-full">
              <Stat label={t.statGroup.accounts} value={69_842} rounding="thousands" detail={t.statGroup.accountsDetail} />
              <Stat label={t.statGroup.countries} value={23} detail={t.statGroup.countriesDetail} />
              <Stat label={t.statGroup.integrations} value={140} detail={t.statGroup.integrationsDetail} />
              <Stat label={t.statGroup.replies} value={1_204} detail={t.statGroup.repliesDetail} />
            </StatGroup>
          </State>
          <PieceNote paragraphs={t.statGroup.explain} />
        </Piece>
      </Sector>

      <Sector title={t.sectors.charts.title} summary={t.sectors.charts.summary}>
        <Piece id="time-series">
          <State label={t.timeSeries.area} note={t.timeSeries.areaNote} wide>
            <TimeSeries title={t.timeSeries.visitors} dates={DAYS} series={VISITOR_SERIES} unit={units.visitors} area />
          </State>
          <State label={t.timeSeries.two} note={t.timeSeries.twoNote} wide>
            <TimeSeries
              title={t.timeSeries.byRegion}
              dates={DAYS}
              series={[
                { label: t.regions[0]!, values: VISITORS_NORTH },
                { label: t.regions[1]!, values: VISITORS_SOUTH },
              ]}
              unit={units.visitors}
            />
          </State>
          <State label={t.timeSeries.seven} note={t.timeSeries.sevenNote}>
            <TimeSeries
              title={t.timeSeries.week}
              dates={DAYS.slice(-7)}
              series={[{ label: t.table.visitors, values: VISITORS.slice(-7) }]}
              unit={units.visitors}
              area
            />
          </State>
          <State label={t.timeSeries.one} note={t.timeSeries.oneNote}>
            <TimeSeries
              title={t.timeSeries.day}
              dates={DAYS.slice(-1)}
              series={[{ label: t.table.visitors, values: VISITORS.slice(-1) }]}
              unit={units.visitors}
              area
            />
          </State>
          <PieceNote paragraphs={t.timeSeries.explain} />
        </Piece>

        <Piece id="columns">
          <State label={t.columns.one} note={t.columns.oneNote} wide>
            <Columns title={t.columns.signups} categories={MONTHS_THIS_YEAR} series={[{ label: t.stat.signups, values: SIGNUPS_THIS_YEAR }]} unit={units.signups} />
          </State>
          <State label={t.columns.two} note={t.columns.twoNote} wide>
            <Columns
              title={t.columns.byPlan}
              categories={MONTHS_THIS_YEAR}
              series={[
                { label: t.columns.free, values: SIGNUPS_FREE },
                { label: t.columns.paid, values: SIGNUPS_PAID },
              ]}
              unit={units.signups}
            />
          </State>
          <State label={t.columns.twelve} note={t.columns.twelveNote} wide>
            <Columns title={t.columns.year} categories={MONTHS_12} series={[{ label: t.stat.signups, values: SIGNUPS_12 }]} unit={units.signups} />
          </State>
          <PieceNote paragraphs={t.columns.explain} />
        </Piece>

        <Piece id="comparison">
          <State label={t.comparison.top} note={t.comparison.topNote}>
            <Comparison
              title={t.comparison.signups}
              items={CHANNELS}
              valueLabel={t.comparison.valueSignups}
              unit={units.signups}
              highlight={t.comparison.channels[1]}
              categoryHeader={t.comparison.channel}
            />
          </State>
          <State label={t.comparison.soft} note={t.comparison.softNote}>
            <Comparison
              title={t.comparison.visitors}
              items={REGIONS_BY_VISITORS}
              valueLabel={t.comparison.valueVisitors}
              unit={units.visitors}
              highlight={t.regions[2]}
              categoryHeader={t.comparison.region}
            />
          </State>
          <State label={t.comparison.second} note={t.comparison.secondNote}>
            <Comparison
              title={t.comparison.visitors}
              items={REGIONS_BY_VISITORS}
              valueLabel={t.comparison.valueVisitors}
              unit={units.visitors}
              highlight={t.regions[2]}
              others="second"
              categoryHeader={t.comparison.region}
            />
          </State>
          <State label={t.comparison.zero} note={t.comparison.zeroNote}>
            <Comparison
              title={t.comparison.signups}
              items={[...CHANNELS, { label: t.comparison.zeroChannel, value: 0 }]}
              valueLabel={t.comparison.valueSignups}
              unit={units.signups}
              categoryHeader={t.comparison.channel}
            />
          </State>
          <PieceNote paragraphs={t.comparison.explain} />
        </Piece>

        <Piece id="ranking">
          <State label={t.ranking.all} note={t.ranking.allNote}>
            <Ranking title={t.ranking.byRegion} items={pair(t.regions, REGION_SIGNUPS)} unit={units.signups} />
          </State>
          <State label={t.ranking.tie} note={t.ranking.tieNote}>
            <Ranking title={t.ranking.demoByRegion} items={pair(t.regions, REGION_DEMO_REQUESTS)} unit={units.requests} />
          </State>
          <State label={t.ranking.folded} note={t.ranking.foldedNote}>
            <Ranking
              title={t.ranking.bySource}
              items={pair(t.ranking.sources, SOURCE_VISITORS)}
              unit={units.visitors}
              limit={4}
              othersLabel={t.ranking.moreSources}
            />
          </State>
          <State label={t.ranking.small} note={t.ranking.smallNote}>
            <Ranking title={t.ranking.northBySource} items={pair(t.ranking.northSources, NORTH_SOURCE_VISITORS)} unit={units.visitors} />
          </State>
          <PieceNote paragraphs={t.ranking.explain} />
        </Piece>
      </Sector>

      <Sector title={t.sectors.dashboard.title} summary={t.sectors.dashboard.summary}>
        <Piece id="period">
          <State label={t.period.thirty} note={t.period.thirtyNote} wide>
            <PeriodDemo name="period-30" />
          </State>
          <State label={t.period.seven} note={t.period.sevenNote}>
            <PeriodDemo name="period-7" initial="7d" />
          </State>
          <State label={t.period.twelve} note={t.period.twelveNote}>
            <PeriodDemo name="period-12" initial="12m" />
          </State>
          <State label={t.period.rollover} note={t.period.rolloverNote} wide>
            <PeriodDemo name="period-rollover" initial="7d" today="2026-01-03" />
          </State>
          <PieceNote paragraphs={t.period.explain} />
        </Piece>

        <Piece id="meter">
          <State label={t.meter.goal} note={t.meter.goalNote}>
            <Meter label={t.meter.signups} value={TOTALS.signups.september} target={120} unit={units.signups} />
          </State>
          <State label={t.meter.past} note={t.meter.pastNote}>
            <Meter label={t.meter.visitors} value={TOTALS.visitors.september} target={1_000} unit={units.visitors} />
          </State>
          <State label={t.meter.almost} note={t.meter.almostNote}>
            <Meter label={t.meter.trials} value={239} target={240} unit={units.trials} />
          </State>
          <State label={t.meter.limit} note={t.meter.limitNote}>
            <Meter label={t.meter.seatsDesign} value={8} target={10} unit={units.seats} kind="limit" />
          </State>
          <State label={t.meter.atLimit} note={t.meter.atLimitNote}>
            <Meter label={t.meter.seatsSales} value={10} target={10} unit={units.seats} kind="limit" />
          </State>
          <State label={t.meter.far} note={t.meter.farNote}>
            <Meter label={t.meter.seatsSupport} value={1} target={10} unit={units.seats} kind="limit" />
          </State>
          <PieceNote paragraphs={t.meter.explain} />
        </Piece>

        <Piece id="radial-kpi">
          <State label={t.radialKpi.below} note={t.radialKpi.belowNote}>
            <RadialKpi
              title={t.radialKpi.calls}
              description={t.radialKpi.callsDescription}
              value={34}
              target={45}
              unit={units.calls}
              comparison={vsAugust(31)}
              facts={[
                { label: t.radialKpi.goal, value: 45 },
                { label: t.radialKpi.done, value: 34 },
                { label: t.radialKpi.lastWeek, value: 8 },
              ]}
              className="h-full"
            />
          </State>
          <State label={t.radialKpi.past} note={t.radialKpi.pastNote}>
            <RadialKpi
              title={t.radialKpi.upgrades}
              description={t.radialKpi.upgradesDescription}
              value={TOTALS.upgrades.september}
              target={45}
              unit={units.upgrades}
              comparison={vsAugust(TOTALS.upgrades.august)}
              facts={[
                { label: t.radialKpi.goal, value: 45 },
                { label: t.radialKpi.done, value: TOTALS.upgrades.september },
                { label: t.radialKpi.lastWeek, value: 13 },
              ]}
              className="h-full"
            />
          </State>
          <PieceNote paragraphs={t.radialKpi.explain} />
        </Piece>

        <Piece id="chart-states">
          <State label={t.chartStates.loadingPlot} note={t.chartStates.loadingPlotNote}>
            <ChartState title={t.chartStates.visitors} shape="plot" state="loading" />
          </State>
          <State label={t.chartStates.arrived} note={t.chartStates.arrivedNote}>
            <TimeSeries title={t.chartStates.visitors} dates={DAYS} series={VISITOR_SERIES} unit={units.visitors} area />
          </State>
          <State label={t.chartStates.loadingBars} note={t.chartStates.loadingBarsNote}>
            <ChartState title={t.chartStates.signupsByRegion} shape="bars" state="loading" rows={4} />
          </State>
          <State label={t.chartStates.loadingMeter} note={t.chartStates.loadingMeterNote}>
            <ChartState title={t.chartStates.signupsGoal} shape="meter" state="loading" />
          </State>
          <State label={t.chartStates.empty} note={t.chartStates.emptyNote} fill>
            <ChartState
              title={t.chartStates.signupsDaily}
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
          <State label={t.chartStates.newRegion} note={t.chartStates.newRegionNote} fill>
            <ChartState
              title={t.chartStates.centralVisitors}
              shape="plot"
              state="empty"
              message={t.chartStates.newMessage}
              description={t.chartStates.newHint}
            />
          </State>
          <State label={t.chartStates.error} note={t.chartStates.errorNote} fill>
            <ChartState
              title={t.chartStates.visitors}
              shape="plot"
              state="error"
              description={t.chartStates.errorHint}
              onRetry={() => toast(t.chartStates.retrying)}
              code="req_3c91d0e4"
              alive={false}
            />
          </State>
          <State label={t.chartStates.errorMeter} note={t.chartStates.errorMeterNote} fill>
            <ChartState
              title={t.chartStates.signupsGoal}
              shape="meter"
              state="error"
              description={t.chartStates.meterErrorHint}
              onRetry={() => toast(t.chartStates.retrying)}
              alive={false}
            />
          </State>
          <PieceNote paragraphs={t.chartStates.explain} />
        </Piece>
      </Sector>
    </SectionPage>
  );
}
