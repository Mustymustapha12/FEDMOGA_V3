# Testing guide
Baseline V2 at 2b3ca6d: the executed default command discovered 21 tests, 16 passed and five skipped without integration configuration. Earlier static counts were not runtime counts.

Use a disposable MySQL/MariaDB database ending _test and a running production build configured for that database. Set FEDMOGA_APP_TEST_URL and FEDMOGA_RUN_DB_TESTS=true in the test process, plus canonical APP_URL, DB credentials, bootstrap test credentials and encryption key. HTTP tests set cookies explicitly and expect production Secure cookies; APP_URL is the Origin header even when HTTP transport is local.

Commands:
```sh
npm ci
npm run typecheck
npm run build
npm test
npx prettier --check app server tests next.config.ts
```
The final command is formatting verification, not a configured lint tool. A normal npm test without test environment skips database/HTTP tests; inspect skipped counts.

Integration tests write/clean synthetic rows, change test settings and use mocked Paystack/SMTP. Never target a shared or production database. V3 integration adds correct-ID details, missing/mismatched IDs, Admin/Super Admin authorization, Member denial, pending/confirmed/manual states, full filtered exports, bank-claim approval/idempotency, signed reminder confirmation, duplicate prevention, stale/paid-member rejection, cancellation at dispatch, failed-mail retry and account-deactivation protection/session revocation/history retention. Unit tests cover final-active/self protections, membership calendar summaries, filter pagination and selection validation.

Local validation results are recorded in VALIDATION.md; do not treat mocked verification as a real Paystack integration acceptance transaction.

Manual hosted staging acceptance:
- Desktop and mobile: public header/login, role navigation, sidebar expansion, all filters, page-size changes, CSV counts/order, no body overflow.
- View: at least two different registrations/members; verify IDs, all saved answers, bank/Paystack refs, approved-by/date, dues/expiry/history; invalid IDs must not show another person.
- Accounts: Admin cannot DELETE via HTTP, self/last-active protected, other account deactivated, sessions invalidated, related record counts unchanged and audit written.
- Payments: complete one test checkout and repeated verification, signed webhook and invalid signature, incomplete recovery, pending bank claim contributes zero, repeated approval rejected.
- Reminders: one and multiple owing recipients, confirmation, changed payment between preview/send, duplicate attempts, failure/retry, controlled sink only.

Visual browser checks are pending if no browser executable is available. Hosted Paystack test callbacks, actual isolated SMTP and Hostinger scheduler must be verified after deployment access is available.

## Reproducible integration runner
With a fresh disposable local _test database and a private test environment already loaded, run npm run build then npm run test:integration. The runner starts the test app, strips inherited SMTP credentials, enables both integration switches, executes all tests sequentially and stops the app. It rejects nonlocal DB hosts and database sockets. The supplied CI workflow provisions its own temporary MariaDB service. Reusing a dirty test database can fail unique synthetic email/reference assertions; create a new disposable database rather than deleting shared data.
