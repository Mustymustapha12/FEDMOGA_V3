import { createHmac, timingSafeEqual } from "node:crypto";
import { database, transaction } from "./database";
import { HttpError, appOrigin } from "./security";
import { membershipSummary } from "./membership-summary";
import { enqueueMail, brandedMail } from "./mail-jobs";
import { today } from "./calendar";
import type { Member } from "./members";
function sign(payload: string) {
  const key = process.env.FEDMOGA_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key))
    throw new HttpError("Encryption is not configured", 503);
  return createHmac("sha256", Buffer.from(key, "hex"))
    .update(payload)
    .digest("hex");
}
export function reminderIds(value: unknown) {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > 100 ||
    value.some((id) => typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id))
  )
    throw new HttpError("Select 1–100 valid members");
  return [...new Set(value as string[])].sort();
}
async function recipients(ids: string[], db = database(), lock = false) {
  const config = (
    await db
      .prepare(
        "SELECT `key`,value FROM settings WHERE `key` IN ('dues_monthly','dues_quarterly','dues_annually','dues_grace_days','paystack_mode')" +
          (lock ? " FOR UPDATE" : ""),
      )
      .all<{ key: string; value: string }>()
  ).results;
  const values = Object.fromEntries(config.map((r) => [r.key, r.value])),
    prices = {
      monthly: Number(values.dues_monthly || 0),
      quarterly: Number(values.dues_quarterly || 0),
      annually: Number(values.dues_annually || 0),
    };
  const results = [];
  for (const id of ids) {
    const m = await db
      .prepare("SELECT * FROM members WHERE id=?" + (lock ? " FOR UPDATE" : ""))
      .bind(id)
      .first<Member>();
    if (!m || m.mode !== (values.paystack_mode || "test"))
      throw new HttpError("Member not found in the selected mode", 404);
    const s = membershipSummary(
      m,
      prices,
      Number(values.dues_grace_days || 30),
    );
    if (s.outstanding <= 0)
      throw new HttpError(
        "Only enabled members with outstanding dues can receive a reminder",
        409,
      );
    results.push({
      id: m.id,
      name: m.name,
      email: m.email,
      mode: m.mode,
      ...s,
    });
  }
  return results;
}
export async function previewReminders(value: unknown) {
  const ids = reminderIds(value),
    rows = await recipients(ids),
    payload = JSON.stringify({ ids, rows, expires: Date.now() + 10 * 60000 });
  return {
    recipients: rows,
    total: rows.length,
    token: Buffer.from(payload).toString("base64url") + "." + sign(payload),
  };
}
export async function sendReminders(
  token: unknown,
  confirmed: unknown,
  actor: string,
) {
  if (confirmed !== true || typeof token !== "string" || token.length > 60000)
    throw new HttpError("Preview and confirm reminder recipients");
  const [raw, sig] = token.split("."),
    payload = Buffer.from(raw || "", "base64url").toString();
  const expected = sign(payload);
  if (
    !sig ||
    !/^[a-f0-9]{64}$/.test(sig) ||
    !timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))
  )
    throw new HttpError("Invalid reminder confirmation", 403);
  let preview;
  try {
    preview = JSON.parse(payload);
  } catch {
    throw new HttpError("Invalid reminder confirmation");
  }
  if (preview.expires < Date.now())
    throw new HttpError("Preview expired; review recipients again", 409);
  const ids = reminderIds(preview.ids);
  return transaction(async (db) => {
    const rows = await recipients(ids, db, true);
    if (JSON.stringify(rows) !== JSON.stringify(preview.rows))
      throw new HttpError(
        "Membership data changed; preview recipients again",
        409,
      );
    let queued = 0;
    for (const m of rows) {
      const key = `admin-dues-v3:${m.id}:${today()}:${m.paidUntil || "none"}:${m.duesPeriod}:${m.outstanding}`;
      const prior = await db
        .prepare("SELECT id FROM email_jobs WHERE dedupe_key=?")
        .bind(key)
        .first();
      if (prior) continue;
      await enqueueMail(
        key,
        brandedMail(
          m.email,
          "FEDMOGA membership dues reminder",
          "Outstanding membership dues",
          [
            "Hello " + m.name + ".",
            "Outstanding next renewal: ₦" +
              m.outstanding.toLocaleString("en-NG") +
              ".",
            "Dues period: " +
              m.duesPeriod +
              " (" +
              m.periodStart +
              " to " +
              m.periodEnd +
              ").",
            "Due date: " +
              m.dueDate +
              ". Paid through: " +
              (m.paidUntil || "No membership dues paid") +
              ".",
            "This is one next renewal at current prices; historical arrears are not charged.",
            "Sign in and select Pay Dues / Renew. Payments are initiated by you; there are no automatic deductions.",
          ],
          appOrigin() + "/login",
          "Sign in to pay dues",
        ),
        db,
        m.id,
      );
      await db
        .prepare(
          "INSERT INTO audit_logs(id,actor,action,target,created_at) VALUES(?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          actor,
          "dues.reminder.queued",
          m.id,
          new Date().toISOString(),
        )
        .run();
      queued++;
    }
    return {
      queued,
      duplicates: rows.length - queued,
      message: `${queued} reminder(s) queued; ${rows.length - queued} duplicate(s) prevented.`,
    };
  });
}
