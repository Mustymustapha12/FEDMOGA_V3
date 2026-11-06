"use client";
import { useState } from "react";
export default function DuesReminders({
  members,
  onNotice,
}: {
  members: any[];
  onNotice: (s: string) => void;
}) {
  const [ids, setIds] = useState<string[]>([]),
    [preview, setPreview] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [search, setSearch] = useState("");
  const owing = members.filter((m) => Number(m.outstanding) > 0),
    shown = owing.filter((m) =>
      [m.name, m.email, m.phone]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  async function post(b: unknown) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/members/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.token) {
        setPreview(d);
        setConfirmed(false);
      } else {
        setPreview(null);
        setIds([]);
        onNotice(d.message);
      }
    } catch (e) {
      setPreview(null);
      onNotice("Error: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card">
      <h3>Individual and bulk dues reminders</h3>
      <p>
        Select up to 100 owing members. A single selection sends an individual
        reminder. Paid members are excluded.
      </p>
      <label>
        Find owing member
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <div style={{ maxHeight: 280, overflow: "auto" }}>
        {shown.map((m) => (
          <label key={m.id}>
            <input
              type="checkbox"
              checked={ids.includes(m.id)}
              disabled={busy}
              onChange={(e) => {
                setIds(
                  e.target.checked
                    ? [...ids, m.id]
                    : ids.filter((id) => id !== m.id),
                );
                setPreview(null);
                setConfirmed(false);
              }}
            />
            {m.name} · {m.email} · ₦
            {Number(m.outstanding).toLocaleString("en-NG")}
          </label>
        ))}
      </div>
      <p>{ids.length} selected</p>
      <button
        disabled={busy || !ids.length || ids.length > 100}
        onClick={() => post({ ids })}
      >
        Preview reminders
      </button>
      {preview && (
        <>
          <h4>Confirm {preview.total} recipient(s)</h4>
          {preview.recipients.map((m: any) => (
            <p key={m.id}>
              {m.name} · {m.email} · ₦{m.outstanding} · {m.periodStart} to{" "}
              {m.periodEnd} · Due {m.dueDate}
            </p>
          ))}
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I reviewed these recipients, balances and periods.
          </label>
          <button
            disabled={busy || !confirmed}
            onClick={() =>
              post({ action: "send", token: preview.token, confirmed })
            }
          >
            Confirm and queue {preview.total} reminders
          </button>
        </>
      )}
    </section>
  );
}
