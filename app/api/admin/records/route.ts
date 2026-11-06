import { requireAdmin, errorResponse } from "../../../lib";
import { recordDetails } from "../../../../server/record-details";
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const q = new URL(req.url).searchParams;
    return Response.json(await recordDetails(q.get("kind"), q.get("id")), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
