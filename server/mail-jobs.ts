import { today } from "./calendar";
import { database, transaction } from "./database";
import { encryptToken, decryptToken, setting } from "../app/lib";
import { sendEmail } from "./email";
import { appOrigin } from "./security";
import { type Mail } from "./mail-branding";
export { brandedMail, escapeHtml } from "./mail-branding";
export async function enqueueMail(
  key: string,
  mail: Mail,
  db = database(),
  memberId: string | null = null,
  paymentId: string | null = null,
) {
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT IGNORE INTO email_jobs(id,dedupe_key,member_id,payment_id,payload_cipher,available_at,created_at) VALUES(?,?,?,?,?,?,?)",
    )
    .bind(
      crypto.randomUUID(),
      key,
      memberId,
      paymentId,
      await encryptToken(JSON.stringify(mail)),
      now,
      now,
    )
    .run();
}
export async function processMailJobs(limit = 5) {
  const counts = { sent: 0, failed: 0 };
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const job = await transaction(async (db) => {
      const now = new Date().toISOString();
      const row = await db
        .prepare(
          "SELECT id,payload_cipher,attempts,dedupe_key,member_id FROM email_jobs WHERE available_at<=? AND (status='PENDING' OR (status='PROCESSING' AND locked_until<=?)) ORDER BY created_at LIMIT 1 FOR UPDATE",
        )
        .bind(now, now)
        .first<{
          id: string;
          payload_cipher: string;
          attempts: number;
          dedupe_key: string;
          member_id: string | null;
        }>();
      if (!row) return null;
      await db
        .prepare(
          "UPDATE email_jobs SET status='PROCESSING',locked_until=?,attempts=attempts+1 WHERE id=?",
        )
        .bind(new Date(Date.now() + 5 * 60000).toISOString(), row.id)
        .run();
      return row;
    });
    if (!job) break;
    const attemptId = crypto.randomUUID();
    try {
      if (job.dedupe_key.startsWith("admin-dues-v3:") && job.member_id) {
        const member = await database()
          .prepare(
            "SELECT paid_until,enabled,preferred_plan FROM members WHERE id=?",
          )
          .bind(job.member_id)
          .first<{
            paid_until: string | null;
            enabled: number;
            preferred_plan: string;
          }>();
        const [, , queuedDay, queuedPaidUntil, queuedPlan, queuedAmount] =
          job.dedupe_key.split(":");
        const currentAmount = member
          ? Number(await setting("dues_" + member.preferred_plan, "0"))
          : 0;
        if (
          !member ||
          queuedDay !== today() ||
          queuedPaidUntil !== (member.paid_until || "none") ||
          queuedPlan !== member.preferred_plan ||
          Number(queuedAmount) !== currentAmount ||
          !member.enabled ||
          (member.paid_until && member.paid_until >= today())
        ) {
          await database()
            .prepare(
              "UPDATE email_jobs SET status='CANCELLED',locked_until=NULL,last_error='Reminder eligibility or snapshot changed at delivery' WHERE id=?",
            )
            .bind(job.id)
            .run();
          continue;
        }
      }
      const mail = JSON.parse(await decryptToken(job.payload_cipher)) as Mail;
      await database()
        .prepare(
          "INSERT INTO email_attempts(id,job_id,recipient,attempted_at,status) VALUES(?,?,?,?,'PROCESSING')",
        )
        .bind(attemptId, job.id, mail.to, new Date().toISOString())
        .run();
      await sendEmail(mail.to, mail.subject, mail.text, mail.html);
      await database()
        .prepare(
          "UPDATE email_attempts SET status='ACCEPTED',completed_at=? WHERE id=?",
        )
        .bind(new Date().toISOString(), attemptId)
        .run();
      await database()
        .prepare(
          "UPDATE email_jobs SET status='SENT',sent_at=?,locked_until=NULL,last_error=NULL WHERE id=?",
        )
        .bind(new Date().toISOString(), job.id)
        .run();
      counts.sent++;
    } catch {
      await database()
        .prepare(
          "INSERT INTO email_attempts(id,job_id,attempted_at,completed_at,status,error) VALUES(?,?,?,?,'FAILED',?) ON DUPLICATE KEY UPDATE status='FAILED',completed_at=VALUES(completed_at),error=VALUES(error)",
        )
        .bind(
          attemptId,
          job.id,
          new Date().toISOString(),
          new Date().toISOString(),
          "Email delivery failed; consult provider logs",
        )
        .run();
      await database()
        .prepare(
          "UPDATE email_jobs SET status=?,available_at=?,locked_until=NULL,last_error=? WHERE id=?",
        )
        .bind(
          job.attempts >= 9 ? "FAILED" : "PENDING",
          new Date(
            Date.now() + Math.min(60, 2 ** job.attempts) * 60000,
          ).toISOString(),
          "Email delivery failed. Check SMTP configuration and provider logs.",
          job.id,
        )
        .run();
      counts.failed++;
    }
  }
  return counts;
}
