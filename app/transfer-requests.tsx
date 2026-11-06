"use client";
import { useEffect, useState } from "react";
export default function TransferRequests({
  mode,
  onNotice,
  onRefresh,
}: {
  mode: string;
  onNotice: (s: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [rows, setRows] = useState<any[]>([]),
    [busy, setBusy] = useState(false),
    [links, setLinks] = useState<any[]>([]);
  async function load() {
    const r = await fetch("/api/admin/payments/transfers", {
      cache: "no-store",
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setRows(d);
  }
  useEffect(() => {
    load().catch((e) => onNotice("Error: " + e.message));
  }, []);
  async function post(b: unknown) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/payments/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setLinks(d.payments || []);
      await load();
      await onRefresh();
      onNotice(d.message);
    } catch (e) {
      onNotice("Error: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card">
      <h3>Bank transfers awaiting approval</h3>
      <p>
        Recording a claim does not confirm payment. Approve only after checking
        bank records.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          post({ action: "submit", mode, entry: Object.fromEntries(f) });
        }}
      >
        <div className="report-filters">
          {[
            ["name", "Name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone", "tel"],
            ["amount", "Claimed amount (₦)", "number"],
            ["paidDate", "Claimed payment date", "date"],
            ["externalReference", "Bank reference", "text"],
          ].map(([k, l, t]) => (
            <label key={k}>
              {l}
              <input required name={k} type={t} />
            </label>
          ))}
        </div>
        <button disabled={busy}>Record transfer for review</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name / contact</th>
              <th>Amount / bank reference</th>
              <th>Claimed date / mode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => r.mode === mode)
              .map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.name}
                    <br />
                    {r.email}
                    <br />
                    {r.phone}
                  </td>
                  <td>
                    ₦{Number(r.amount).toLocaleString()}
                    <br />
                    {r.external_reference}
                  </td>
                  <td>
                    {r.paid_date} · {r.mode}
                  </td>
                  <td>{r.status}</td>
                  <td>
                    {r.status === "PENDING" && (
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (
                            confirm(
                              `Confirm bank receipt of ₦${r.amount} from ${r.name} (${r.external_reference})?`,
                            )
                          )
                            post({
                              action: "approve",
                              id: r.id,
                              confirmed: true,
                            });
                        }}
                      >
                        Approve verified transfer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {links.map((l) => (
        <label key={l.id}>
          Private registration link for {l.name}
          <input readOnly value={l.registrationUrl} />
        </label>
      ))}
    </section>
  );
}
