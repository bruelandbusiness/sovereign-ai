# Backup & Restore

## Neon PostgreSQL Built-in Backups

Neon provides continuous, automatic backups with no configuration required.

### Point-in-Time Recovery (PITR)

Neon records every change via WAL (Write-Ahead Logging). You can restore to
any point within your plan's history retention window:

1. Open the Neon Console -> project -> **Branches**
2. Click **Create branch** -> select **Time** -> pick the desired timestamp
3. The new branch is a full, queryable copy of your database at that point
4. Update `DATABASE_URL` to the branch connection string to verify data

Pro plan retains 7 days of history; Scale plan retains 30 days.

### Branching for Safe Migrations

Before running destructive migrations, create a branch as a snapshot:

```bash
# Via Neon CLI
neonctl branches create --name pre-migration-backup --project-id <PROJECT_ID>
```

If the migration fails, point the app back at the pre-migration branch.

## Manual Backup with pg_dump

For offline or cross-provider backups, use `pg_dump`:

```bash
# Full database dump (compressed, custom format)
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="backup-$(date +%Y%m%d-%H%M%S).dump"

# SQL-text dump (human-readable, useful for auditing)
pg_dump "$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --file="backup-$(date +%Y%m%d-%H%M%S).sql"
```

Store dumps in an encrypted S3 bucket or equivalent with versioning enabled.

## Restore Procedure

### Restore from pg_dump

```bash
# Restore into a fresh Neon branch (recommended — never restore over production)
neonctl branches create --name restore-target --project-id <PROJECT_ID>

# Restore the dump
pg_restore \
  --dbname="$RESTORE_BRANCH_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  backup-20260325-120000.dump
```

### Restore from Neon Branch

1. Create a new branch from the desired point in time (see PITR above)
2. Verify data integrity by running key queries against the branch
3. Promote the branch: update `DATABASE_URL` in Vercel env vars and redeploy

## Recommended Backup Schedule

| Method | Frequency | Retention | Notes |
|---|---|---|---|
| Neon PITR | Continuous (automatic) | 7-30 days (plan-dependent) | No action needed |
| pg_dump to S3 | Daily (cron / GitHub Action) | 90 days | For cross-provider redundancy |
| Pre-migration branch | Before each migration | Keep 5 most recent | Manual via Neon CLI |

## Data Retention Policy

| Data Type | Retention After Deletion | Notes |
|---|---|---|
| Active accounts | Indefinite | Normal operation |
| Deleted accounts | 30 days | Soft-delete, then hard-purge via cron |
| Audit logs | 90 days | Retained for compliance and debugging |
| Session tokens | 24 hours after expiry | Cleaned by session rotation cron |
| Error logs (AuditLog) | 90 days | Pruned by data-retention job |

The data retention cron is implemented in `src/lib/security/data-retention.ts`.
Ensure the associated Vercel Cron Job is active in `vercel.json`.
