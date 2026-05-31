import type { CoralAction, CoralActionType } from "@/types/mission-control";

export function coralAction(
  type: CoralActionType,
  payload: Record<string, string | number | boolean | null>,
): CoralAction {
  return { type, payload };
}

/** Structured payloads for future Coral MCP workflows — not executed yet. */
export function scheduleMockAction(examType: string, when: string): CoralAction {
  return coralAction("schedule_mock", { examType, when });
}

export function revisionSessionAction(topic: string, when: string): CoralAction {
  return coralAction("create_revision_session", { topic, when });
}

export function sendAlertAction(alertId: string, channel: string): CoralAction {
  return coralAction("send_alert", { alertId, channel });
}

export function focusBlockAction(topic: string, durationMin: number, time: string): CoralAction {
  return coralAction("schedule_focus_block", { topic, durationMin, time });
}

export function openResourcesAction(topic: string, subject: string): CoralAction {
  return coralAction("open_resources", { topic, subject });
}

export function scheduleRecoveryAction(
  topic: string,
  subject: string,
  durationMin: number,
  date: string,
): CoralAction {
  return coralAction("schedule_recovery_session", { topic, subject, durationMin, date });
}

export function recommendResourceAction(
  resourceId: string,
  topic: string,
  subject: string,
): CoralAction {
  return coralAction("recommend_resource", { resourceId, topic, subject });
}

export function startFocusSessionAction(
  topic: string,
  subject: string,
  durationMin: number,
): CoralAction {
  return coralAction("start_focus_session", { topic, subject, durationMin });
}
