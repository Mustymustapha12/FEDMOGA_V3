# Database schema

Authoritative source: server/schema.ts. This inventory describes source DDL, not the unseen deployed V2 database. Dates are UTC ISO text timestamps except calendar coverage dates (Lagos-derived YYYY-MM-DD). Monetary *_kobo columns are integer kobo; payments.amount and transfer-request amount are whole naira. Driver BIGINT values can be strings; payment validation compares integer values.

Primary/unique/foreign keys and explicit indexes appear in the SQL below. InnoDB additionally indexes foreign-key columns as required. No versioned migration table exists. ensureDatabase runs CREATE TABLE IF NOT EXISTS and does not ALTER pre-existing tables.

V2 source declares 14 tables. V3 adds registration_transfer_requests and email_attempts, for 16 total. Existing declarations are preserved. No destructive migrations were run.

Relationships: payments → registrations (one per payment); registrations → members (one per linked registration, plus email/mode uniqueness); members → dues_payments/member_sessions/member_tokens/email_jobs; admins → sessions. Manual approvals and checkout links attach to payments. Pending transfer requests optionally attach to their approved payment. Email attempts attach to outbox jobs. audit_logs retains actor/action/target/time without cascading account foreign keys. Soft-deactivating admins preserves their row and every financial relationship.

## settings

