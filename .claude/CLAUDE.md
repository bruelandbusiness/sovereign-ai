# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin** - a collection of production-ready agents, skills, hooks, commands, rules, and MCP configurations. The project provides battle-tested workflows for software development using Claude Code.

## Running Tests

```bash
# Run all tests
node tests/run-all.js

# Run individual test files
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

## Architecture

The project is organized into several core components:

- **agents/** - Specialized subagents for delegation (planner, code-reviewer, tdd-guide, etc.)
- **skills/** - Workflow definitions and domain knowledge (coding standards, patterns, testing)
- **commands/** - Slash commands invoked by users (/tdd, /plan, /e2e, etc.)
- **hooks/** - Trigger-based automations (session persistence, pre/post-tool hooks)
- **rules/** - Always-follow guidelines (security, coding style, testing requirements)
- **mcp-configs/** - MCP server configurations for external integrations
- **scripts/** - Cross-platform Node.js utilities for hooks and setup
- **tests/** - Test suite for scripts and utilities

## Key Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Implementation planning
- `/e2e` - Generate and run E2E tests
- `/code-review` - Quality review
- `/build-fix` - Fix build errors
- `/learn` - Extract patterns from sessions
- `/skill-create` - Generate skills from git history

## Development Notes

- Package manager detection: npm, pnpm, yarn, bun (configurable via `CLAUDE_PACKAGE_MANAGER` env var or project config)
- Cross-platform: Windows, macOS, Linux support via Node.js scripts
- Agent format: Markdown with YAML frontmatter (name, description, tools, model)
- Skill format: Markdown with clear sections for when to use, how it works, examples
- Skill placement: Curated in skills/; generated/imported under ~/.claude/skills/. See docs/SKILL-PLACEMENT-POLICY.md
- Hook format: JSON with matcher conditions and command/notification hooks

## Contributing

Follow the formats in CONTRIBUTING.md:
- Agents: Markdown with frontmatter (name, description, tools, model)
- Skills: Clear sections (When to Use, How It Works, Examples)
- Commands: Markdown with description frontmatter
- Hooks: JSON with matcher and hooks array

File naming: lowercase with hyphens (e.g., `python-reviewer.md`, `tdd-workflow.md`)

---

## Trail of Bits Security Standards

Integrated from [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config). These security-focused development standards complement the existing project guidelines.

### Philosophy

- **No speculative features** - Don't add features, flags, or configuration unless users actively need them
- **No premature abstraction** - Don't create utilities until you've written the same code three times
- **Clarity over cleverness** - Prefer explicit, readable code over dense one-liners
- **Justify new dependencies** - Each dependency is attack surface and maintenance burden
- **Replace, don't deprecate** - When a new implementation replaces an old one, remove the old one entirely
- **Verify at every level** - Set up automated guardrails (linters, type checkers, pre-commit hooks, tests) as the first step
- **Finish the job** - Handle the edge cases you can see. Clean up what you touched.

### Code Quality Hard Limits

1. Max 100 lines/function, cyclomatic complexity max 8
2. Max 5 positional params
3. 100-char line length
4. Absolute imports only -- no relative (`..`) paths
5. Google-style docstrings on non-trivial public APIs

### Zero Warnings Policy

Fix every warning from every tool -- linters, type checkers, compilers, tests. If a warning truly can't be fixed, add an inline ignore with a justification comment.

### Security-Focused Testing

- **Test behavior, not implementation** - Tests verify what code does, not how
- **Test edges and errors** - Empty inputs, boundaries, malformed data, missing files, network failures
- **Mock boundaries, not logic** - Only mock things that are slow, non-deterministic, or external
- **Verify tests catch failures** - Break the code, confirm the test fails, then fix
- Use mutation testing (`cargo-mutants`, `mutmut`) and property-based testing (`proptest`, `hypothesis`)

### Trail of Bits Security Skills

The `trailofbits-skills` plugin provides 35+ security-focused skills. Key ones for this project:

- **static-analysis** - CodeQL, Semgrep, SARIF parsing for vulnerability detection
- **variant-analysis** - Find similar vulnerabilities across codebases
- **insecure-defaults** - Detect hardcoded credentials, fail-open patterns
- **sharp-edges** - Identify error-prone APIs and footgun designs
- **supply-chain-risk-auditor** - Audit dependency threat landscape
- **differential-review** - Security-focused code change review
- **audit-context-building** - Deep architectural context for vulnerability hunting
- **fp-check** - Systematic false positive verification

### Trail of Bits Commands

- `/tob-fix-issue` - End-to-end: plan, implement, test, review, fix, push, and PR for a GitHub issue
- `/tob-review-pr` - Review an existing PR with parallel agents, fix findings, and push
- `/tob-merge-dependabot` - Merge Dependabot PRs safely

### Workflow Conventions

- **Before committing**: Re-read changes, run relevant tests, run linters and type checker
- **Commits**: Imperative mood, max 72 char subject, one logical change per commit
- **Never push directly to main** -- use feature branches and PRs
- **Never commit secrets** -- use `.env` files (gitignored) and environment variables
- **Use `trash` instead of `rm -rf`** (enforced by PreToolUse hook)
