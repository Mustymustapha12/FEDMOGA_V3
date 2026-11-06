import { database, errorResponse, requireAdmin } from "../../../../lib";
import { transaction } from "../../../../../server/database";
import {
  validateManualEntry,
  approveManualPayments,
} from "../../../../../server/manual-payments";
import { readJson, HttpError } from "../../../../../server/security";
export async function GET() {
  try {
    await requireAdmin();
    return Response.json(
      (
        await database()
          .prepare(
            "SELECT * FROM registration_transfer_requests ORDER BY created_at DESC",
          )
          .all()
      ).results,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request) {
  try {
    const actor = await requireAdmin();
    const b = await readJson(req);
    if (b.action === "submit") {
      const entry = validateManualEntry(b.entry);
      if (!["test", "live"].includes(String(b.mode)))
        throw new HttpError("Choose a valid mode");
      await transaction(async (db) => {
        const existing = await db
          .prepare(
            "SELECT id FROM payments WHERE reference=? UNION SELECT payment_id AS id FROM manual_payments WHERE external_reference=? UNION SELECT id FROM dues_payments WHERE external_reference=?",
          )
          .bind(
            entry.externalReference,
            entry.externalReference,
            entry.externalReference,
          )
          .first();
        if (existing) throw new HttpError("Reference already used", 409);
        const id = crypto.randomUUID(),
          now = new Date().toISOString();
        await db
          .prepare(
            "INSERT INTO registration_transfer_requests(id,name,email,phone,amount,paid_date,external_reference,mode,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            entry.name,
            entry.email,
            entry.phone,
            entry.amount,
            entry.paidDate,
            entry.externalReference,
            b.mode,
            actor.email,
            now,
          )
          .run();
        await db
          .prepare(
            "INSERT INTO audit_logs(id,actor,action,target,created_at) VALUES(?,?,?,?,?)",
          )
          .bind(crypto.randomUUID(), actor.email, "transfer.submitted", id, now)
          .run();
      });
      return Response.json({
        message:
          "Transfer recorded for review. No payment confirmed or registration access granted.",
      });
    }
    if (
      b.action !== "approve" ||
      typeof b.id !== "string" ||
      b.confirmed !== true
    )
      throw new HttpError("Confirm bank receipt before approving");
    const payments = await transaction(async (db) => {
      const row = await db
        .prepare(
          "SELECT * FROM registration_transfer_requests WHERE id=? FOR UPDATE",
        )
        .bind(b.id)
        .first<Record<string, any>>();
      if (!row) throw new HttpError("Transfer request not found", 404);
      if (row.status !== "PENDING")
        throw new HttpError("Transfer already processed", 409);
      const results = await approveManualPayments(
        [
          {
            name: row.name,
            email: row.email,
            phone: row.phone,
            amount: String(row.amount),
            paidDate: row.paid_date,
            externalReference: row.external_reference,
          },
        ],
        actor.email,
        row.mode,
        db,
      );
      await db
        .prepare(
          "UPDATE registration_transfer_requests SET status='APPROVED',payment_id=? WHERE id=?",
        )
        .bind(results[0].id, row.id)
        .run();
      await db
        .prepare(
          "INSERT INTO audit_logs(id,actor,action,target,created_at) VALUES(?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          actor.email,
          "transfer.approved",
          row.id,
          new Date().toISOString(),
        )
        .run();
      return results;
    });
    return Response.json({
      payments,
      message: "Bank transfer approved. Registration link available.",
    });
  } catch (e) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY")
      return errorResponse(new HttpError("Reference already recorded", 409));
    return errorResponse(e);
  }
}
