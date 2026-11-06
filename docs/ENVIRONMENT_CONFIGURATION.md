# Environment configuration
Never commit real values. .env.example contains placeholders. Copy locally to a private .env.local for development or configure the hosting environment. Environment variables are server-only unless explicitly returned as safe configuration.

| Variable | Purpose / behavior |
|---|---|
| APP_URL | Canonical origin; HTTPS required under production Node mode; used for CSRF and links |
| DB_HOST | MySQL host, default 127.0.0.1; localhost normalized to TCP |
| DB_PORT | MySQL port, default 3306 |
| DB_SOCKET | Optional Unix socket; replaces host TCP routing |
| DB_NAME | Database name; staging requires suffix _staging or _test |
| DB_USER, DB_PASSWORD | Required database credentials, private |
| DB_SSL | true enables verified TLS; false for supported local deployments |
| SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD | Bootstrap only when no admins exist; password 12–128 characters |
| FEDMOGA_ENCRYPTION_KEY | 32-byte hex key used for AES-GCM secrets/outbox and signed reminder previews |
| ALLOW_LIVE_PAYMENTS | Default off; must remain false in staging |
| SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM | SMTP service and private sender credentials |
| SMTP_PORT | Default 465 (implicit TLS); other ports require TLS |
| JOB_SECRET | Separate random scheduler bearer secret, at least 32 characters |
| FEDMOGA_ENV | Set exactly staging for database-name, live-key and email-sink safeguards |
| STAGING_EMAIL_SINK | Required controlled recipient for any staging email sending |
| NODE_ENV | Next.js controls development/production behavior and secure cookies |
| FEDMOGA_APP_TEST_URL | Test-only HTTP base URL, enables HTTP/database integration tests |
| FEDMOGA_RUN_DB_TESTS | Test-only true enables direct database payment integration test |

Paystack public/secret keys, checkout mode, registration fee, published form, dues prices and grace days are in settings, not new key environment variables. Secret key values are encrypted with FEDMOGA_ENCRYPTION_KEY. Preserve the original encryption key for any authorized future restore of encrypted records. Do not change V2's key or settings.

Fresh staging: separate DB credentials, DB_NAME=fedmoga_v3_staging, APP_URL=https://your-v3-staging-host.example, FEDMOGA_ENV=staging, ALLOW_LIVE_PAYMENTS=false, a fresh random encryption key/JOB_SECRET, isolated SMTP and a controlled sink. Suffix validation is an extra check, not proof of isolation: the operator must verify the connection is not V2 production.
