# System architecture
Next.js 16.3.8 App Router serves React 19.2.6 pages and route handlers. TypeScript 5.9 checks frontend/backend code. Node >=22.13 is required. mysql2/promise provides pooled parameterized queries; Nodemailer provides SMTP. See package-lock.json for exact dependency resolution.

Entry points: app/page.tsx → Portal, app/admin/page.tsx → Portal adminPage, app/login/page.tsx, app/member/page.tsx → MemberPortal. Admin subsections are tab state in app/portal.tsx; they are not separate standalone routes.

Layers:
- UI: portal.tsx, admin-navigation.tsx, registration-report.tsx, member-report.tsx, record-details.tsx, membership-admin.tsx, dues-reminders.tsx, email-delivery.tsx.
- APIs: app/api/**/route.ts; server authentication is mandatory for admin/member operations.
- Services: server/auth.ts, member-auth.ts, manual-payments.ts, dues.ts, calendar.ts, record-details.ts, admin-reminders.ts, mail-jobs.ts.
- Storage: server/database.ts Statement wrapper and transaction helper; server/schema.ts authoritative fresh-database DDL.
- Shared reporting: app/report-data.ts filtering/export formatting; server/report-query.ts registration pagination/aggregates.

Database access calls ensureDatabase(), which executes CREATE TABLE IF NOT EXISTS in declaration order. It does not ALTER old tables. A fresh staging database avoids schema drift. Do not point V3 at production to inspect it.

Payments are verified through Paystack's server API; callbacks/webhooks call shared verification logic. Registration creation, membership account creation and activation-outbox enqueue share one transaction. Dues renewal locks the member and payment to prevent duplicate extension. Manual transfer approval reuses the existing service within a caller-owned transaction.

Registration reporting pages the API response after server filtering. The service currently loads the joined dataset in memory; membership pagination filters and pages the loaded dataset in the browser. Complete exports intentionally contain all matching records. Large-dataset SQL pagination/streaming is a future scalability improvement.

## API inventory

| Route | Methods | Source |
|---|---|---|
| /api/admin/dues/manual | POST | app/api/admin/dues/manual/route.ts |
| /api/admin/email/history | GET, POST | app/api/admin/email/history/route.ts |
| /api/admin/email/process | POST | app/api/admin/email/process/route.ts |
| /api/admin/email/test | POST | app/api/admin/email/test/route.ts |
| /api/admin/members/action | POST | app/api/admin/members/action/route.ts |
| /api/admin/members/migrate | POST | app/api/admin/members/migrate/route.ts |
| /api/admin/members/reminders | POST | app/api/admin/members/reminders/route.ts |
| /api/admin/members/settings | POST | app/api/admin/members/settings/route.ts |
| /api/admin/members/state | GET | app/api/admin/members/state/route.ts |
| /api/admin/payments/delete-manual-test | POST | app/api/admin/payments/delete-manual-test/route.ts |
| /api/admin/payments/link | POST | app/api/admin/payments/link/route.ts |
| /api/admin/payments/manual | POST | app/api/admin/payments/manual/route.ts |
| /api/admin/payments/remind | POST | app/api/admin/payments/remind/route.ts |
| /api/admin/payments/resend | POST | app/api/admin/payments/resend/route.ts |
| /api/admin/payments/transfers | GET, POST | app/api/admin/payments/transfers/route.ts |
| /api/admin/records | GET | app/api/admin/records/route.ts |
| /api/admin/registrations | GET | app/api/admin/registrations/route.ts |
| /api/admin/settings | POST | app/api/admin/settings/route.ts |
| /api/admin/state | GET | app/api/admin/state/route.ts |
| /api/admin/test-data/clear | POST | app/api/admin/test-data/clear/route.ts |
| /api/admin/users | POST, PATCH, DELETE | app/api/admin/users/route.ts |
| /api/auth/login | POST | app/api/auth/login/route.ts |
| /api/auth/logout | POST | app/api/auth/logout/route.ts |
| /api/auth/password | POST | app/api/auth/password/route.ts |
| /api/auth/session | GET | app/api/auth/session/route.ts |
| /api/config | GET | app/api/config/route.ts |
| /api/dues/callback | GET | app/api/dues/callback/route.ts |
| /api/dues/initialize | POST | app/api/dues/initialize/route.ts |
| /api/dues/verify | POST | app/api/dues/verify/route.ts |
| /api/health | GET | app/api/health/route.ts |
| /api/jobs/run | POST | app/api/jobs/run/route.ts |
| /api/member/account/complete | POST | app/api/member/account/complete/route.ts |
| /api/member/account/request | POST | app/api/member/account/request/route.ts |
| /api/member/login | POST | app/api/member/login/route.ts |
| /api/member/logout | POST | app/api/member/logout/route.ts |
| /api/member/state | GET | app/api/member/state/route.ts |
| /api/paystack/callback | GET | app/api/paystack/callback/route.ts |
| /api/paystack/continue | POST | app/api/paystack/continue/route.ts |
| /api/paystack/initialize | POST | app/api/paystack/initialize/route.ts |
| /api/paystack/recover | POST | app/api/paystack/recover/route.ts |
| /api/paystack/resume | GET | app/api/paystack/resume/route.ts |
| /api/paystack/webhook | POST | app/api/paystack/webhook/route.ts |
| /api/register | POST | app/api/register/route.ts |
| /api/test-payment | POST | app/api/test-payment/route.ts |
