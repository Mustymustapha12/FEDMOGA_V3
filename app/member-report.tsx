"use client";
import { useState } from "react";
import RecordDetails from "./record-details";
import {
  emptyFilters,
  filteredRows,
  reportAnswers,
  downloadReport,
  reportSequence,
  memberExportRows,
  type ReportRow,
} from "./report-data";
export default function MemberReport({
  rows,
  title = "Member report",
  onView,
  renderActions,
  recordKind = "member",
  superAdmin = false,
  onNotice = (s: string) => alert(s),
  onRefresh,
}: {
  recordKind?: "member" | "registration";
  superAdmin?: boolean;
  onNotice?: (s: string) => void;
  onRefresh?: () => Promise<void>;
  rows: ReportRow[];
  title?: string;
  onView?: (r: ReportRow) => void;
  renderActions?: (r: ReportRow) => React.ReactNode;
}) {
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(25);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ ...emptyFilters });
  const visible = filteredRows(rows, filters),
    membership = rows.some((r) => r.status);
  const pages = Math.max(1, Math.ceil(visible.length / pageSize)),
    currentPage = Math.min(page, pages);
  const pageRows = visible.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const seq = (i: number) =>
    reportSequence(
      (currentPage - 1) * pageSize + i,
      visible.length,
      filters.direction,
    );
  const field = (key: keyof typeof filters, label: string, type = "text") => (
    <label key={key}>
      {label}
      <input
        type={type}
        value={filters[key]}
        onChange={(e) => (
          setPage(1),
          setFilters({ ...filters, [key]: e.target.value })
        )}
      />
    </label>
  );
  return (
    <section className="card report-card">
      <div className="toolbar">
        <h2>{title}</h2>
        <button
          className="secondary"
          onClick={() =>
            downloadReport(
              "fedmoga-members.csv",
              memberExportRows(visible, filters.direction),
            )
          }
        >
          Export filtered CSV
        </button>
      </div>
      <div className="report-filters">
        {field("search", "Search name, email, phone or form answers")}
        <label>
          Paid / owing
          <select
            value={filters.paymentStatus || "all"}
            onChange={(e) => {
              setFilters({ ...filters, paymentStatus: e.target.value });
              setPage(1);
            }}
          >
            <option value="all">All Members</option>
            <option value="paid">Paid / Up to Date</option>
            <option value="owing">Owing</option>
          </select>
        </label>
        {field("expiryFrom", "Expiry from", "date")}
        {field("expiryTo", "Expiry to", "date")}
        {membership && (
          <>
            <label>
              Membership status
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                {["all", "active", "overdue", "inactive"].map((v) => (
                  <option key={v} value={v}>
                    {v === "all" ? "All statuses" : v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Payment plan
              <select
                value={filters.plan}
                onChange={(e) =>
                  setFilters({ ...filters, plan: e.target.value })
                }
              >
                {["all", "monthly", "quarterly", "annually"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <label>
          Payment mode
          <select
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
          >
            {["all", "live", "test"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        {field("year", "Graduation year")}
        {field("country", "Country")}
        {field("profession", "Profession")}
        {field("from", "Registered from", "date")}
        {field("to", "Registered to", "date")}
        <label>
          Sort by
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="date">Registration date</option>
            <option value="number">Registration number</option>
            <option value="name">Member name</option>
          </select>
        </label>
        <label>
          Order / numbering
          <select
            value={filters.direction}
            onChange={(e) =>
              setFilters({ ...filters, direction: e.target.value })
            }
          >
            <option value="asc">Ascending (1 → last)</option>
            <option value="desc">Descending (last → 1)</option>
          </select>
        </label>
        <button
          className="secondary"
          onClick={() => setFilters({ ...emptyFilters })}
        >
          Clear filters
        </button>
      </div>
      <p>
        <strong>{visible.length}</strong> matching members of {rows.length}.
        Export follows these filters and this order. Paid:{" "}
        {visible.filter((r) => r.paymentStatus === "paid").length} · Owing:{" "}
        {visible.filter((r) => r.paymentStatus === "owing").length} ·
        Outstanding next renewals: ₦
        {visible
          .reduce((sum, r) => sum + Number(r.outstanding || 0), 0)
          .toLocaleString("en-NG")}
        .
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "No.",
                "Member",
                "Contact",
                "Status",
                "Plan / paid through",
                "Paid / outstanding",
                "Registered",
                "Details",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r.id}>
                <td>{seq(i)}</td>
                <td>
                  {r.name}
                  <br />
                  <small>{r.number}</small>
                </td>
                <td>
                  {r.email}
                  <br />
                  {r.phone}
                </td>
                <td>{r.status || "Registered"}</td>
                <td>
                  {r.preferredPlan || "—"}
                  <br />
                  {r.paidUntil || "—"}
                </td>
                <td>
                  ₦{Number(r.amountPaid || 0).toLocaleString("en-NG")} / ₦
                  {Number(r.outstanding || 0).toLocaleString("en-NG")}
                </td>
                <td>{r.date?.slice(0, 10)}</td>
                <td>
                  {String(reportAnswers(r).year || "—")} ·{" "}
                  {String(reportAnswers(r).country || "—")}
                  {renderActions?.(r)}
                  {
                    <button
                      className="secondary"
                      onClick={() => (onView ? onView(r) : setDetailId(r.id))}
                    >
                      View entry
                    </button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p>No members match these filters.</p>}
      </div>
      <div className="toolbar">
        <button
          disabled={currentPage <= 1}
          onClick={() => setPage(currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {pages}
        </span>
        <button
          disabled={currentPage >= pages}
          onClick={() => setPage(currentPage + 1)}
        >
          Next
        </button>
        <label>
          Page size
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {detailId && (
        <RecordDetails
          key={detailId}
          superAdmin={superAdmin}
          onRefresh={onRefresh}
          kind={recordKind}
          id={detailId}
          onClose={() => setDetailId(null)}
          onNotice={onNotice}
        />
      )}
    </section>
  );
}
