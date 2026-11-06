"use client";
import { useEffect, useState, useRef } from "react";
const money = (v: unknown) => "₦" + Number(v || 0).toLocaleString("en-NG");
export default function RecordDetails({
  kind,
  id,
  onClose,
  onNotice,
  onRefresh,
  superAdmin = false,
}: {
  kind: "registration" | "member" | "payment";
  id: string;
  onClose: () => void;
  onNotice: (s: string) => void;
  onRefresh?: () => Promise<void>;
  superAdmin?: boolean;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [kind, id]);
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    setData(null);
    setError("");
    fetch(`/api/admin/records?kind=${kind}&id=${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, [kind, id]);
  async function action(path: string, body: unknown) {
    setBusy(true);
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      onNotice(d.message || "Action completed");
      if (d.registrationUrl) {
        await navigator.clipboard.writeText(d.registrationUrl);
        onNotice("Private registration link copied");
      }
      await onRefresh?.();
      if (path.includes("clear")) onClose();
    } catch (e) {
      onNotice("Error: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      ref={panel}
      className="card"
      style={{ marginTop: 20 }}
      aria-label="Record details"
    >
      <div className="toolbar">
        <h2>{kind === "member" ? "Member profile" : "Registration details"}</h2>
        <button className="secondary" onClick={onClose}>
          Close details
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>Loading details…</p>}
      {data && (
        <>
          <h3>{data.payment.full_name}</h3>
          <p>
            {data.payment.email} · {data.payment.phone}
          </p>
          <p>
            Registration: {data.registration?.number || "Not completed"} · ID:{" "}
            {data.registration?.id || "—"}
          </p>
          <dl className="detail">
            {Object.entries(
              (() => {
                try {
                  const parsed = JSON.parse(data.registration?.answers || "{}");
                  return parsed && typeof parsed === "object" ? parsed : {};
                } catch {
                  return {};
                }
              })(),
            ).map(([key, value]) => (
              <div key={key} style={{ display: "contents" }}>
                <dt>{data.fieldLabels?.[key] || key}</dt>
                <dd>
                  {typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value ?? "")}
                </dd>
              </div>
            ))}
          </dl>
          <h3>Registration payment</h3>
          <p>
            {data.payment.status} · {data.payment.method} ·{" "}
            {money(data.payment.status === "SUCCESS" ? data.payment.amount : 0)}{" "}
            confirmed · Expected: {money(data.payment.amount)}
          </p>
          <p>Transaction reference: {data.payment.reference}</p>
          <p>
            Paid: {data.payment.paid_at || "Not confirmed"} · Created:{" "}
            {data.payment.created_at} · Mode: {data.payment.mode}
          </p>
          {data.payment.external_reference && (
            <p>
              Bank / external reference: {data.payment.external_reference} ·
              Approved by {data.payment.approved_by} at{" "}
              {data.payment.approved_at}
            </p>
          )}
          {data.member && (
            <>
              <h3>Membership</h3>
              <p>
                {data.member.status} · {data.member.paymentStatus} ·{" "}
                {data.member.preferredPlan}
              </p>
              <p>
                Paid through: {data.member.paidUntil || "No dues paid"} ·
                Outstanding next renewal: {money(data.member.outstanding)} ·
                Dues paid: {money(data.member.amountPaid)}
              </p>
              <p>
                Next coverage: {data.member.periodStart} to{" "}
                {data.member.periodEnd} · Due date: {data.member.dueDate}
              </p>
            </>
          )}
          <h3>Dues and renewal history</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    "Reference",
                    "Method",
                    "Status",
                    "Amount",
                    "Paid",
                    "Period",
                    "Approved by",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.dues.map((d: any) => (
                  <tr key={d.id}>
                    <td>
                      {d.reference}
                      <br />
                      {d.external_reference}
                    </td>
                    <td>{d.source}</td>
                    <td>{d.status}</td>
                    <td>{money(Number(d.amount_kobo) / 100)}</td>
                    <td>{d.paid_at || "—"}</td>
                    <td>
                      {d.period_start} – {d.period_end}
                    </td>
                    <td>{d.approved_by || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Administrative history</h3>
          {data.history.map((h: any, i: number) => (
            <p key={i}>
              {h.created_at} · {h.actor} · {h.action}
            </p>
          ))}
          {!data.history.length && (
            <p>No administrative events recorded for this record.</p>
          )}
          <div className="button-row">
            {data.payment.status === "SUCCESS" && !data.payment.completed && (
              <>
                <button
                  disabled={busy}
                  onClick={() =>
                    action("/api/admin/payments/resend", {
                      id: data.payment.id,
                    })
                  }
                >
                  Email registration link
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    action("/api/admin/payments/link", { id: data.payment.id })
                  }
                >
                  Copy registration link
                </button>
              </>
            )}
            {data.payment.status === "PENDING" && (
              <button
                disabled={busy}
                onClick={() =>
                  action("/api/admin/payments/remind", { id: data.payment.id })
                }
              >
                Send payment reminder
              </button>
            )}
            {superAdmin &&
              data.registration &&
              data.payment.mode === "test" && (
                <button
                  disabled={busy}
                  className="secondary"
                  onClick={() => {
                    if (
                      confirm(
                        "Permanently delete this TEST registration and payment?",
                      )
                    )
                      action("/api/admin/test-data/clear", {
                        confirmation: "DELETE TEST DATA",
                        registrationId: data.registration.id,
                      });
                  }}
                >
                  Delete test entry
                </button>
              )}
          </div>
        </>
      )}
    </section>
  );
}
