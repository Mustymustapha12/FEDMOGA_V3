"use client";
import { useEffect, useState } from "react";
export default function EmailDelivery({
  onNotice,
}: {
  onNotice: (s: string) => void;
}) {
  const [rows, setRows] = useState<any[]>([]);
  async function load() {
    const r = await fetch("/api/admin/email/history", { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setRows(d);
  }
  useEffect(() => {
    load().catch((e) => onNotice("Error: " + e.message));
  }, []);
  async function retry(id: string) {
    if (!confirm("Retry this failed email job?")) return;
    try {
      const r = await fetch("/api/admin/email/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
      onNotice(d.message);
    } catch (e) {
      onNotice("Error: " + (e as Error).message);
    }
  }
  return (
    <section className="card">
      <h3>Email attempts and failures</h3>
      <p>
        Latest 200 jobs. SENT means SMTP accepted the message; inbox delivery is
        not verified.
      </p>
      <button
        className="secondary"
        onClick={() => load().catch((e) => onNotice(e.message))}
      >
        Refresh email status
      </button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Recipient",
                "Status",
                "Attempts",
                "Queued / accepted",
                "Outcome",
                "Action",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.to}</td>
                <td>{r.status}</td>
                <td>
                  {r.attempts}
                  <details>
                    <summary>Attempt history</summary>
                    {r.history?.map((a: any) => (
                      <p key={a.id}>
                        {a.attempted_at} · {a.status} ·{" "}
                        {a.error || "SMTP accepted"}
                      </p>
                    ))}
                  </details>
                </td>
                <td>
                  {r.created_at}
                  <br />
                  {r.sent_at}
                </td>
                <td>{r.last_error || "—"}</td>
                <td>
                  {r.status === "FAILED" && (
                    <button onClick={() => retry(r.id)}>
                      Retry failed email
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
