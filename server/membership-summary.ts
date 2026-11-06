import { membershipStatus, renewalPeriod, today, validPlan } from "./calendar";
import type { Member } from "./members";
export function membershipSummary(
  m: Member,
  prices: Record<string, number>,
  graceDays: number,
  date = today(),
) {
  const plan = validPlan(m.preferred_plan) ? m.preferred_plan : "monthly";
  const covered = !!m.paid_until && m.paid_until >= date;
  const nextAmount = Number(prices[plan] || 0);
  const period = renewalPeriod(m.paid_until, plan, date);
  return {
    status: membershipStatus(
      m.paid_until,
      m.created_at,
      m.enabled,
      graceDays,
      date,
    ),
    paymentStatus: covered ? "paid" : "owing",
    outstanding: m.enabled && !covered ? nextAmount : 0,
    nextAmount,
    duesPeriod: plan,
    periodStart: period.start,
    periodEnd: period.end,
    dueDate: m.paid_until || period.end,
    paidUntil: m.paid_until,
  };
}
