// ============================================================================
// Built-in Triggers — MANUAL, EVENT, SCHEDULED
// ============================================================================

import { TriggerHandler, ExecutionContext, StepResult } from '../types';

export const ManualTrigger: TriggerHandler = {
  type: 'MANUAL',
  validate(config) {
    return { valid: true };
  },
  async evaluate(context, config): Promise<StepResult> {
    // Manual triggers always succeed — they are initiated by an authorized user/API call
    return { status: 'success', data: { triggerType: 'MANUAL', input: context.input } };
  },
};

export const EventTrigger: TriggerHandler = {
  type: 'EVENT',
  validate(config) {
    if (!config.eventType || typeof config.eventType !== 'string') {
      return { valid: false, errors: ['EVENT trigger requires "eventType" string'] };
    }
    return { valid: true };
  },
  async evaluate(context, config): Promise<StepResult> {
    return { status: 'success', data: { triggerType: 'EVENT', eventType: config.eventType, input: context.input } };
  },
};

export const ScheduledTrigger: TriggerHandler = {
  type: 'SCHEDULED',
  validate(config) {
    if (!config.schedule || typeof config.schedule !== 'string') {
      return { valid: false, errors: ['SCHEDULED trigger requires "schedule" string (cron expression)'] };
    }
    return { valid: true };
  },
  async evaluate(context, config): Promise<StepResult> {
    return { status: 'success', data: { triggerType: 'SCHEDULED', schedule: config.schedule } };
  },
};
