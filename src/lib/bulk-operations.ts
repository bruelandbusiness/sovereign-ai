import { logger } from "@/lib/logger";

export interface BulkResult<T> {
  total: number;
  succeeded: number;
  failed: number;
  errors: { item: T; error: string }[];
  duration: number; // ms
}

/**
 * Process items in batches with concurrency control.
 * Handles errors per-item without failing the entire batch.
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options?: {
    batchSize?: number; // default 10
    concurrency?: number; // default 5
    onProgress?: (processed: number, total: number) => void;
    label?: string; // for logging
  },
): Promise<BulkResult<T>> {
  const batchSize = options?.batchSize ?? 10;
  const concurrency = options?.concurrency ?? 5;
  const label = options?.label ?? "processBatch";

  const total = items.length;
  let succeeded = 0;
  let processed = 0;
  const errors: { item: T; error: string }[] = [];

  const start = Date.now();

  logger.info(`[${label}] Starting processing of ${total} items (batchSize=${batchSize}, concurrency=${concurrency})`);

  for (let i = 0; i < total; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);

    // Process chunk with concurrency limit
    for (let j = 0; j < chunk.length; j += concurrency) {
      const concurrent = chunk.slice(j, j + concurrency);

      const results = await Promise.allSettled(
        concurrent.map((item) => processor(item)),
      );

      for (let k = 0; k < results.length; k++) {
        const result = results[k];
        processed++;

        if (result.status === "fulfilled") {
          succeeded++;
        } else {
          const errorMessage =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          errors.push({ item: concurrent[k], error: errorMessage });
          logger.warn(`[${label}] Item failed: ${errorMessage}`);
        }
      }
    }

    options?.onProgress?.(processed, total);
  }

  const duration = Date.now() - start;

  logger.info(
    `[${label}] Completed: ${succeeded}/${total} succeeded, ${errors.length} failed in ${duration}ms`,
  );

  return { total, succeeded, failed: errors.length, errors, duration };
}

/**
 * Batch delete with chunking to avoid Prisma timeout on large deletes.
 */
export async function batchDelete(
  model: {
    deleteMany: (args: {
      where: { id: { in: string[] } };
    }) => Promise<{ count: number }>;
  },
  ids: string[],
  chunkSize?: number,
): Promise<number> {
  const size = chunkSize ?? 100;
  let totalDeleted = 0;

  logger.info(`[batchDelete] Deleting ${ids.length} records in chunks of ${size}`);

  for (let i = 0; i < ids.length; i += size) {
    const chunk = ids.slice(i, i + size);
    const result = await model.deleteMany({
      where: { id: { in: chunk } },
    });
    totalDeleted += result.count;
  }

  logger.info(`[batchDelete] Deleted ${totalDeleted} records total`);

  return totalDeleted;
}

/**
 * Batch upsert with chunking.
 */
export async function batchUpsert<T>(
  items: T[],
  upsertFn: (item: T) => Promise<unknown>,
  chunkSize?: number,
): Promise<BulkResult<T>> {
  return processBatch(items, upsertFn, { batchSize: chunkSize ?? 50 });
}
