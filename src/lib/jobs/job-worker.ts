import db from '@/lib/db';
import { logger } from '@/lib/logger';
import { JobState } from './job-queue';

export interface JobHandler {
  (payload: any, jobContext: { jobId: string; tenantId?: string; attempt: number }): Promise<void>;
}

export class JobWorker {
  private handlers: Map<string, JobHandler> = new Map();
  private isRunning: boolean = false;
  private pollIntervalMs: number = 5000;

  /**
   * Register a handler for a specific job queue.
   */
  registerHandler(queue: string, handler: JobHandler) {
    this.handlers.set(queue, handler);
  }

  /**
   * Start polling for jobs.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.poll();
    logger.info({ message: 'Job worker started', module: 'jobs' });
  }

  /**
   * Stop polling.
   */
  stop() {
    this.isRunning = false;
    logger.info({ message: 'Job worker stopped', module: 'jobs' });
  }

  private async poll() {
    if (!this.isRunning) return;

    try {
      await this.processNextJob();
    } catch (error) {
      logger.error(
        { message: 'Error in job polling loop', module: 'jobs' },
        error instanceof Error ? error : new Error(String(error))
      );
    }

    // Schedule next poll
    setTimeout(() => this.poll(), this.pollIntervalMs);
  }

  private async processNextJob() {
    // 1. Find the next highest priority queued job using a transaction for safe locking
    const job = await db.$transaction(async (tx) => {
      // Find jobs that are Queued, OR Retrying and ready to retry (backoff logic could go here)
      const next = await tx.jobRecord.findFirst({
        where: {
          state: { in: ['Queued', 'Retrying'] },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
      });

      if (!next) return null;

      // Lock the job by moving it to Running
      return tx.jobRecord.update({
        where: { id: next.id },
        data: {
          state: 'Running',
          startedAt: new Date(),
          retryCount: { increment: 1 },
        },
      });
    });

    if (!job) return;

    const handler = this.handlers.get(job.queue);
    
    if (!handler) {
      await this.failJob(job.id, 'No handler registered for queue');
      return;
    }

    try {
      logger.info({ message: 'Processing job', module: 'jobs', jobId: job.id, queue: job.queue });
      
      // Execute the business logic
      await handler(job.payload, {
        jobId: job.id,
        tenantId: job.tenantId || undefined,
        attempt: job.retryCount,
      });

      // Mark Succeeded
      await db.jobRecord.update({
        where: { id: job.id },
        data: {
          state: 'Succeeded',
          completedAt: new Date(),
        },
      });

      logger.info({ message: 'Job succeeded', module: 'jobs', jobId: job.id });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isTransient = error instanceof Error && (error as any).isTransient === true;
      
      logger.error(
        { message: 'Job failed', module: 'jobs', jobId: job.id, queue: job.queue },
        error instanceof Error ? error : new Error(errorMsg)
      );

      // 3. Retry or Fail logic
      if (isTransient && job.retryCount < job.maxRetries) {
        // Retry
        await db.jobRecord.update({
          where: { id: job.id },
          data: {
            state: 'Retrying',
            errorDetail: errorMsg,
          },
        });
      } else {
        // Permanent failure
        await this.failJob(job.id, errorMsg);
      }
    }
  }

  private async failJob(jobId: string, errorDetail: string) {
    await db.jobRecord.update({
      where: { id: jobId },
      data: {
        state: 'Failed',
        errorDetail,
        completedAt: new Date(),
      },
    });
  }
}

export const jobWorker = new JobWorker();
