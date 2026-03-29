/**
 * Changelog generation utility that complements the existing changelog.
 * Parses conventional commits, categorizes them, and produces
 * formatted markdown changelogs with semantic version management.
 *
 * Works entirely on provided commit data -- no git CLI calls.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const COMMIT_TYPES = {
  feat: { category: "features", label: "Features" },
  fix: { category: "fixes", label: "Bug Fixes" },
  refactor: { category: "refactors", label: "Refactors" },
  docs: { category: "docs", label: "Documentation" },
  test: { category: "tests", label: "Tests" },
  chore: { category: "chores", label: "Chores" },
  perf: { category: "performance", label: "Performance" },
  ci: { category: "ci", label: "CI/CD" },
  style: { category: "style", label: "Style" },
  build: { category: "build", label: "Build" },
} as const;

export type CommitTypePrefix = keyof typeof COMMIT_TYPES;

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export interface ChangelogCommit {
  readonly hash: string;
  readonly type: CommitTypePrefix;
  readonly scope: string | null;
  readonly message: string;
  readonly body: string | null;
  readonly breaking: boolean;
  readonly author: string;
  readonly date: string; // ISO-8601
}

export interface ChangelogSection {
  readonly category: string;
  readonly label: string;
  readonly commits: readonly ChangelogCommit[];
}

export interface GeneratedChangelog {
  readonly version: string;
  readonly date: string;
  readonly sections: readonly ChangelogSection[];
  readonly breaking: readonly ChangelogCommit[];
  readonly markdown: string;
}

export type VersionBump = "major" | "minor" | "patch";

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

// Groups: [1] type, [2] scope (optional), [3] bang (optional), [4] message
const CONVENTIONAL_RE =
  /^([a-z]+)(?:\(([^)]+)\))?(!)?\s*:\s+(.+)$/;

/**
 * Parse a conventional-commit subject line into structured data.
 *
 * Supports formats like:
 *   feat: add new dashboard
 *   fix(auth): correct token refresh
 *   refactor!: overhaul routing layer
 *
 * Returns `null` when the line does not match the conventional format.
 */
export function parseConventionalCommit(
  line: string,
  meta: { hash?: string; author?: string; date?: string; body?: string } = {},
): ChangelogCommit | null {
  const trimmed = line.trim();
  const match = CONVENTIONAL_RE.exec(trimmed);
  if (!match) {
    return null;
  }

  const type = match[1];
  const scope = match[2] ?? null;
  const bang = match[3] ?? null;
  const message = match[4];
  const knownType = type as CommitTypePrefix;

  if (!(knownType in COMMIT_TYPES)) {
    return null;
  }

  return {
    hash: meta.hash ?? "",
    type: knownType,
    scope,
    message: message.trim(),
    body: meta.body ?? null,
    breaking:
      bang === "!" || (meta.body?.includes("BREAKING CHANGE") ?? false),
    author: meta.author ?? "unknown",
    date: meta.date ?? new Date().toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Categorisation
// ---------------------------------------------------------------------------

/**
 * Group an array of commits by their type category.
 *
 * Only categories that contain at least one commit are included in the
 * returned array. The order follows the declaration order of COMMIT_TYPES.
 */
export function categorizeCommits(
  commits: readonly ChangelogCommit[],
): readonly ChangelogSection[] {
  const buckets = new Map<CommitTypePrefix, ChangelogCommit[]>();

  for (const commit of commits) {
    const existing = buckets.get(commit.type);
    if (existing) {
      existing.push(commit);
    } else {
      buckets.set(commit.type, [commit]);
    }
  }

  const sections: ChangelogSection[] = [];

  for (const [prefix, meta] of Object.entries(COMMIT_TYPES)) {
    const items = buckets.get(prefix as CommitTypePrefix);
    if (items && items.length > 0) {
      sections.push({
        category: meta.category,
        label: meta.label,
        commits: items,
      });
    }
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Version helpers
// ---------------------------------------------------------------------------

// Groups: [1] major, [2] minor, [3] patch
const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;

/**
 * Parse a semver string (with optional leading "v") into its components.
 *
 * Returns `null` when the string is not a valid semver.
 */
export function parseVersion(version: string): SemanticVersion | null {
  const match = SEMVER_RE.exec(version.trim());
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/**
 * Determine the appropriate semver bump based on commit types.
 *
 * - Any breaking change --> major
 * - Any `feat` commit   --> minor
 * - Everything else      --> patch
 */
export function determineVersionBump(
  commits: readonly ChangelogCommit[],
): VersionBump {
  const hasBreaking = commits.some((c) => c.breaking);
  if (hasBreaking) {
    return "major";
  }

  const hasFeature = commits.some((c) => c.type === "feat");
  if (hasFeature) {
    return "minor";
  }

  return "patch";
}

/**
 * Increment a semantic version string according to the given bump type.
 *
 * Accepts versions with or without a leading "v". The returned string
 * never includes a leading "v".
 *
 * Throws if the input is not a valid semver string.
 */
export function bumpVersion(current: string, bump: VersionBump): string {
  const parsed = parseVersion(current);
  if (!parsed) {
    throw new Error(`Invalid semver string: "${current}"`);
  }

  switch (bump) {
    case "major":
      return `${parsed.major + 1}.0.0`;
    case "minor":
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case "patch":
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Return commits that occurred after the given version or ISO-8601 date.
 *
 * When `since` looks like a semver string the function falls back to date
 * comparison using `sinceDate`. When `since` is an ISO date string it is
 * used directly.
 *
 * Commits are compared by their `date` field (ISO-8601 string comparison).
 */
export function getChangesSince(
  commits: readonly ChangelogCommit[],
  since: string,
  sinceDate?: string,
): readonly ChangelogCommit[] {
  const cutoff = SEMVER_RE.test(since) ? (sinceDate ?? "") : since;

  if (!cutoff) {
    return commits;
  }

  return commits.filter((c) => c.date > cutoff);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format a single changelog entry as a markdown bullet.
 *
 * Output example:
 *   - **auth**: correct token refresh (Jane, 2026-03-29) [abc1234]
 */
export function formatChangelogEntry(commit: ChangelogCommit): string {
  const scope = commit.scope ? `**${commit.scope}**: ` : "";
  const hashRef = commit.hash ? ` [${commit.hash.slice(0, 7)}]` : "";
  const meta = `(${commit.author}, ${commit.date})`;

  return `- ${scope}${commit.message} ${meta}${hashRef}`;
}

/**
 * Produce a full markdown changelog from a list of commits.
 *
 * The `version` and `date` parameters are stamped into the heading.
 * Commits are categorised and each non-empty category becomes a section.
 * Breaking changes are listed in a dedicated section at the top.
 */
export function generateChangelogMarkdown(
  commits: readonly ChangelogCommit[],
  version: string,
  date: string,
): GeneratedChangelog {
  const sections = categorizeCommits(commits);
  const breaking = commits.filter((c) => c.breaking);

  const lines: string[] = [];
  lines.push(`## [${version}] - ${date}`);
  lines.push("");

  if (breaking.length > 0) {
    lines.push("### BREAKING CHANGES");
    lines.push("");
    for (const commit of breaking) {
      lines.push(formatChangelogEntry(commit));
    }
    lines.push("");
  }

  for (const section of sections) {
    lines.push(`### ${section.label}`);
    lines.push("");
    for (const commit of section.commits) {
      lines.push(formatChangelogEntry(commit));
    }
    lines.push("");
  }

  const markdown = lines.join("\n").trimEnd() + "\n";

  return {
    version,
    date,
    sections,
    breaking,
    markdown,
  };
}
