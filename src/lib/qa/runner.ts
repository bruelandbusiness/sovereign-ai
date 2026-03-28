/**
 * QA Report Runner
 *
 * Takes check results and produces formatted output for console,
 * summary reports, and Telegram messages. Pure TypeScript with
 * no external dependencies.
 */

import type { QaCheck, QaCheckResult, QaSection, QaVerdict } from "./checklist";
import { QA_CHECKS, QA_SECTIONS } from "./checklist";

/** Lookup map from section key to display name. */
const QA_SECTION_NAMES: Record<string, string> = Object.fromEntries(
  QA_SECTIONS.map((s) => [s.section, s.name]),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single entry pairing a check definition with its result. */
export interface QaReportEntry {
  check: QaCheck;
  result: QaCheckResult;
}

/** Report for a single QA section. */
export interface QaSectionReport {
  section: QaSection;
  sectionName: string;
  entries: QaReportEntry[];
  counts: { pass: number; warning: number; fail: number; total: number };
  verdict: "READY_TO_LAUNCH" | "FIX_FAILURES_FIRST" | "CRITICAL_ISSUES";
}

/** Full report spanning all sections. */
export interface QaFullReport {
  date: string;
  sections: QaSectionReport[];
  totals: { pass: number; warning: number; fail: number; total: number };
  verdict: "READY_TO_LAUNCH" | "FIX_FAILURES_FIRST" | "CRITICAL_ISSUES";
  priorityFixes: string[];
}

// ---------------------------------------------------------------------------
// Verdict helpers
// ---------------------------------------------------------------------------

type ReportVerdict = "READY_TO_LAUNCH" | "FIX_FAILURES_FIRST" | "CRITICAL_ISSUES";

const VERDICT_RANK: Record<ReportVerdict, number> = {
  READY_TO_LAUNCH: 0,
  FIX_FAILURES_FIRST: 1,
  CRITICAL_ISSUES: 2,
};

/**
 * Return the more severe of two verdicts.
 */
function worstVerdict(a: ReportVerdict, b: ReportVerdict): ReportVerdict {
  return VERDICT_RANK[a] >= VERDICT_RANK[b] ? a : b;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a `QaCheckResult` for a given check.
 *
 * @param checkId - The unique identifier of the check.
 * @param verdict - Pass, warning, or fail.
 * @param detail  - Optional human-readable explanation.
 */
export function createCheckResult(
  checkId: string,
  verdict: QaVerdict,
  detail?: string
): QaCheckResult {
  return { checkId, verdict, detail };
}

/**
 * Build a report for a single QA section by matching results to checks.
 *
 * Results are matched to checks via `checkId`. Checks without a
 * corresponding result are treated as if they were not run (omitted).
 *
 * Verdict logic:
 * - Any critical check with verdict "fail" => `CRITICAL_ISSUES`
 * - Any non-critical check with verdict "fail" => `FIX_FAILURES_FIRST`
 * - Otherwise => `READY_TO_LAUNCH`
 *
 * @param section - The section definition to report on.
 * @param results - All available check results (may span multiple sections).
 */
export function buildSectionReport(
  section: QaSection,
  results: QaCheckResult[]
): QaSectionReport {
  const resultMap = new Map<string, QaCheckResult>();
  for (const r of results) {
    resultMap.set(r.checkId, r);
  }

  const sectionChecks = QA_CHECKS.filter((c) => c.section === section);
  const entries: QaReportEntry[] = [];

  for (const check of sectionChecks) {
    const result = resultMap.get(check.id);
    if (result) {
      entries.push({ check, result });
    }
  }

  const counts = { pass: 0, warning: 0, fail: 0, total: entries.length };
  let hasCriticalFail = false;
  let hasNonCriticalFail = false;

  for (const entry of entries) {
    switch (entry.result.verdict) {
      case "pass":
        counts.pass++;
        break;
      case "warning":
        counts.warning++;
        break;
      case "fail":
        counts.fail++;
        if (entry.check.critical) {
          hasCriticalFail = true;
        } else {
          hasNonCriticalFail = true;
        }
        break;
    }
  }

  let verdict: ReportVerdict = "READY_TO_LAUNCH";
  if (hasCriticalFail) {
    verdict = "CRITICAL_ISSUES";
  } else if (hasNonCriticalFail) {
    verdict = "FIX_FAILURES_FIRST";
  }

  return {
    section,
    sectionName: QA_SECTION_NAMES[section],
    entries,
    counts,
    verdict,
  };
}

/**
 * Build a full QA report across all sections.
 *
 * Groups results by section, aggregates totals, determines the
 * overall verdict (worst across all sections), and compiles a
 * prioritised list of fixes (critical failures first, then by
 * check order).
 *
 * @param results - All check results to include in the report.
 */
export function buildFullReport(results: QaCheckResult[]): QaFullReport {
  const date = new Date().toISOString().slice(0, 10);

  // Collect all unique sections that have checks
  const sectionSet = new Set<QaSection>();
  for (const check of QA_CHECKS) {
    sectionSet.add(check.section);
  }

  const sections: QaSectionReport[] = [];
  for (const section of Array.from(sectionSet)) {
    const sectionReport = buildSectionReport(section, results);
    if (sectionReport.entries.length > 0) {
      sections.push(sectionReport);
    }
  }

  // Aggregate totals
  const totals = { pass: 0, warning: 0, fail: 0, total: 0 };
  let overallVerdict: ReportVerdict = "READY_TO_LAUNCH";

  for (const s of sections) {
    totals.pass += s.counts.pass;
    totals.warning += s.counts.warning;
    totals.fail += s.counts.fail;
    totals.total += s.counts.total;
    overallVerdict = worstVerdict(overallVerdict, s.verdict);
  }

  // Build priority fixes: all fail results, critical first, then by order
  const failEntries: { check: QaCheck; result: QaCheckResult }[] = [];
  for (const s of sections) {
    for (const entry of s.entries) {
      if (entry.result.verdict === "fail") {
        failEntries.push(entry);
      }
    }
  }

  failEntries.sort((a, b) => {
    // Critical failures first
    if (a.check.critical !== b.check.critical) {
      return a.check.critical ? -1 : 1;
    }
    // Then by order
    return a.check.order - b.check.order;
  });

  const priorityFixes = failEntries.map((e) => {
    const detail = e.result.detail ? `: ${e.result.detail}` : "";
    return `${e.check.label}${detail}`;
  });

  return { date, sections, totals, verdict: overallVerdict, priorityFixes };
}

// ---------------------------------------------------------------------------
// Text formatting
// ---------------------------------------------------------------------------

const SEPARATOR = "\u2550".repeat(39);

/**
 * Format a full QA report as human-readable text.
 *
 * Outputs each section with pass/warning/fail groups, followed by
 * a combined summary and prioritised fix list.
 *
 * @param report - The full report to format.
 */
export function formatReportText(report: QaFullReport): string {
  const parts: string[] = [];

  for (const section of report.sections) {
    parts.push(formatSectionBlock(section, report.date));
  }

  // Final combined summary
  parts.push(SEPARATOR);
  parts.push(`  COMBINED SUMMARY`);
  parts.push(`  Date: ${report.date}`);
  parts.push(SEPARATOR);
  parts.push("");
  parts.push(
    `  SUMMARY: ${report.totals.pass} pass / ${report.totals.warning} warn / ${report.totals.fail} fail`
  );
  parts.push(`  VERDICT: ${report.verdict}`);
  parts.push(SEPARATOR);

  if (report.priorityFixes.length > 0) {
    parts.push("");
    parts.push("PRIORITY FIX LIST:");
    for (let i = 0; i < report.priorityFixes.length; i++) {
      parts.push(`  ${i + 1}. ${report.priorityFixes[i]}`);
    }
  }

  return parts.join("\n");
}

/**
 * Format a single section report as human-readable text.
 *
 * Same visual format as `formatReportText` but limited to one section.
 *
 * @param report - The section report to format.
 */
export function formatSectionReportText(report: QaSectionReport): string {
  const date = new Date().toISOString().slice(0, 10);
  const parts: string[] = [];
  parts.push(formatSectionBlock(report, date));

  // Section-level priority fixes
  const fixes = report.entries
    .filter((e) => e.result.verdict === "fail")
    .sort((a, b) => {
      if (a.check.critical !== b.check.critical) {
        return a.check.critical ? -1 : 1;
      }
      return a.check.order - b.check.order;
    });

  if (fixes.length > 0) {
    parts.push("");
    parts.push("PRIORITY FIX LIST:");
    for (let i = 0; i < fixes.length; i++) {
      const detail = fixes[i].result.detail ? `: ${fixes[i].result.detail}` : "";
      parts.push(`  ${i + 1}. ${fixes[i].check.label}${detail}`);
    }
  }

  return parts.join("\n");
}

/**
 * Format a full QA report for Telegram (max 4096 characters).
 *
 * Shows section-level counts and verdict, followed by the top 5
 * priority fixes. Truncates gracefully if content exceeds the limit.
 *
 * @param report - The full report to format.
 */
export function formatReportForTelegram(report: QaFullReport): string {
  const MAX_LEN = 4096;
  const lines: string[] = [];

  lines.push("QA REPORT");
  lines.push(`Date: ${report.date}`);
  lines.push(`Verdict: ${report.verdict}`);
  lines.push(
    `Totals: ${report.totals.pass} pass / ${report.totals.warning} warn / ${report.totals.fail} fail`
  );
  lines.push("");

  // Section summaries
  for (const section of report.sections) {
    const icon =
      section.verdict === "READY_TO_LAUNCH"
        ? "\u2705"
        : section.verdict === "FIX_FAILURES_FIRST"
          ? "\u26A0\uFE0F"
          : "\u274C";
    lines.push(
      `${icon} ${section.sectionName}: ${section.counts.pass}/${section.counts.total} pass`
    );
  }

  // Top 5 priority fixes
  if (report.priorityFixes.length > 0) {
    lines.push("");
    lines.push("TOP FIXES:");
    const top = report.priorityFixes.slice(0, 5);
    for (let i = 0; i < top.length; i++) {
      lines.push(`${i + 1}. ${top[i]}`);
    }
    if (report.priorityFixes.length > 5) {
      lines.push(`... and ${report.priorityFixes.length - 5} more`);
    }
  }

  let text = lines.join("\n");

  // Truncate if needed
  if (text.length > MAX_LEN) {
    text = text.slice(0, MAX_LEN - 4) + "\n...";
  }

  return text;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Format a single section as a text block with header, grouped entries,
 * and summary footer.
 */
function formatSectionBlock(section: QaSectionReport, date: string): string {
  const lines: string[] = [];

  lines.push(SEPARATOR);
  lines.push(`  QA REPORT \u2014 ${section.sectionName}`);
  lines.push(`  Date: ${date}`);
  lines.push(SEPARATOR);
  lines.push("");

  // Group entries by verdict
  const passes = section.entries.filter((e) => e.result.verdict === "pass");
  const warnings = section.entries.filter((e) => e.result.verdict === "warning");
  const fails = section.entries.filter((e) => e.result.verdict === "fail");

  if (passes.length > 0) {
    lines.push(`\u2705 PASS (${passes.length} checks)`);
    for (const e of passes) {
      lines.push(`  - ${e.check.label}`);
    }
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push(`\u26A0\uFE0F WARNING (${warnings.length} checks)`);
    for (const e of warnings) {
      const detail = e.result.detail ? `: ${e.result.detail}` : "";
      lines.push(`  - ${e.check.label}${detail}`);
    }
    lines.push("");
  }

  if (fails.length > 0) {
    lines.push(`\u274C FAIL (${fails.length} checks)`);
    for (const e of fails) {
      const detail = e.result.detail ? `: ${e.result.detail}` : "";
      lines.push(`  - ${e.check.label}${detail}`);
    }
    lines.push("");
  }

  lines.push(SEPARATOR);
  lines.push(
    `  SUMMARY: ${section.counts.pass} pass / ${section.counts.warning} warn / ${section.counts.fail} fail`
  );
  lines.push(`  VERDICT: ${section.verdict}`);
  lines.push(SEPARATOR);

  return lines.join("\n");
}
