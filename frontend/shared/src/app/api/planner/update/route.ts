import { NextResponse } from "next/server";
import { updateTaskStatusForSession } from "@/lib/planner/server";
import type { TaskStatus } from "@/types/planner";

const VALID_STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const taskId = typeof body.taskId === "string" ? body.taskId : "";
    const status = body.status as TaskStatus;

    if (!taskId || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid taskId or status" }, { status: 400 });
    }

    const plan = await updateTaskStatusForSession(taskId, status);
    if (!plan) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(plan);
  } catch (e) {
    console.error("[api/planner/update]", e);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
