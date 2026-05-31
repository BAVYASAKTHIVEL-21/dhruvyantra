/**
 * Custom agents — core intelligence (not LLM-only).
 * Agents request tools via Coral MCP; they do not call external APIs directly.
 */
export const AGENTS = [
  { id: "analysis", name: "Analysis Agent", status: "pending" },
  { id: "planner", name: "Planner Agent", status: "active" },
  { id: "revision", name: "Revision Agent", status: "pending" },
  { id: "recommendation", name: "Recommendation Agent", status: "pending" },
  { id: "mentor", name: "Mentor Agent", status: "active" },
  { id: "report", name: "Report Agent", status: "pending" },
] as const;
