import { requireAdmin, errorResponse } from "../../../../lib";
import { readJson } from "../../../../../server/security";
import {
  previewReminders,
  sendReminders,
} from "../../../../../server/admin-reminders";
export async function POST(req: Request) {
  try {
    const actor = await requireAdmin();
    const b = await readJson(req);
    return Response.json(
      b.action === "send"
        ? await sendReminders(b.token, b.confirmed, actor.email)
        : await previewReminders(b.ids),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
