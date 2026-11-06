# Deployment guide
## Local development
Use Node >=22.13. Run npm ci, configure a private environment and separate MySQL/MariaDB database, then npm run dev. npm run typecheck, npm test and npm run build are available. No lint script is configured; Prettier provides formatting verification.

## Separate hosted staging
1. Obtain V3 GitHub and Hostinger authorization. Recheck V3 branches/history before pushing. Use development/v3 and never force-push.
2. Create a separate Node.js hosting application and separate database/user. Verify V2 domain, credentials, tables, keys and scheduler remain untouched.
3. Configure every environment requirement from ENVIRONMENT_CONFIGURATION.md. Use synthetic data only; do not clone production records/outbox/secrets into staging.
4. Set FEDMOGA_ENV=staging, DB_NAME ending _staging, ALLOW_LIVE_PAYMENTS=false and controlled SMTP sink.
5. Build npm ci then npm run build; start npm start. Next.js output is .next; static logo must be included. Verify /api/health.
6. Bootstrap a staging Super Admin, save Paystack test keys only, publish form and configure test dues prices. Do not enable live mode.
7. Configure a separate Paystack test webhook URL /api/paystack/webhook. Automatic callback paths are /api/paystack/callback and /api/dues/callback. Do not replace a production webhook with staging.
8. Configure V3-specific scheduler secrets/origin only after email isolation is verified. The existing workflow runs every ten minutes; calls may be delayed.
9. Execute all tests and manual role, mobile/desktop, payment, mail and financial acceptance checks on staging.

Hosted staging is not deployed until access/domain/services are provided. Local isolated test execution is not a public staging deployment.

## Production procedure (not authorized)
Any eventual production cutover needs explicit approval, an independently tested backup/restore, schema compatibility review, reconciliation of registration/payment/member counts, retention of existing encrypted-key compatibility, maintenance/cutover planning and rollback rehearsal. Do not repoint V3 to the live V2 database, reuse its writable connection or switch the public domain during this project. Preserve all V2 data and settings.

## Troubleshooting
503 database errors: check host/port/user/name/TLS/socket without printing values. Staging suffix errors: correct the separate DB name. Missing-column errors: compare actual schema to server/schema.ts; CREATE IF NOT EXISTS does not migrate columns. SMTP failures: verify isolated configuration and sink; inspect sanitized attempts. Invalid payment mode: use test keys. Jobs 401: verify separate bearer secret. See BACKUP_AND_RECOVERY.md before any schema intervention.

The V3 repository scheduler uses GitHub Actions secrets V3_STAGING_APP_URL and V3_STAGING_JOB_SECRET (runtime JOB_SECRET stays unchanged). The workflow checks the repository name. V2 workflow/secrets are not changed. V3 CI uses a disposable MariaDB service and scripts/test-integration.mjs; the hosted CI run is pending publication.
