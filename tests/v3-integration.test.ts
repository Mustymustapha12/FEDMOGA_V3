import { test, after } from "node:test";
import assert from "node:assert/strict";
import { database, getPool } from "../server/database";
import { hashPassword } from "../server/security";
import { putSetting } from "../app/lib";
import { previewReminders, sendReminders } from "../server/admin-reminders";
import { enqueueMail, brandedMail } from "../server/mail-jobs";
import { processMailJobs } from "../server/mail-jobs";
const base = process.env.FEDMOGA_APP_TEST_URL;
after(async () => {
  if (base) await getPool().end();
});
test(
  "V3 HTTP/MySQL: details, roles, complete exports, bank approval, reminders and safe account deletion",
  { skip: !base },
  async () => {
    assert.match(process.env.DB_NAME || "", /_test$/);
    const db = database(),
      origin = process.env.APP_URL!;
    const call = async (
      path: string,
      body?: unknown,
      cookie = "",
      method = body ? "POST" : "GET",
    ) =>
      fetch(base + path, {
        method,
        headers: { origin, "content-type": "application/json", cookie },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    async function login(email: string, password: string) {
      const r = await call("/api/auth/login", { email, password });
      assert.equal(r.status, 200, await r.clone().text());
      return r.headers.get("set-cookie")!.split(";")[0];
    }
    const root = await login(
      process.env.SUPER_ADMIN_EMAIL!,
      process.env.SUPER_ADMIN_PASSWORD!,
    );
    const adminEmail = "v3-admin@example.com",
      password = "V3-test-password-123";
    assert.equal(
      (
        await call(
          "/api/admin/users",
          { email: adminEmail, password, role: "ADMIN" },
          root,
        )
      ).status,
      200,
    );
    const admin = await login(adminEmail, password);
    const state = await (
      await call("/api/admin/state", undefined, root)
    ).json();
    const target = state.admins.find((a: any) => a.email === adminEmail);
    const memberId = crypto.randomUUID(),
      registrationId = crypto.randomUUID(),
      paymentId = crypto.randomUUID(),
      pending = crypto.randomUUID(),
      now = new Date().toISOString();
    await db
      .prepare(
        "INSERT INTO payments(id,full_name,email,phone,amount,status,created_at,completed,reference,mode,amount_kobo) VALUES(?,?,?,?,?,'SUCCESS',?,1,?,'test',?)",
      )
      .bind(
        paymentId,
        "V3 Profile",
        "v3-member@example.com",
        "08012345678",
        5000,
        now,
        "FEDMOGA-" + paymentId,
        500000,
      )
      .run();
    await db
      .prepare(
        "INSERT INTO registrations(id,payment_id,number,answers,created_at) VALUES(?,?,?,?,?)",
      )
      .bind(
        registrationId,
        paymentId,
        "FEDMOGA-V3-" + registrationId,
        JSON.stringify({
          fullName: "V3 Profile",
          address: "Synthetic address",
          year: "2008",
        }),
        now,
      )
      .run();
    await db
      .prepare(
        "INSERT INTO members(id,registration_id,email,name,phone,mode,password_hash,email_verified_at,created_at) VALUES(?,?,?,?,?,'test',?,?,?)",
      )
      .bind(
        memberId,
        registrationId,
        "v3-member@example.com",
        "V3 Profile",
        "08012345678",
        await hashPassword(password),
        now,
        now,
      )
      .run();
    await db
      .prepare(
        "INSERT INTO payments(id,full_name,email,phone,amount,status,created_at,completed,reference,mode,amount_kobo) VALUES(?,?,?,?,?,'PENDING',?,0,?,'test',?)",
      )
      .bind(
        pending,
        "V3 Pending",
        "v3-pending@example.com",
        "08012345679",
        5000,
        now,
        "FEDMOGA-" + pending,
        500000,
      )
      .run();
    const member = await login("v3-member@example.com", password);
    for (const cookie of [root, admin]) {
      for (const kind of ["registration", "member"]) {
        const id = kind === "member" ? memberId : registrationId;
        const r = await call(
          `/api/admin/records?kind=${kind}&id=${id}`,
          undefined,
          cookie,
        );
        assert.equal(r.status, 200, await r.clone().text());
        const d = await r.json();
        assert.equal(d.registration.id, registrationId);
        assert.equal(d.payment.id, paymentId);
        assert.equal(d.member.id, memberId);
        assert.equal(d.payment.reference, "FEDMOGA-" + paymentId);
        assert.equal(d.payment.method, "Paystack");
        assert.equal(JSON.stringify(d).includes("password_hash"), false);
        assert.match(d.registration.answers, /Synthetic address/);
      }
    }
    for (const cookie of ["", member]) {
      assert.equal(
        (
          await call(
            `/api/admin/records?kind=member&id=${memberId}`,
            undefined,
            cookie,
          )
        ).status,
        401,
      );
      assert.equal(
        (
          await call(
            "/api/admin/users",
            { id: target.id, confirmation: "DEACTIVATE ACCOUNT" },
            cookie,
            "DELETE",
          )
        ).status,
        401,
      );
    }
    assert.equal(
      (
        await call(
          `/api/admin/records?kind=registration&id=${memberId}`,
          undefined,
          root,
        )
      ).status,
      404,
    );
    assert.equal(
      (await call("/api/admin/records?kind=member&id=bad", undefined, root))
        .status,
      400,
    );
    const pendingDetail = await (
      await call(
        `/api/admin/records?kind=payment&id=${pending}`,
        undefined,
        root,
      )
    ).json();
    assert.equal(pendingDetail.payment.status, "PENDING");
    assert.equal(pendingDetail.registration, null);
    const transfer = {
      name: "V3 Bank",
      email: "v3-bank@example.com",
      phone: "08012345670",
      amount: "5000",
      paidDate: now.slice(0, 10),
      externalReference: "V3-TEST-BANK-001",
    };
    assert.equal(
      (
        await call(
          "/api/admin/payments/transfers",
          { action: "submit", entry: transfer, mode: "test" },
          admin,
        )
      ).status,
      200,
    );
    const awaiting = await (
      await call(
        "/api/admin/registrations?paymentStatus=awaiting&export=all",
        undefined,
        root,
      )
    ).json();
    assert.ok(awaiting.rows.some((r: any) => r.email === transfer.email));
    assert.equal(awaiting.summary.amountPaid, 0);
    const request = await db
      .prepare(
        "SELECT id FROM registration_transfer_requests WHERE external_reference=?",
      )
      .bind(transfer.externalReference)
      .first<{ id: string }>();
    assert.ok(request);
    assert.equal(
      (
        await call(
          "/api/admin/payments/transfers",
          { action: "approve", id: request.id, confirmed: false },
          root,
        )
      ).status,
      400,
    );
    const approval = await call(
      "/api/admin/payments/transfers",
      { action: "approve", id: request.id, confirmed: true },
      admin,
    );
    assert.equal(approval.status, 200, await approval.clone().text());
    const bank = (await approval.json()).payments[0];
    const detail = await (
      await call(
        `/api/admin/records?kind=payment&id=${bank.id}`,
        undefined,
        root,
      )
    ).json();
    assert.equal(detail.payment.method, "Bank Transfer");
    assert.equal(detail.payment.external_reference, transfer.externalReference);
    assert.equal(detail.payment.approved_by, adminEmail);
    assert.equal(
      (
        await call(
          "/api/admin/payments/transfers",
          { action: "approve", id: request.id, confirmed: true },
          root,
        )
      ).status,
      409,
    );
    for (let i = 0; i < 31; i++) {
      const id = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO payments(id,full_name,email,phone,amount,status,created_at,completed,reference,mode,amount_kobo) VALUES(?,?,?,?,?,'SUCCESS',?,0,?,'test',?)",
        )
        .bind(
          id,
          "V3 Page " + i,
          "page@example.com",
          "08010000000",
          5000,
          now,
          "FEDMOGA-" + id,
          500000,
        )
        .run();
    }
    const url =
      "/api/admin/registrations?search=V3%20Page&paymentStatus=paid&completion=paid-incomplete";
    const page = await (await call(url, undefined, root)).json(),
      exp = await (await call(url + "&export=all", undefined, root)).json();
    assert.equal(page.rows.length, 25);
    assert.equal(exp.rows.length, 31);
    assert.equal(exp.summary.amountPaid, 155000);
    await putSetting("dues_monthly", "1000");
    await putSetting("paystack_mode", "test");
    const preview = await previewReminders([memberId]);
    assert.equal(preview.total, 1);
    assert.equal(preview.recipients[0].outstanding, 1000);
    assert.equal(
      (
        await call(
          "/api/admin/members/reminders",
          { action: "send", token: preview.token, confirmed: false },
          admin,
        )
      ).status,
      400,
    );
    const sent = await sendReminders(preview.token, true, adminEmail);
    assert.equal(sent.queued, 1);
    assert.equal(
      (await sendReminders(preview.token, true, adminEmail)).duplicates,
      1,
    );
    await assert.rejects(sendReminders(preview.token + "a", true, adminEmail));
    await db
      .prepare("UPDATE members SET paid_until='2099-12-31' WHERE id=?")
      .bind(memberId)
      .run();
    await assert.rejects(previewReminders([memberId]), /outstanding/);
    await assert.rejects(sendReminders(preview.token, true, adminEmail));
    await processMailJobs(10);
    const cancelled = await db
      .prepare(
        "SELECT status FROM email_jobs WHERE member_id=? AND dedupe_key LIKE 'admin-dues-v3:%'",
      )
      .bind(memberId)
      .first<{ status: string }>();
    assert.equal(cancelled?.status, "CANCELLED");
    assert.equal(
      (
        await call(
          "/api/admin/users",
          { id: target.id, confirmation: "DEACTIVATE ACCOUNT" },
          admin,
          "DELETE",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call(
          "/api/admin/users",
          { id: state.admin.id, confirmation: "DEACTIVATE ACCOUNT" },
          root,
          "DELETE",
        )
      ).status,
      409,
    );
    await enqueueMail(
      "v3-failed-mail",
      brandedMail("failure@example.com", "Test failure", "Test", [
        "Synthetic email only",
      ]),
    );
    await db
      .prepare(
        "UPDATE email_jobs SET attempts=9,available_at='1970-01-01T00:00:00.000Z' WHERE dedupe_key='v3-failed-mail'",
      )
      .run();
    await processMailJobs(1);
    const failed = await db
      .prepare(
        "SELECT id,status FROM email_jobs WHERE dedupe_key='v3-failed-mail'",
      )
      .first<{ id: string; status: string }>();
    assert.equal(failed?.status, "FAILED");
    assert.ok(
      await db
        .prepare(
          "SELECT id FROM email_attempts WHERE job_id=? AND status='FAILED'",
        )
        .bind(failed!.id)
        .first(),
    );
    assert.equal(
      (await call("/api/admin/email/history", { id: failed!.id }, admin))
        .status,
      403,
    );
    assert.equal(
      (await call("/api/admin/email/history", { id: failed!.id }, root)).status,
      200,
    );
    assert.equal(
      (
        await db
          .prepare("SELECT status FROM email_jobs WHERE id=?")
          .bind(failed!.id)
          .first<{ status: string }>()
      )?.status,
      "PENDING",
    );
    const before = await db
      .prepare("SELECT COUNT(*) AS n FROM payments")
      .first<{ n: number }>();
    const removed = await call(
      "/api/admin/users",
      { id: target.id, confirmation: "DEACTIVATE ACCOUNT" },
      root,
      "DELETE",
    );
    assert.equal(removed.status, 200, await removed.clone().text());
    assert.equal(
      (await call("/api/admin/state", undefined, admin)).status,
      401,
    );
    assert.equal(
      (
        await db
          .prepare("SELECT active FROM admins WHERE id=?")
          .bind(target.id)
          .first<{ active: number }>()
      )?.active,
      0,
    );
    assert.equal(
      (
        await db
          .prepare("SELECT COUNT(*) AS n FROM payments")
          .first<{ n: number }>()
      )?.n,
      before?.n,
    );
    assert.ok(
      await db
        .prepare("SELECT id FROM members WHERE id=?")
        .bind(memberId)
        .first(),
    );
    assert.ok(
      await db
        .prepare(
          "SELECT id FROM audit_logs WHERE action='admin.deactivated.success' AND actor=?",
        )
        .bind(process.env.SUPER_ADMIN_EMAIL!)
        .first(),
    );
  },
);