```sql
CREATE TABLE IF NOT EXISTS settings (`key` VARCHAR(100) PRIMARY KEY, value LONGTEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| key | VARCHAR(100) PRIMARY KEY |
| value | LONGTEXT NOT NULL |

## admins

```sql
CREATE TABLE IF NOT EXISTS admins (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL, active TINYINT NOT NULL DEFAULT 1, auth_version INT NOT NULL DEFAULT 1, created_at VARCHAR(24) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| email | VARCHAR(255) NOT NULL UNIQUE |
| password_hash | VARCHAR(255) NOT NULL |
| role | VARCHAR(20) NOT NULL |
| active | TINYINT NOT NULL DEFAULT 1 |
| auth_version | INT NOT NULL DEFAULT 1 |
| created_at | VARCHAR(24) NOT NULL |

## sessions

```sql
CREATE TABLE IF NOT EXISTS sessions (token_hash CHAR(64) PRIMARY KEY, admin_id VARCHAR(36) NOT NULL, auth_version INT NOT NULL, expires_at VARCHAR(24) NOT NULL, FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| token_hash | CHAR(64) PRIMARY KEY |
| admin_id | VARCHAR(36) NOT NULL |
| auth_version | INT NOT NULL |
| expires_at | VARCHAR(24) NOT NULL |
| FOREIGN | KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE |

## payments

```sql
CREATE TABLE IF NOT EXISTS payments (id VARCHAR(36) PRIMARY KEY, full_name VARCHAR(160) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(30) NOT NULL, amount BIGINT NOT NULL, status VARCHAR(20) NOT NULL, created_at VARCHAR(24) NOT NULL, completed TINYINT NOT NULL DEFAULT 0, reference VARCHAR(100) NOT NULL UNIQUE, mode VARCHAR(10) NOT NULL, amount_kobo BIGINT NOT NULL, token_hash CHAR(64) UNIQUE, token_cipher TEXT, token_expires_at VARCHAR(24), paid_at VARCHAR(24), email_sent_at VARCHAR(24)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| full_name | VARCHAR(160) NOT NULL |
| email | VARCHAR(255) NOT NULL |
| phone | VARCHAR(30) NOT NULL |
| amount | BIGINT NOT NULL |
| status | VARCHAR(20) NOT NULL |
| created_at | VARCHAR(24) NOT NULL |
| completed | TINYINT NOT NULL DEFAULT 0 |
| reference | VARCHAR(100) NOT NULL UNIQUE |
| mode | VARCHAR(10) NOT NULL |
| amount_kobo | BIGINT NOT NULL |
| token_hash | CHAR(64) UNIQUE |
| token_cipher | TEXT |
| token_expires_at | VARCHAR(24) |
| paid_at | VARCHAR(24) |
| email_sent_at | VARCHAR(24) |

## registration_transfer_requests

```sql
CREATE TABLE IF NOT EXISTS registration_transfer_requests (id VARCHAR(36) PRIMARY KEY, name VARCHAR(160) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(30) NOT NULL, amount BIGINT NOT NULL, paid_date VARCHAR(10) NOT NULL, external_reference VARCHAR(100) NOT NULL UNIQUE, mode VARCHAR(10) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'PENDING', payment_id VARCHAR(36) UNIQUE, created_by VARCHAR(255) NOT NULL, created_at VARCHAR(24) NOT NULL, FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| name | VARCHAR(160) NOT NULL |
| email | VARCHAR(255) NOT NULL |
| phone | VARCHAR(30) NOT NULL |
| amount | BIGINT NOT NULL |
| paid_date | VARCHAR(10) NOT NULL |
| external_reference | VARCHAR(100) NOT NULL UNIQUE |
| mode | VARCHAR(10) NOT NULL |
| status | VARCHAR(20) NOT NULL DEFAULT 'PENDING' |
| payment_id | VARCHAR(36) UNIQUE |
| created_by | VARCHAR(255) NOT NULL |
| created_at | VARCHAR(24) NOT NULL |
| FOREIGN | KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL |

## manual_payments

```sql
CREATE TABLE IF NOT EXISTS manual_payments (payment_id VARCHAR(36) PRIMARY KEY, external_reference VARCHAR(100) NOT NULL UNIQUE, approved_by VARCHAR(255) NOT NULL, approved_at VARCHAR(24) NOT NULL, FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| payment_id | VARCHAR(36) PRIMARY KEY |
| external_reference | VARCHAR(100) NOT NULL UNIQUE |
| approved_by | VARCHAR(255) NOT NULL |
| approved_at | VARCHAR(24) NOT NULL |
| FOREIGN | KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE |

## checkout_links

```sql
CREATE TABLE IF NOT EXISTS checkout_links (payment_id VARCHAR(36) PRIMARY KEY, authorization_url TEXT NOT NULL, FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| payment_id | VARCHAR(36) PRIMARY KEY |
| authorization_url | TEXT NOT NULL |
| FOREIGN | KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE |

## registrations

```sql
CREATE TABLE IF NOT EXISTS registrations (id VARCHAR(36) PRIMARY KEY, payment_id VARCHAR(36) NOT NULL UNIQUE, number VARCHAR(80) NOT NULL UNIQUE, answers LONGTEXT NOT NULL, created_at VARCHAR(24) NOT NULL, FOREIGN KEY (payment_id) REFERENCES payments(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| payment_id | VARCHAR(36) NOT NULL UNIQUE |
| number | VARCHAR(80) NOT NULL UNIQUE |
| answers | LONGTEXT NOT NULL |
| created_at | VARCHAR(24) NOT NULL |
| FOREIGN | KEY (payment_id) REFERENCES payments(id) |

## rate_limits

```sql
CREATE TABLE IF NOT EXISTS rate_limits (id CHAR(64) PRIMARY KEY, attempts INT NOT NULL, expires_at BIGINT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | CHAR(64) PRIMARY KEY |
| attempts | INT NOT NULL |
| expires_at | BIGINT NOT NULL |

## audit_logs

```sql
CREATE TABLE IF NOT EXISTS audit_logs (id VARCHAR(36) PRIMARY KEY, actor VARCHAR(255) NOT NULL, action VARCHAR(100) NOT NULL, target VARCHAR(255), created_at VARCHAR(24) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| actor | VARCHAR(255) NOT NULL |
| action | VARCHAR(100) NOT NULL |
| target | VARCHAR(255) |
| created_at | VARCHAR(24) NOT NULL |

## members

```sql
CREATE TABLE IF NOT EXISTS members (id VARCHAR(36) PRIMARY KEY, registration_id VARCHAR(36) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL, name VARCHAR(160) NOT NULL, phone VARCHAR(30) NOT NULL, mode VARCHAR(10) NOT NULL, password_hash VARCHAR(255), email_verified_at VARCHAR(24), enabled TINYINT NOT NULL DEFAULT 1, auth_version INT NOT NULL DEFAULT 1, preferred_plan VARCHAR(20) NOT NULL DEFAULT 'monthly', paid_until VARCHAR(10), created_at VARCHAR(24) NOT NULL, UNIQUE KEY member_email_mode(email,mode), FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| registration_id | VARCHAR(36) NOT NULL UNIQUE |
| email | VARCHAR(255) NOT NULL |
| name | VARCHAR(160) NOT NULL |
| phone | VARCHAR(30) NOT NULL |
| mode | VARCHAR(10) NOT NULL |
| password_hash | VARCHAR(255) |
| email_verified_at | VARCHAR(24) |
| enabled | TINYINT NOT NULL DEFAULT 1 |
| auth_version | INT NOT NULL DEFAULT 1 |
| preferred_plan | VARCHAR(20) NOT NULL DEFAULT 'monthly' |
| paid_until | VARCHAR(10) |
| created_at | VARCHAR(24) NOT NULL |
| UNIQUE | KEY member_email_mode(email,mode) |
| FOREIGN | KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE |

## member_sessions

```sql
CREATE TABLE IF NOT EXISTS member_sessions (token_hash CHAR(64) PRIMARY KEY, member_id VARCHAR(36) NOT NULL, auth_version INT NOT NULL, expires_at VARCHAR(24) NOT NULL, FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| token_hash | CHAR(64) PRIMARY KEY |
| member_id | VARCHAR(36) NOT NULL |
| auth_version | INT NOT NULL |
| expires_at | VARCHAR(24) NOT NULL |
| FOREIGN | KEY (member_id) REFERENCES members(id) ON DELETE CASCADE |

## member_tokens

```sql
CREATE TABLE IF NOT EXISTS member_tokens (token_hash CHAR(64) PRIMARY KEY, member_id VARCHAR(36) NOT NULL, purpose VARCHAR(20) NOT NULL, expires_at VARCHAR(24) NOT NULL, used_at VARCHAR(24), FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| token_hash | CHAR(64) PRIMARY KEY |
| member_id | VARCHAR(36) NOT NULL |
| purpose | VARCHAR(20) NOT NULL |
| expires_at | VARCHAR(24) NOT NULL |
| used_at | VARCHAR(24) |
| FOREIGN | KEY (member_id) REFERENCES members(id) ON DELETE CASCADE |

## dues_payments

```sql
CREATE TABLE IF NOT EXISTS dues_payments (id VARCHAR(36) PRIMARY KEY, member_id VARCHAR(36) NOT NULL, reference VARCHAR(100) NOT NULL UNIQUE, external_reference VARCHAR(100) UNIQUE, plan VARCHAR(20) NOT NULL, amount_kobo BIGINT NOT NULL, charged_kobo BIGINT, mode VARCHAR(10) NOT NULL, source VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, period_start VARCHAR(10), period_end VARCHAR(10), approved_by VARCHAR(255), created_at VARCHAR(24) NOT NULL, paid_at VARCHAR(24), FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| member_id | VARCHAR(36) NOT NULL |
| reference | VARCHAR(100) NOT NULL UNIQUE |
| external_reference | VARCHAR(100) UNIQUE |
| plan | VARCHAR(20) NOT NULL |
| amount_kobo | BIGINT NOT NULL |
| charged_kobo | BIGINT |
| mode | VARCHAR(10) NOT NULL |
| source | VARCHAR(20) NOT NULL |
| status | VARCHAR(20) NOT NULL |
| period_start | VARCHAR(10) |
| period_end | VARCHAR(10) |
| approved_by | VARCHAR(255) |
| created_at | VARCHAR(24) NOT NULL |
| paid_at | VARCHAR(24) |
| FOREIGN | KEY (member_id) REFERENCES members(id) ON DELETE CASCADE |

## email_jobs

```sql
CREATE TABLE IF NOT EXISTS email_jobs (id VARCHAR(36) PRIMARY KEY, dedupe_key VARCHAR(200) NOT NULL UNIQUE, member_id VARCHAR(36), payment_id VARCHAR(36), payload_cipher LONGTEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'PENDING', attempts INT NOT NULL DEFAULT 0, available_at VARCHAR(24) NOT NULL, locked_until VARCHAR(24), sent_at VARCHAR(24), last_error VARCHAR(255), created_at VARCHAR(24) NOT NULL, FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE, FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| dedupe_key | VARCHAR(200) NOT NULL UNIQUE |
| member_id | VARCHAR(36) |
| payment_id | VARCHAR(36) |
| payload_cipher | LONGTEXT NOT NULL |
| status | VARCHAR(20) NOT NULL DEFAULT 'PENDING' |
| attempts | INT NOT NULL DEFAULT 0 |
| available_at | VARCHAR(24) NOT NULL |
| locked_until | VARCHAR(24) |
| sent_at | VARCHAR(24) |
| last_error | VARCHAR(255) |
| created_at | VARCHAR(24) NOT NULL |
| FOREIGN | KEY (member_id) REFERENCES members(id) ON DELETE CASCADE |
| FOREIGN | KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE |

## email_attempts

```sql
CREATE TABLE IF NOT EXISTS email_attempts (id VARCHAR(36) PRIMARY KEY, job_id VARCHAR(36) NOT NULL, recipient VARCHAR(255), attempted_at VARCHAR(24) NOT NULL, completed_at VARCHAR(24), status VARCHAR(20) NOT NULL, error VARCHAR(255), KEY email_attempt_job(job_id,attempted_at), FOREIGN KEY (job_id) REFERENCES email_jobs(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column or constraint | Definition |
|---|---|
| id | VARCHAR(36) PRIMARY KEY |
| job_id | VARCHAR(36) NOT NULL |
| recipient | VARCHAR(255) |
| attempted_at | VARCHAR(24) NOT NULL |
| completed_at | VARCHAR(24) |
| status | VARCHAR(20) NOT NULL |
| error | VARCHAR(255) |
| KEY | email_attempt_job(job_id,attempted_at) |
| FOREIGN | KEY (job_id) REFERENCES email_jobs(id) ON DELETE CASCADE |

## Operational rules and migration history
The source commits introduced member tables in 022b25a and later reporting/UI changes; V3 adds pending-transfer claims and email attempts. No existing table is renamed, dropped or altered. Fresh staging executes all DDL in dependency order. Before any future production migration, compare SHOW CREATE TABLE with this source and obtain approval; source-only CREATE IF NOT EXISTS cannot prove schema compatibility.

Unique payment references and one registration per payment prevent ordinary duplicate counting. Member paid_until is a coverage summary maintained transactionally, not an inferred sum of attempts. Manual bank references are checked against known financial records; there is no cross-table global unique reference ledger. Concurrent cross-workflow reference collisions deserve additional workload tests before high-volume use.
