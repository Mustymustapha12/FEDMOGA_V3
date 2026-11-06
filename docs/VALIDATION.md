# Validation and delivery status

Date: 2026-11-06 (Africa/Lagos). Source V2 main: 2b3ca6ddbabbb8b6fd4438596fa0dd8a38f7f4b5. V3 development branch: development/v3. The archived local implementation and documentation commits descend from the full four-commit V2 history. Remote API publication uses a separate V3 initialization ancestry. Implementation commit: b43b9f0157f4a76c530b8d0005abda8e64e7ab0a. Use git log to retrieve the documentation/delivery commit.

## Executed checks
| Check | Result |
|---|---|
| npm ci --ignore-scripts | Completed; dependencies installed locally |
| npm run check:format | Passed: all matched app/server/test/config files |
| npm run typecheck | Passed |
| npm run build | Passed; production Next.js build |
| npm run test:integration | 32 tests passed, zero failed, zero skipped |
| git diff --check | Passed |
| Documentation relative links | Verified |
| Original dues/calendar/Paystack verification source | Unchanged from source commit |

Test environment: Node 24.22.1, Next.js 16.3.8, disposable local MariaDB 10.11.14 database fedmoga_v3_test. A fresh private database instance was created for the final integration run, the production app ran on local transport with staging guards, and the app/database processes were stopped by the runner. Test records were synthetic. Paystack HTTP and SMTP were mocked in tests; the test app inherited no SMTP credentials. No production credentials, database connections or actual mail/payment operations were used.

The reusable scripts/test-integration.mjs was executed successfully. V3's CI workflow is prepared but has not been executed on GitHub. Initial baseline execution discovered 21 tests: 16 passed and five skipped without integration switches; final execution includes all baseline tests and new V3 coverage.

## Verified functionality
- Correct registration/member/payment identity joins; Admin and Super Admin access; Member/anonymous denial; missing/mismatched IDs and pending/manual/online payment states.
- Full matching registration exports beyond the 25-row page; payment/completion filters and confirmed totals.
- Pending transfer claims grant no access; admin-confirmed approval creates the successful manual payment once; repeat approval rejected.
- Calendar calculations and one-next-renewal balance semantics preserved.
- Individual/bulk reminder previews, confirmation, stale/paid-member rejection, duplicate prevention and cancellation before dispatch.
- Failed mail attempt logging, Super Admin retry and Admin denial.
- Account deactivation protects self/last-active policy, denies other roles, revokes sessions, retains user/member/payment records and writes audit outcomes.
- Staging database-name/live-key/sink guards; SMTP recipient rewriting to the controlled sink.
- Malformed legacy answer JSON does not crash shared reporting.

## Pending or blocked
- GitHub publication: write access is now authorized. The initially empty V3 repository was initialized at 2718c009c45678bc4a0f38fb3be0e4072624ea4e, and development/v3 was created from it. Publication uses GitHub Git Data APIs because CLI authentication is unavailable. V2 source commit objects are not in V3; direct ancestry import was rejected with Object does not exist. Exact original V2 and local V3 history through 46c5e4f is preserved in docs/history/FEDMOGA_V3_PREPUBLICATION.bundle. Consult the remote development/v3 head for the verified publication commit.
- Hosted staging: no hosting authorization, domain or isolated service configuration supplied; no hosted staging URL exists.
- Browser/mobile visual acceptance: Playwright is available, but no browser executable was installed. Chromium download attempts returned invalid/truncated archives. No visual pass is claimed.
- Actual Paystack test callbacks/webhooks and actual isolated SMTP/Hostinger scheduler acceptance await hosted staging.
- No production schema, deployed working tree, balances or data were inspected; repository review is not production verification.

## Known limitations
Registration/member datasets are filtered in memory; no database-side streaming/pagination or load-test claim. Email dashboard shows the latest 200 jobs; delivery-provider bounce/inbox events are unavailable. SMTP is at-least-once across crashes. Historical manual payments may not distinguish bank transfers from previously verified external Paystack entries. The existing legacy manual-practice deletion endpoint accepts an explicit practice-data confirmation even for a manual record marked live; it was preserved, not executed, and must not be used for account deletion or real financial records. Source DDL uses CREATE IF NOT EXISTS rather than versioned ALTER migrations. No global cross-table unique bank-reference ledger exists.

## Retention and rollback
V2 production, database/data, API keys, SMTP/Paystack settings and connections remain untouched. V3 introduces only registration_transfer_requests and email_attempts; existing table definitions, calendar rules and dues renewal service remain unchanged. Account deletion is reversible admin login deactivation, not physical user/financial deletion.

For V3 rollback, deploy a prior verified V3 commit with its isolated configuration and retain additive tables/history. No V2 rollback is needed. See BACKUP_AND_RECOVERY.md before any database operations and DEPLOYMENT_GUIDE.md before publication.
