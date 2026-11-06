import {
  emptyFilters,
  filteredRows,
  type ReportFilters,
  type ReportRow,
} from "../app/report-data";
import { HttpError } from "./security";
export function queryReport(rows: ReportRow[], q: URLSearchParams) {
  const filters: ReportFilters = { ...emptyFilters };
  for (const key of [
    "search",
    "status",
    "mode",
    "plan",
    "year",
    "country",
    "profession",
    "from",
    "to",
    "sort",
    "direction",
    "paymentStatus",
    "method",
    "completion",
    "expiryFrom",
    "expiryTo",
  ] as (keyof ReportFilters)[]) {
    if (q.has(key)) filters[key] = q.get(key)!;
  }
  if (
    !["date", "number", "name"].includes(filters.sort) ||
    !["asc", "desc"].includes(filters.direction)
  )
    throw new HttpError("Invalid report sort");
  const all = filteredRows(
    q.get("pendingOnly") === "true"
      ? rows.filter((r) => r.completion !== "completed")
      : rows,
    filters,
  );
  const pageSize = Number(q.get("pageSize") || 25),
    requestedPage = Number(q.get("page") || 1);
  if (
    ![10, 25, 50, 100].includes(pageSize) ||
    !Number.isSafeInteger(requestedPage) ||
    requestedPage < 1
  )
    throw new HttpError("Invalid pagination");
  const pages = Math.max(1, Math.ceil(all.length / pageSize)),
    page = Math.min(requestedPage, pages);
  const confirmed = all.filter((r) => r.paymentStatus === "paid");
  return {
    rows:
      q.get("export") === "all"
        ? all
        : all.slice((page - 1) * pageSize, page * pageSize),
    total: all.length,
    page,
    pageSize,
    pages,
    summary: {
      total: all.length,
      paid: confirmed.length,
      pending: all.filter((r) => r.paymentStatus === "pending").length,
      awaiting: all.filter((r) => r.paymentStatus === "awaiting").length,
      online: all.filter((r) => r.method === "Paystack").length,
      bank: all.filter((r) => r.method === "Bank Transfer").length,
      incomplete: all.filter((r) => r.completion !== "completed").length,
      amountPaid: confirmed.reduce(
        (sum, r) => sum + Number(r.amountPaid || 0),
        0,
      ),
    },
  };
}
