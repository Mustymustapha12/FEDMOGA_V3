import { database, requireAdmin, errorResponse } from "../../../lib";
import { queryReport } from "../../../../server/report-query";
import type { ReportRow } from "../../../report-data";
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const db = database();
    const rows = (
      await db
        .prepare(
          "SELECT COALESCE(r.id,p.id) AS id,CASE WHEN r.id IS NULL THEN 'payment' ELSE 'registration' END AS recordKind,r.number,r.answers,COALESCE(r.created_at,p.created_at) AS date,p.id AS paymentId,p.full_name AS name,p.email,p.phone,p.amount,p.status,p.reference,p.mode,p.paid_at AS paidAt,CASE WHEN m.payment_id IS NULL THEN 'Paystack' ELSE 'Bank Transfer' END AS method,CASE WHEN p.status='SUCCESS' THEN 'paid' ELSE 'pending' END AS paymentStatus,CASE WHEN p.status='SUCCESS' THEN p.amount ELSE 0 END AS amountPaid,CASE WHEN r.id IS NOT NULL THEN 'completed' WHEN p.status='SUCCESS' THEN 'paid-incomplete' ELSE 'incomplete' END AS completion FROM payments p LEFT JOIN registrations r ON r.payment_id=p.id LEFT JOIN manual_payments m ON m.payment_id=p.id ORDER BY p.created_at DESC,p.id",
        )
        .all<ReportRow>()
    ).results;
    const transfers = (
      await db
        .prepare(
          "SELECT id,name,email,phone,amount,external_reference AS reference,mode,created_at AS date,'transfer' AS recordKind,'Bank Transfer' AS method,'awaiting' AS paymentStatus,'incomplete' AS completion,0 AS amountPaid FROM registration_transfer_requests WHERE status='PENDING'",
        )
        .all<ReportRow>()
    ).results;
    return Response.json(
      queryReport([...rows, ...transfers], new URL(req.url).searchParams),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
