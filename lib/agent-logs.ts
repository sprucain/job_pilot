import type { createInsforgeServer } from "@/lib/insforge-server";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

type LogLevel = "info" | "success" | "warning" | "error";

// Shared by every agent/ function (code-standards.md: "Errors are always logged to
// agent_logs table before returning"). Best-effort only — a logging failure must
// never mask the original agent error it was trying to record.
export async function logAgentError(
  insforge: InsforgeServer,
  runId: string,
  userId: string,
  jobId: string | null,
  message: string,
  level: LogLevel = "error",
): Promise<void> {
  const { error } = await insforge.database
    .from("agent_logs")
    .insert([{ run_id: runId, user_id: userId, job_id: jobId, message, level }]);
  if (error) console.error("[agent-logs]", error);
}
