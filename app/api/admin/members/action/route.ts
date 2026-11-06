import { database, requireAdmin, errorResponse } from "../../../../lib";
import { readJson, HttpError } from "../../../../../server/security";
import { transaction, audit } from "../../../../../server/database";
import { Member, issueAccountLink } from "../../../../../server/members";
import { enqueueMail, brandedMail } from "../../../../../server/mail-jobs";
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(),
      { id, action, enabled } = await readJson(req);
    if (typeof id !== "string") throw new HttpError("Invalid member");
    const m = await database()
      .prepare("SELECT * FROM members WHERE id=?")
      .bind(id)
      .first<Member>();
    if (!m) throw new HttpError("Member not found", 404);
    if (action === "activation")
      await transaction((db) =>
        issueAccountLink(m, m.email_verified_at ? "reset" : "activation", db),
      );
    else if (action === "reminder")
      throw new HttpError(
        "Preview and confirm reminders using the member reminder action",
        409,
      );
    else if (action === "enabled") {
      if (admin.role !== "SUPER_ADMIN" || typeof enabled !== "boolean")
        throw new HttpError("Super Admin access required", 403);
      await database()
        .prepare(
          "UPDATE members SET enabled=?,auth_version=auth_version+1 WHERE id=?",
        )
        .bind(enabled ? 1 : 0, m.id)
        .run();
    } else throw new HttpError("Unknown action");
    await audit(admin.email, "member." + action, m.id);
    return Response.json({
      message:
        action === "enabled"
          ? "Member access updated"
          : "Email queued for delivery",
    });
  } catch (e) {
    return errorResponse(e);
  }
}
