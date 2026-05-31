"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTodayPlan, updatePlannerTask } from "@/lib/planner/client";
import type { DailyPlan, TaskStatus } from "@/types/planner";

export function usePlanner() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchTodayPlan();
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      if (!plan) return;

      const previous = plan;
      const optimistic: DailyPlan = {
        ...plan,
        tasks: plan.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
        pendingTasks: plan.tasks
          .map((t) => (t.id === taskId ? { ...t, status } : t))
          .filter((t) => t.status !== "Completed"),
        completedTasks: plan.tasks
          .map((t) => (t.id === taskId ? { ...t, status } : t))
          .filter((t) => t.status === "Completed"),
      };
      optimistic.completedCount = optimistic.completedTasks.length;
      optimistic.totalTasks = optimistic.tasks.length;
      optimistic.progressPercent =
        optimistic.totalTasks === 0
          ? 0
          : Math.round((optimistic.completedCount / optimistic.totalTasks) * 100);

      setPlan(optimistic);
      setUpdatingId(taskId);

      try {
        const updated = await updatePlannerTask(taskId, status);
        setPlan(updated);
      } catch (e) {
        setPlan(previous);
        setError(e instanceof Error ? e.message : "Failed to update task");
      } finally {
        setUpdatingId(null);
      }
    },
    [plan],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      const task = plan?.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const next: TaskStatus = task.status === "Completed" ? "Pending" : "Completed";
      void setTaskStatus(taskId, next);
    },
    [plan, setTaskStatus],
  );

  return {
    plan,
    loading,
    error,
    updatingId,
    refresh,
    toggleTask,
    setTaskStatus,
  };
}
