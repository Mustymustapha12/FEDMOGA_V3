import { test } from "node:test";
import assert from "node:assert/strict";
import { authorizeDeactivation } from "../server/account-policy";
import { membershipSummary } from "../server/membership-summary";
import { queryReport } from "../server/report-query";
import { detailIdentity } from "../server/record-details";
import { reminderIds } from "../server/admin-reminders";
import type { Member } from "../server/members";
const root = { id: "root", role: "SUPER_ADMIN", active: 1 },
  other = { id: "other", role: "SUPER_ADMIN", active: 1 },
  admin = { id: "admin", role: "ADMIN", active: 1 };
test("V3 deactivation policy protects self and last active Super Admin", () => {
  assert.throws(() => authorizeDeactivation(root, root, [root]), /own account/);
  assert.throws(
    () => authorizeDeactivation({ ...root, id: "outsider" }, root, [root]),
    /last active/,
  );
  assert.doesNotThrow(() => authorizeDeactivation(root, other, [root, other]));
});
test("V3 deactivation policy denies Admin and inactive Super Admin", () => {
  assert.throws(
    () => authorizeDeactivation(admin, other, [root, other, admin]),
    /Super Admin/,
  );
  assert.throws(
    () => authorizeDeactivation({ ...root, active: 0 }, admin, [admin, other]),
    /Super Admin/,
  );
});
test("V3 details use explicit record kind and UUID, rejecting swapped/missing identifiers", () => {
  const id = "a".repeat(8) + "-aaaa-aaaa-aaaa-" + "a".repeat(12);
  assert.deepEqual(detailIdentity("member", id), { kind: "member", id });
  for (const [k, v] of [
    ["unknown", id],
    ["registration", ""],
    ["member", "1 OR 1=1"],
  ])
    assert.throws(() => detailIdentity(k, v));
});
test("V3 outstanding balance preserves one next renewal and early-renewal calendar coverage", () => {
  const m = {
    enabled: 1,
    paid_until: "2026-10-31",
    created_at: "2026-01-01",
    preferred_plan: "monthly",
  } as Member;
  const prices = { monthly: 1000 };
  const paid = membershipSummary(m, prices, 30, "2026-10-20");
  assert.equal(paid.outstanding, 0);
  assert.equal(paid.periodStart, "2026-11-01");
  assert.equal(paid.periodEnd, "2026-11-30");
  const owing = membershipSummary(m, prices, 30, "2026-12-20");
  assert.equal(owing.outstanding, 1000);
  assert.equal(owing.status, "inactive");
  assert.equal(
    membershipSummary({ ...m, enabled: 0 }, prices, 30, "2026-12-20")
      .outstanding,
    0,
  );
});
test("V3 pagination and full exports use identical filters and preserve paid incomplete records", () => {
  const rows = Array.from({ length: 61 }, (_, i) => ({
    id: String(i),
    number: String(i),
    name: "Member " + i,
    email: "m@example.com",
    phone: "0801",
    paymentStatus: i % 2 ? "pending" : "paid",
    method: i % 3 ? "Paystack" : "Bank Transfer",
    completion: i % 2 ? "incomplete" : "paid-incomplete",
    amountPaid: i % 2 ? 0 : 5000,
    date: "2026-11-01",
  }));
  const q = new URLSearchParams({
    paymentStatus: "paid",
    page: "2",
    pageSize: "25",
  });
  const page = queryReport(rows, q);
  assert.equal(page.total, 31);
  assert.equal(page.rows.length, 6);
  assert.equal(page.summary.amountPaid, 155000);
  q.set("export", "all");
  assert.equal(queryReport(rows, q).rows.length, 31);
  q.set("method", "Bank Transfer");
  assert.equal(queryReport(rows, q).rows.length, 11);
  q.set("pendingOnly", "true");
  assert.equal(queryReport(rows, q).rows.length, 11);
});
test("V3 invalid pagination is rejected and empty result remains page one", () => {
  assert.throws(() =>
    queryReport([], new URLSearchParams({ pageSize: "999999" })),
  );
  assert.throws(() => queryReport([], new URLSearchParams({ page: "-1" })));
  assert.equal(queryReport([], new URLSearchParams({ page: "99" })).page, 1);
});
test("V3 reminder selection rejects invalid and excessive ids and deduplicates", () => {
  const id = crypto.randomUUID();
  assert.deepEqual(reminderIds([id, id]), [id]);
  assert.throws(() => reminderIds([]));
  assert.throws(() => reminderIds(["bad"]));
  assert.throws(() => reminderIds(Array(101).fill(id)));
});

test("V3 staging safeguards reject production database names, live keys and missing email sink", async () => {
  const { getPool } = await import("../server/database");
  const { paystackKey } = await import("../app/lib");
  const { sendEmail } = await import("../server/email");
  const saved = {
    FEDMOGA_ENV: process.env.FEDMOGA_ENV,
    DB_NAME: process.env.DB_NAME,
    STAGING_EMAIL_SINK: process.env.STAGING_EMAIL_SINK,
  };
  try {
    process.env.FEDMOGA_ENV = "staging";
    process.env.DB_NAME = "production";
    delete process.env.STAGING_EMAIL_SINK;
    assert.throws(() => getPool(), /separate database/);
    await assert.rejects(paystackKey("live"), /Live Paystack/);
    await assert.rejects(
      sendEmail("real@example.com", "Blocked", "Blocked"),
      /STAGING_EMAIL_SINK/,
    );
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test("V3 malformed legacy answers cannot crash member reporting or hide payment identity", async () => {
  const { reportAnswers, filteredRows, emptyFilters } =
    await import("../app/report-data");
  for (const answers of ["null", "broken", "[]", "42"]) {
    const row = {
      id: "x",
      name: "Legacy member",
      email: "legacy@example.com",
      phone: "0801",
      number: "FED-1",
      answers,
    };
    assert.deepEqual(reportAnswers(row), {});
    assert.equal(
      filteredRows([row], { ...emptyFilters, search: "Legacy" }).length,
      1,
    );
  }
});

test("V3 staging SMTP rewrites intended recipients to the controlled sink", async () => {
  const nodemailer = (await import("nodemailer")).default;
  const { sendEmail } = await import("../server/email");
  const names = [
    "FEDMOGA_ENV",
    "STAGING_EMAIL_SINK",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "APP_URL",
  ];
  const saved = Object.fromEntries(names.map((k) => [k, process.env[k]])),
    original = nodemailer.createTransport;
  let recipient = "";
  try {
    Object.assign(process.env, {
      FEDMOGA_ENV: "staging",
      STAGING_EMAIL_SINK: "controlled@example.com",
      SMTP_HOST: "mock",
      SMTP_USER: "mock",
      SMTP_PASSWORD: "mock",
      SMTP_FROM: "mock@example.com",
      APP_URL: "https://fedmoga.example",
    });
    nodemailer.createTransport = (() => ({
      sendMail: async (o: any) => {
        recipient = o.to;
        return { accepted: [o.to], rejected: [] };
      },
      close: () => {},
    })) as unknown as typeof nodemailer.createTransport;
    await sendEmail(
      "member-must-not-receive@example.com",
      "Synthetic test",
      "Synthetic only",
    );
    assert.equal(recipient, "controlled@example.com");
  } finally {
    nodemailer.createTransport = original;
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
