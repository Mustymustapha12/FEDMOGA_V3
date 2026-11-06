# Backup and recovery
No V2 database was accessed, exported, migrated or changed during V3 development. V2 connections, API keys and data must remain intact.

Before any authorized database maintenance, obtain an encrypted backup through the hosting/database operator (e.g. mysqldump with --single-transaction --routines --triggers against the explicitly selected database). Keep credentials in a protected option file and store dumps outside the repo/public web root. Record snapshot time, server version, schema, row counts and checksum. Back up the encryption key separately in a secret store.

Test restoration into a separate isolated database. Verify constraints, admin access, registration numbers, payment references/status/mode/amounts, member paid-through dates, dues periods and settings. Disable delivery/scheduler and all live Paystack use during recovery. Never restore an old dump over active payments without reconciliation and explicit approval.

V3 schema additions are registration_transfer_requests and email_attempts only; no existing columns/tables/records are dropped or altered. ensureDatabase creates absent tables; there is no versioned ALTER migration runner. Existing schema drift must be reviewed separately. Indexes/constraints are listed in DATABASE_SCHEMA.md.

Rollback the V3 application by redeploying its previous verified commit with the same isolated V3 configuration. Leave additive tables in place to retain history. Disable the V3 scheduler if needed. V2 requires no rollback because it is untouched. Never point an old app at an incompatible schema or delete V3 financial records to make rollback appear successful.

Admin account deletion is soft deactivation: Super Admin may reactivate the retained row through existing user management. Existing test-data cleanup is intentionally destructive and restricted to test mode plus explicit confirmation; it must never be used as a live-member deletion mechanism.
