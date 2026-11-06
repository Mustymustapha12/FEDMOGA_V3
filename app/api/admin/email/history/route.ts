import {
  requireAdmin,
  database,
  errorResponse,
  decryptToken,
} from "../../../../lib";
import { readJson, HttpError } from "../../../../../server/security";
import { transaction } from "../../../../../server/database";
export async function GET() {
  try {
    await requireAdmin(true);
    const rows = (
      await database()
        .prepare(
          "SELECT id,payload_cipher,status,attempts,created_at,sent_at,last_error FROM email_jobs ORDER BY created_at DESC LIMIT 200",
        )
        .all()
    ).results;
    const attempts = (
      await database()
        .prepare(
          "SELECT a.id,a.job_id,a.recipient,a.attempted_at,a.completed_at,a.status,a.error FROM email_attempts a JOIN (SELECT id FROM email_jobs ORDER BY created_at DESC LIMIT 200) j ON j.id=a.job_id ORDER BY a.attempted_at DESC",
        )
        .all()
    ).results;
    return Response.json(
      await Promise.all(
        rows.map(async ({ payload_cipher, ...r }) => ({
          ...r,
          to: JSON.parse(await decryptToken(String(payload_cipher))).to,
          history: attempts.filter((a) => a.job_id === r.id),
        })),
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(true),
      b = await readJson(req);
    if (typeof b.id !== "string") throw new HttpError("Invalid email job");
    await transaction(async (db) => {
      const result = await db
        .prepare(
          "UPDATE email_jobs SET status='PENDING',attempts=0,available_at=?,locked_until=NULL WHERE id=? AND status='FAILED'",
        )
        .bind(new Date().toISOString(), b.id)
        .run();
      if (!result.meta.changes)
        throw new HttpError("Failed email job not found", 404);
      await db
        .prepare(
          "INSERT INTO audit_logs(id,actor,action,target,created_at) VALUES(?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          actor.email,
          "email.retry",
          b.id,
          new Date().toISOString(),
        )
        .run();
    });
    return Response.json({ message: "Failed email queued for retry" });
  } catch (e) {
    return errorResponse(e);
  }
}
