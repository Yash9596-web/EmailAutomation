// ============================================================================
// Job Queue — Database-backed background job management
// ============================================================================

import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { NotFoundError } from '@/lib/errors';

export type JobState = 'Queued' | 'Running' | 'Succeeded' | 'Failed' | 'Retrying' | 'Cancelled';

export interface JobQueue {
  enqueue<T extends Record<string, unknown>>(
    queue: string,
    payload: T,
    options?: { maxRetries?: number; priority?: number; idempotencyKey?: string; tenantId?: string }
  ): Promise<string>;
  cancel(jobId: string): Promise<boolean>;
  getJobStatus(jobId: string): Promise<JobState | null>;
}

export class DatabaseJobQueue implements JobQueue {
  /**
   * Enqueue a job. If an idempotencyKey is provided, prevents duplicate jobs.
   */
  async enqueue<T extends Record<string, unknown>>(
    queue: string,
    payload: T,
    options?: { maxRetries?: number; priority?: number; idempotencyKey?: string; tenantId?: string }
  ): Promise<string> {
    // Idempotency check
    if (options?.idempotencyKey) {
      const existing = await db.jobRecord.findUnique({
        where: { idempotencyKey: options.idempotencyKey },
      });
      if (existing) {
        logger.info({
          message: 'Job already exists (idempotent)',
          module: 'jobs',
          jobId: existing.id,
          idempotencyKey: options.idempotencyKey,
        });
        return existing.id;
      }
    }

    const record = await db.jobRecord.create({
      data: {
        queue,
        jobType: queue, // Default jobType to queue name
        payload: payload as any,
        maxRetries: options?.maxRetries ?? 3,
        priority: options?.priority ?? 0,
        idempotencyKey: options?.idempotencyKey,
        tenantId: options?.tenantId,
      },
    });

    logger.info({
      message: 'Job enqueued',
      module: 'jobs',
      jobId: record.id,
      queue,
    });

    return record.id;
  }

  async cancel(jobId: string): Promise<boolean> {
    const job = await db.jobRecord.findUnique({ where: { id: jobId } });
    if (!job) return false;

    if (job.state === 'Succeeded' || job.state === 'Failed') {
      return false; // Cannot cancel completed jobs
    }

    await db.jobRecord.update({
      where: { id: jobId },
      data: { state: 'Cancelled' },
    });

    return true;
  }

  async getJobStatus(jobId: string): Promise<JobState | null> {
    const job = await db.jobRecord.findUnique({
      where: { id: jobId },
      select: { state: true },
    });
    return (job?.state as JobState) ?? null;
  }
}

export const jobQueue: JobQueue = new DatabaseJobQueue();
