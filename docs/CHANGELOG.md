# Changelog
## 3.0.0 — 2026-11-06
Based on V2 commit 2b3ca6ddbabbb8b6fd4438596fa0dd8a38f7f4b5; development branch development/v3.

- Consolidated navigation and registration reporting; added payment-method/status/completion filters, pagination (default 25), complete filtered exports and accurate confirmed totals; removed legacy 500-payment truncation.
- Restored View using explicit record kind/UUID and authoritative registration/payment/member joins, all saved answers, approval/audit details and dues history. Missing View handlers and payment-ID/reference confusion were found in V2 source; hosted regression reproduction remains unavailable.
- Added protected Super Admin account deactivation/session revocation and transactional success/failure audit; retained all business records. No hard delete of user accounts.
- Preserved calendar dues/renewal calculations; added paid/owing, next-renewal balances and expiry filters.
- Added signed reminder previews, individual/bulk confirmation, daily deduplication, current-data revalidation and dispatch cancellation for members who paid.
- Added email attempt history and individual failed-job retry.
- Added registration_transfer_requests and email_attempts tables only. No existing table alterations or production migrations.
- Added staging database-name validation, live-key blocking and sink-only email delivery.
- Added technical documentation and regression tests. V2 production, data, credentials, APIs and hosting unchanged.

## 2.0.0 source history
2b3ca6d unified sign-in, grouped menus and numbered member exports. e211d81 branded emails, bound payment identity and added sidebar/reporting. 022b25a added membership accounts/calendar dues. 6dade67 initialized V2. No claims are made about the remote production working tree or deployed database schema.

Validation: 32/32 tests passed with zero skips on an isolated local database, plus typecheck, Prettier check and production build. Remote publication, hosted staging and browser acceptance remain pending for the reasons in VALIDATION.md.

GitHub connection follow-up: repository reading verified, but branch creation was rejected with HTTP 403 (Resource not accessible by integration). No remote repository changes were made. Publication awaits repository contents write authorization for the connected integration.

GitHub authorization resolved. The empty V3 repository was initialized and development/v3 created. API publication preserves exact prepublication V2/V3 history in docs/history/FEDMOGA_V3_PREPUBLICATION.bundle because source commit objects could not be attached directly across repository object stores. No force-push or remote history replacement.
