# FEDMOGA V3
Controlled upgrade of the FGGC Minjibir Old Girls Association portal. V3 preserves V2's Git history, branding, workflows and calendar dues rules, while adding consolidated registration reporting, reliable View details, owing-member reminder campaigns and audited account deactivation.

V2 production, its database/data, API keys and connections must remain unchanged. V3 staging uses a separate writable database, synthetic records, test Paystack and isolated email.

## Stack and requirements
Node >=22.13; Next.js 16.3.8; React 19.2.6; TypeScript; MySQL/MariaDB via mysql2; Nodemailer. Exact versions: package-lock.json.

## Setup and development
```sh
npm ci
cp .env.example .env.local
# Configure a separate database and private staging/test credentials.
npm run dev
```
Never commit .env.local or real secrets. Use FEDMOGA_ENV=staging with DB_NAME ending _staging/_test, ALLOW_LIVE_PAYMENTS=false and STAGING_EMAIL_SINK. Save only test Paystack keys through staging Super Admin settings. The database schema initializes automatically; no production connection is needed.

## Checks
```sh
npm run typecheck
npm test
npm run build
npx prettier --check app server tests next.config.ts
```
Default tests skip database/HTTP integration unless explicitly configured; see testing guide. No lint script is configured. Run npm start for the production build. Hosted staging is a separate operator deployment; none is claimed by local build success.

## Development handover
Read [AGENTS.md](AGENTS.md) and [AI development context](docs/AI_DEVELOPMENT_CONTEXT.md) first. Source: V2 2b3ca6ddbabbb8b6fd4438596fa0dd8a38f7f4b5; target: https://github.com/Mustymustapha12/FEDMOGA_V3, branch development/v3. See validation for publication/deployment state and limitations.

## Documentation
- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [User Roles And Permissions](docs/USER_ROLES_AND_PERMISSIONS.md)
- [Navigation Guide](docs/NAVIGATION_GUIDE.md)
- [Registration Workflow](docs/REGISTRATION_WORKFLOW.md)
- [Payment Workflow](docs/PAYMENT_WORKFLOW.md)
- [Membership Workflow](docs/MEMBERSHIP_WORKFLOW.md)
- [Email And Notifications](docs/EMAIL_AND_NOTIFICATIONS.md)
- [Reports And Exports](docs/REPORTS_AND_EXPORTS.md)
- [Environment Configuration](docs/ENVIRONMENT_CONFIGURATION.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Backup And Recovery](docs/BACKUP_AND_RECOVERY.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Changelog](docs/CHANGELOG.md)
- [Ai Development Context](docs/AI_DEVELOPMENT_CONTEXT.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Approved Requirements](docs/APPROVED_REQUIREMENTS.md)
- [Validation](docs/VALIDATION.md)
