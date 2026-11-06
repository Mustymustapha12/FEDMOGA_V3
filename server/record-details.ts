import { setting } from "../app/lib";
import { defaultSections } from "../app/form-config";
import { database } from "./database";
import { HttpError } from "./security";
import { membershipSummary } from "./membership-summary";
import { duesConfig } from "./dues";
import type { Member } from "./members";
export function detailIdentity(kind: unknown, id: unknown) {
  if (
    !["registration", "member", "payment"].includes(String(kind)) ||
    typeof id !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(id)
  )
    throw new HttpError("Invalid record identifier", 400);
  return { kind: String(kind), id };
}
export async function recordDetails(
  kind: unknown,
  id: unknown,
  db = database(),
) {
  const identity = detailIdentity(kind, id);
  let registrationId = identity.id;
  let member: Member | null = null;
  if (identity.kind === "member") {
    member = await db
      .prepare("SELECT * FROM members WHERE id=?")
      .bind(identity.id)
      .first<Member>();
    if (!member) throw new HttpError("Member not found", 404);
    registrationId = member.registration_id;
  }
  const registration =
    identity.kind === "payment"
      ? await db
          .prepare("SELECT * FROM registrations WHERE payment_id=?")
          .bind(identity.id)
          .first<Record<string, any>>()
      : await db
          .prepare("SELECT * FROM registrations WHERE id=?")
          .bind(registrationId)
          .first<Record<string, any>>();
  if (!registration && identity.kind !== "payment")
    throw new HttpError("Registration not found", 404);
  const payment = await db
    .prepare(
      "SELECT p.id,p.full_name,p.email,p.phone,p.amount,p.amount_kobo,p.reference,p.status,p.completed,p.mode,p.created_at,p.paid_at,m.external_reference,m.approved_by,m.approved_at,CASE WHEN m.payment_id IS NULL THEN 'Paystack' ELSE 'Bank Transfer' END AS method FROM payments p LEFT JOIN manual_payments m ON m.payment_id=p.id WHERE p.id=?",
    )
    .bind(registration?.payment_id || identity.id)
    .first<Record<string, any>>();
  if (!payment) throw new HttpError("Payment not found", 404);
  if (registration && !member)
    member = await db
      .prepare("SELECT * FROM members WHERE registration_id=?")
      .bind(registration.id)
      .first<Member>();
  const dues = member
    ? (
        await db
          .prepare(
            "SELECT id,reference,external_reference,plan,amount_kobo,charged_kobo,mode,source,status,period_start,period_end,approved_by,created_at,paid_at FROM dues_payments WHERE member_id=? ORDER BY created_at DESC,id",
          )
          .bind(member.id)
          .all()
      ).results
    : [];
  const targets = [payment.id, registration?.id || "", member?.id || ""];
  const history = (
    await db
      .prepare(
        "SELECT actor,action,target,created_at FROM audit_logs WHERE target IN (?,?,?) ORDER BY created_at DESC",
      )
      .bind(...targets)
      .all()
  ).results;
  const config = await duesConfig();
  const safeMember = member
    ? {
        id: member.id,
        registrationId: member.registration_id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        enabled: !!member.enabled,
        emailVerified: !!member.email_verified_at,
        preferredPlan: member.preferred_plan,
        createdAt: member.created_at,
        ...membershipSummary(member, config.prices, config.graceDays),
        amountPaid: dues
          .filter((d) => d.status === "SUCCESS")
          .reduce((sum, d) => sum + Number(d.amount_kobo) / 100, 0),
      }
    : null;
  const savedForm = await setting("form");
  let sections = defaultSections;
  try {
    if (savedForm) sections = JSON.parse(savedForm).sections;
  } catch {}
  const fieldLabels = Object.fromEntries(
    sections.flatMap((s) => s.fields).map((f) => [f.id, f.label]),
  );
  return {
    registration,
    payment,
    member: safeMember,
    dues,
    history,
    fieldLabels,
  };
}
