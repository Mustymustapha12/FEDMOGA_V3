# Email and notifications
Nodemailer uses SMTP_HOST/PORT/USER/PASSWORD/FROM with TLS; public/logo.jpg is attached inline. Existing activation/reset, registration continuation, dues receipt, pending-checkout and scheduled-reminder templates retain branding. SMTP settings are environment variables; Paystack settings are encrypted database settings.

email_jobs is the encrypted outbox with unique dedupe_key, status, attempts, next available time, processing lease, sent time and sanitized error. Processing handles at most ten jobs per service call (five via jobs endpoint), leases for five minutes and backs off exponentially up to 60 minutes. Failures become FAILED after ten attempts. SENT means SMTP accepted; inbox delivery/bounces are not implemented. SMTP retries remain at least once across a crash.

V3 email_attempts adds per-attempt recipient, attempted/completed timestamps, status and sanitized failure. PROCESSING can indicate interruption, ACCEPTED SMTP acceptance, FAILED failure. Super Admin can inspect the latest 200 jobs with attempt histories and retry one FAILED job. Existing global failed-job retry remains available. Payloads/tokens are not returned to the browser.

Admin dues reminders: select 1–100 owing members → signed preview of recipients, balances, periods and dates → explicit confirmation → server rechecks current locked records. Expired/altered previews or changed payment data fail. Daily keys incorporate member, paid-through date, plan and amount; duplicate requests do not queue another identical reminder. Only enabled owing members at nonzero configured prices qualify. Queued manual V3 reminders are cancelled if the member becomes paid/disabled or the queued date, coverage, plan or price changes before processing. A fresh preview is then required.

Existing scheduled reminders are distinct advance-renewal notices and retain their 7/1 days before, on date and 1/7/30 days after due schedule. They are not admin outstanding-balance campaigns.

Staging: set FEDMOGA_ENV=staging, isolated SMTP credentials and STAGING_EMAIL_SINK to a controlled test inbox. The server replaces every outgoing recipient with the sink and blocks sending without a sink. Never configure production email credentials. Local integration tests use mocks or absent SMTP; no actual mail was sent.

POST /api/jobs/run requires Bearer JOB_SECRET of at least 32 characters. Configure only the V3 scheduler origin/token after isolation checks. Do not copy V2 Actions secrets.

The V3 repository scheduler uses GitHub Actions secrets V3_STAGING_APP_URL and V3_STAGING_JOB_SECRET (runtime JOB_SECRET stays unchanged). The workflow checks the repository name. V2 workflow/secrets are not changed. V3 CI uses a disposable MariaDB service and scripts/test-integration.mjs; the hosted CI run is pending publication.
