"use client";
import { useEffect, useState } from "react";
import {
  downloadReport,
  memberExportRows,
  reportSequence,
  type ReportRow,
} from "./report-data";
import RecordDetails from "./record-details";
export default function RegistrationReport({
  pendingOnly = false,
  superAdmin = false,
  onNotice,
  onRefresh,
  onShowHistory,
}: {
  pendingOnly?: boolean;
  superAdmin?: boolean;
  onNotice: (s: string) => void;
  onRefresh: () => Promise<void>;
  onShowHistory: () => void;
}) {
  const defaults = {
    search: "",
    paymentStatus: "all",
    method: "all",
    completion: "all",
    mode: "all",
    from: "",
    to: "",
    year: "",
    country: "",
    profession: "",
    sort: "date",
    direction: "desc",
  };
  const [filters, setFilters] = useState(defaults),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(25),
    [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<ReportRow | null>(null),
    [version, setVersion] = useState(0);
  const query = new URLSearchParams({
    ...filters,
    page: String(page),
    pageSize: String(pageSize),
    ...(pendingOnly ? { pendingOnly: "true" } : {}),
  }).toString();
  useEffect(() => {
    const a = new AbortController();
    setError("");
    setData(null);
    fetch("/api/admin/registrations?" + query, {
      cache: "no-store",
      signal: a.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => a.abort();
  }, [query, version]);
  function update(k: string, v: string) {
    setFilters({ ...filters, [k]: v });
    setPage(1);
    setSelected(null);
  }
  async function refresh() {
    setVersion((v) => v + 1);
    await onRefresh();
  }
  async function exportAll() {
    try {
      const r = await fetch(
        "/api/admin/registrations?" + query + "&export=all",
        { cache: "no-store" },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      downloadReport(
        "fedmoga-registrations.csv",
        memberExportRows(d.rows, filters.direction),
      );
    } catch (e) {
      onNotice("Error: " + (e as Error).message);
    }
  }
  return (
    <section className="card">
      <div className="toolbar">
        <h2>
          {pendingOnly ? "Pending & Incomplete" : "All Registrations / Reports"}
        </h2>
        <button className="secondary" onClick={onShowHistory}>
          Payment history & existing controls
        </button>
        <button onClick={exportAll}>Export all matching records</button>
      </div>
      <div className="report-filters">
        <label>
          Search name, email or phone
          <input
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </label>
        {(
          [
            [
              "paymentStatus",
              "Payment status",
              [
                ["all", "All"],
                ["paid", "Paid"],
                ["pending", "Pending Payment"],
                ["awaiting", "Awaiting Bank Transfer Approval"],
              ],
            ],
            [
              "method",
              "Payment method",
              [
                ["all", "All Methods"],
                ["Paystack", "Online / Paystack"],
                ["Bank Transfer", "Bank Transfer"],
              ],
            ],
            [
              "completion",
              "Registration completion",
              [
                ["all", "All Registrations"],
                ["completed", "Completed"],
                ["paid-incomplete", "Paid — Finish Registration"],
              ],
            ],
            [
              "mode",
              "Mode",
              [
                ["all", "All"],
                ["test", "Test"],
                ["live", "Live"],
              ],
            ],
            [
              "sort",
              "Sort by",
              [
                ["date", "Date"],
                ["name", "Name"],
                ["number", "Registration number"],
              ],
            ],
            [
              "direction",
              "Order / numbering",
              [
                ["asc", "Ascending"],
                ["desc", "Descending"],
              ],
            ],
          ] as [keyof typeof filters, string, string[][]][]
        ).map(([k, label, options]) => (
          <label key={k}>
            {label}
            <select
              value={filters[k]}
              onChange={(e) => update(k, e.target.value)}
            >
              {options.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        ))}
        {(
          [
            ["from", "From", "date"],
            ["to", "To", "date"],
            ["year", "Graduation year", "text"],
            ["country", "Country", "text"],
            ["profession", "Profession", "text"],
          ] as [keyof typeof filters, string, string][]
        ).map(([k, l, t]) => (
          <label key={k}>
            {l}
            <input
              type={t}
              value={filters[k]}
              onChange={(e) => update(k, e.target.value)}
            />
          </label>
        ))}
        <button
          className="secondary"
          onClick={() => {
            setFilters(defaults);
            setPage(1);
          }}
        >
          Clear filters
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>Loading registrations…</p>}
      {data && (
        <>
          <p>
            {data.total} matching records · Paid {data.summary.paid} · Pending{" "}
            {data.summary.pending} · Awaiting approval {data.summary.awaiting} ·
            Online {data.summary.online} · Bank {data.summary.bank} · Incomplete{" "}
            {data.summary.incomplete} · Confirmed ₦
            {Number(data.summary.amountPaid).toLocaleString("en-NG")}
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    "No.",
                    "Name / registration",
                    "Contact",
                    "Method / reference",
                    "Status",
                    "Paid (₦) / date",
                    "Completion",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r: ReportRow, i: number) => (
                  <tr key={r.id}>
                    <td>
                      {reportSequence(
                        (data.page - 1) * pageSize + i,
                        data.total,
                        filters.direction,
                      )}
                    </td>
                    <td>
                      {r.name}
                      <br />
                      {r.number || "Not completed"}
                    </td>
                    <td>
                      {r.email}
                      <br />
                      {r.phone}
                    </td>
                    <td>
                      {String(r.method)}
                      <br />
                      {String(r.reference)}
                    </td>
                    <td>{String(r.paymentStatus)}</td>
                    <td>
                      {Number(r.amountPaid || 0).toLocaleString("en-NG")}
                      <br />
                      {String(r.paidAt || "—")}
                    </td>
                    <td>{String(r.completion)}</td>
                    <td>
                      {r.recordKind !== "transfer" ? (
                        <button
                          className="secondary"
                          onClick={() => setSelected(r)}
                        >
                          View
                        </button>
                      ) : (
                        <span>Review under Previous Payments to Approve</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="toolbar">
            <button
              disabled={data.page <= 1}
              onClick={() => setPage(data.page - 1)}
            >
              Previous
            </button>
            <span>
              Page {data.page} of {data.pages}
            </span>
            <button
              disabled={data.page >= data.pages}
              onClick={() => setPage(data.page + 1)}
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
        </>
      )}
      {selected && (
        <RecordDetails
          key={selected.id}
          kind={selected.recordKind as "registration" | "payment"}
          id={selected.id}
          superAdmin={superAdmin}
          onClose={() => setSelected(null)}
          onNotice={onNotice}
          onRefresh={refresh}
        />
      )}
    </section>
  );
}
