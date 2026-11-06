> Approved master scope retained for handover. The initial read-only audit was presented and implementation was authorized in this session. See VALIDATION.md for implemented behavior, executed checks and remaining deployment prerequisites.

# FEDMOGA V3 — COMPLETE MASTER DEVELOPMENT INSTRUCTION

I am continuing development of FEDMOGA, an existing production application for the Federal Government Girls College Minjibir Old Girls Association.

I want you to take responsibility for auditing the existing application, creating an improved V3 codebase, implementing the approved changes, writing comprehensive technical documentation, and preparing a separate staging deployment.

This is a controlled upgrade of an existing application, NOT a complete rebuild.

## 1. REPOSITORIES AND PROJECT STATUS

SOURCE REPOSITORY (existing V2):
https://github.com/Mustymustapha12/FEDMOGA_V2

TARGET REPOSITORY (new V3):
https://github.com/Mustymustapha12/FEDMOGA_V3

The last reported source status was:
- Branch: main
- Commit: 2b3ca6d
- Reported tests passing: 21

IMPORTANT: These details have not yet been independently verified. Inspect the actual repository and verify the commit, branch, working tree and test results.

FEDMOGA V2 is currently in production and actively used. It must remain completely operational and untouched throughout this project.

FEDMOGA V3 must be developed and deployed separately. Do not overwrite V2, modify its live database, change its hosting configuration or deploy V3 to its production environment.

## 2. CORE OBJECTIVES

Deliver the following:

1. A properly documented FEDMOGA V3 application.
2. Simplified and meaningful navigation.
3. Improved registration management with payment-status and payment-method filters.
4. Search, pagination and reporting for registrations.
5. Improved membership management with paid and owing classifications.
6. Individual and bulk email reminders for outstanding membership dues.
7. Improved reports and exports.
8. A separate staging deployment.
9. Complete technical documentation that enables future developers and AI platforms to understand and maintain the application without requiring the original development conversation.

Preserve existing functionality, data structures where practical, business rules, branding, layout, colors, typography, Paystack integration, membership calculations and user experience.

## 3. PHASE ONE — COMPLETE TECHNICAL AUDIT

Start with a READ-ONLY audit.

Inspect:
- Repository branches, commits and working tree.
- Framework and application architecture.
- Frontend and backend structure.
- Database schema, tables and relationships.
- Database migrations.
- Authentication and user roles.
- Admin and Super Admin permissions.
- Member accounts and member dashboard.
- Existing navigation and routes.
- Registration workflows.
- Paystack integration and server-side payment verification.
- Bank-transfer payments and approvals.
- Membership dues and renewal calculations.
- Email infrastructure and templates.
- Reports, exports, search and pagination.
- Existing automated tests.
- Deployment configuration and environment variables.
- Existing visual design and branding.

Specifically verify the reported commit 2b3ca6d and the reported 21 passing tests.

Produce a detailed audit identifying:
- What is implemented.
- What is incomplete.
- What is broken.
- What can be reused.
- What needs modification.
- Any security or data-integrity risks.
- Existing features that must not be disturbed.

Cite relevant file paths and code references.

Do not edit, install, migrate, seed, push or deploy anything during this phase.

Present the audit and proposed implementation plan for approval.

## 4. PHASE TWO — CREATE FEDMOGA V3

Target:
https://github.com/Mustymustapha12/FEDMOGA_V3

1. Check whether the repository exists and inspect its contents.
2. Preserve any existing repository content and history.
3. Use V2 as the foundation for V3.
4. Preserve Git history where practical.
5. Create a dedicated development branch.
6. Implement changes on V3 only.
7. Push approved changes to the V3 repository.
8. Never force-push or overwrite existing repository history without explicit approval.
9. If repository access requires authentication, request the necessary authorization.

Do not modify V2 production.

## 5. PHASE THREE — SIMPLIFIED NAVIGATION

The current navigation contains too many separate and repetitive menus.

Implement this simplified structure after auditing the existing routes and workflows.

DASHBOARD

REGISTRATIONS
- All Registrations
- Pending & Incomplete
- Previous Payments to Approve
- Reports & Export
- Registration Form

MEMBERS
- All Members
- Dues & Renewals
- Reports & Export

ADMINISTRATION
- Registration & Payment Settings
- Membership Settings
- Admin Users
- My Account

SIGN OUT

Navigation requirements:

- Use simple, understandable labels.
- Reduce unnecessary menus and submenus.
- Do not remove existing functionality.
- Consolidate overlapping registration lists using filters where appropriate.
- Preserve payment history and make it accessible from relevant registration and payment records.
- Preserve all necessary bank-transfer approval workflows.
- Keep user-role permissions.
- Preserve existing URLs where practical.
- Maintain the current dashboard layout, sidebar, header, branding, colors, typography, styling and responsive behavior.
- Do not redesign the entire application.
- Do not introduce unnecessary new pages.

Only remove duplicate navigation links after verifying that they genuinely lead to the same functionality.

## 6. PHASE FOUR — REGISTRATION MANAGEMENT

Consolidate registration management into an improved All Registrations page.

Provide payment-status filters:
- All
- Paid
- Pending Payment
- Awaiting Bank Transfer Approval

Provide payment-method filters:
- All Methods
- Online / Paystack
- Bank Transfer

Provide registration-completion filters:
- All Registrations
- Completed
- Paid — Finish Registration

Provide:
- Search by full name.
- Search by email.
- Search by phone number.
- Date-range filtering.
- Pagination.
- Default page size of 25.
- Configurable page sizes.
- Payment method.
- Payment status.
- Amount paid.
- Payment date.
- Registration completion status.
- Appropriate record actions.

Payment rules:

- Online payments must be verified server-side.
- Never trust browser redirects alone.
- Bank transfers must pass through the existing approval process.
- Unapproved transfers must not be treated as successful payments.
- Distinguish payment attempts from confirmed successful transactions.
- Avoid duplicate payment counting.
- Preserve paid-but-incomplete registration records.
- Preserve existing registration and payment records.

REPORTS AND EXPORTS:

Provide registration reports with:
- Payment status.
- Payment method.
- Registration completion.
- Date range.
- Search and filter options.

Exports must include ALL matching records across every page, not just the currently displayed page.

## 7. PHASE FIVE — MEMBERSHIP MANAGEMENT

Create an easy-to-use All Members page.

Provide filters:
- All Members.
- Paid / Up to Date.
- Owing.
- Overdue.
- Membership Status.
- Dues Period.
- Expiry Date.

Provide search by:
- Name.
- Email.
- Phone Number.

Display:
- Member information.
- Membership status.
- Payment status.
- Amount paid.
- Outstanding balance.
- Applicable dues period.
- Membership expiry date.
- Relevant actions.

Membership calculations must follow the existing business rules.

Preserve:
- Monthly dues.
- Quarterly dues.
- Annual dues.
- Existing renewal dates.
- Early renewal logic.
- Expiry calculations.
- Registration fees being separate from membership dues.
- Member-initiated payments.
- No automatic recurring deductions.
- Existing payment history.

Do not invent new membership rules or change existing calculations without my approval.

## 8. PHASE SIX — EMAIL REMINDERS

Implement individual and bulk email reminders for members with outstanding membership dues.

Individual reminders:
- Allow administrators to send a reminder to one owing member.

Bulk reminders:
- Allow administrators to select multiple owing members.
- Display the selected recipients.
- Show the total number of recipients.
- Show relevant outstanding balances.
- Require confirmation before sending.

Email content should include:
- Member's name.
- Outstanding amount.
- Applicable dues period.
- Due date.
- Membership information.
- Payment instructions.
- Appropriate FEDMOGA branding.

Additional requirements:
- Reuse the existing email infrastructure.
- Record email attempts.
- Record recipients and timestamps.
- Record delivery outcomes where available.
- Prevent accidental duplicate sending.
- Provide failed-email reporting and retry functionality.
- Do not send reminders to members who have no outstanding dues.
- Ensure reminders use accurate membership and payment data.

Do not send actual emails during development or testing.

Use a staging email service or controlled test inbox.

## 9. PHASE SEVEN — REPORTS AND EXPORTS

Provide meaningful registration and membership reports.

REGISTRATION REPORTS:
- Total registrations.
- Paid registrations.
- Pending payments.
- Online payments.
- Bank transfers.
- Incomplete registrations.
- Date-range reports.

MEMBERSHIP REPORTS:
- Total members.
- Paid/up-to-date members.
- Owing members.
- Overdue members.
- Outstanding dues.
- Membership status.
- Expiry information.
- Dues period.

PAYMENT HISTORY:
- Payment reference.
- Payment method.
- Transaction status.
- Amount.
- Payment date.
- Relevant registration or member.

Ensure report totals are calculated from authoritative records without duplicate transactions.

Export all matching filtered results.

Preserve existing report functionality.

## 10. PHASE EIGHT — COMPREHENSIVE PROJECT DOCUMENTATION

This is a major deliverable.

Create a documentation folder in the V3 repository.

Required files:

README.md
AGENTS.md

docs/PROJECT_OVERVIEW.md
docs/SYSTEM_ARCHITECTURE.md
docs/DATABASE_SCHEMA.md
docs/USER_ROLES_AND_PERMISSIONS.md
docs/NAVIGATION_GUIDE.md
docs/REGISTRATION_WORKFLOW.md
docs/PAYMENT_WORKFLOW.md
docs/MEMBERSHIP_WORKFLOW.md
docs/EMAIL_AND_NOTIFICATIONS.md
docs/REPORTS_AND_EXPORTS.md
docs/ENVIRONMENT_CONFIGURATION.md
docs/DEPLOYMENT_GUIDE.md
docs/BACKUP_AND_RECOVERY.md
docs/TESTING_GUIDE.md
docs/CHANGELOG.md
docs/AI_DEVELOPMENT_CONTEXT.md

DOCUMENTATION CONTENT:

README.md:
- Project overview.
- Technologies.
- Requirements.
- Installation.
- Local development.
- Testing.
- Deployment.
- Links to all important documentation.

AGENTS.md:
Permanent instructions for future AI coding agents.

It must instruct future agents to:
- Read project documentation before making changes.
- Inspect existing functionality before modifying it.
- Preserve existing data and business rules.
- Never expose credentials.
- Never make unapproved production changes.
- Never perform destructive migrations without approval.
- Run relevant tests.
- Update documentation after changes.
- Report modified files and test results.

PROJECT_OVERVIEW.md:
- Association background.
- Project objectives.
- Application purpose.
- User types.
- Main functionality.

SYSTEM_ARCHITECTURE.md:
- Frontend architecture.
- Backend architecture.
- API endpoints.
- Database interactions.
- Integrations.
- Application workflows.

DATABASE_SCHEMA.md:
- All actual tables.
- Fields and data types.
- Primary and foreign keys.
- Relationships.
- Constraints.
- Indexes.
- Migration history.
- Important business rules.

USER_ROLES_AND_PERMISSIONS.md:
- Super Admin.
- Admin.
- Member.
- Role permissions.
- Protected pages.
- Protected API endpoints.

NAVIGATION_GUIDE.md:
- All menus and submenus.
- Page descriptions.
- Routes.
- Role visibility.
- Navigation behavior.

REGISTRATION_WORKFLOW.md:
- Registration steps.
- Registration fees.
- Form fields.
- Payment requirements.
- Registration completion.
- Administrative actions.

PAYMENT_WORKFLOW.md:
- Paystack integration.
- Transaction initialization.
- Payment verification.
- Callback handling.
- Bank transfers.
- Manual approvals.
- Payment history.
- Receipts.
- Error handling.

MEMBERSHIP_WORKFLOW.md:
- Membership registration.
- Monthly, quarterly and annual dues.
- Renewal logic.
- Early renewals.
- Expiry dates.
- Paid and owing classifications.
- Outstanding balances.

EMAIL_AND_NOTIFICATIONS.md:
- Email configuration.
- Templates.
- Reminder workflows.
- Bulk emails.
- Delivery tracking.
- Failure handling.
- Retry mechanisms.

REPORTS_AND_EXPORTS.md:
- All reports.
- Filters.
- Pagination.
- Export behavior.
- Report calculations.

ENVIRONMENT_CONFIGURATION.md:
- Every environment variable.
- Purpose of each variable.
- Example configuration.
- Local and staging configuration.
- No real credentials or secrets.

DEPLOYMENT_GUIDE.md:
- Local setup.
- Staging deployment.
- Production deployment procedure.
- Build instructions.
- Environment setup.
- Troubleshooting.

BACKUP_AND_RECOVERY.md:
- Database backup.
- Restoration.
- Recovery procedures.
- Rollback.
- Safe migration procedures.

TESTING_GUIDE.md:
- Automated tests.
- Manual acceptance tests.
- Test setup.
- Payment testing.
- Role testing.
- Staging verification.

CHANGELOG.md:
- Version history.
- Major changes.
- Bug fixes.
- Database changes.
- Important implementation decisions.

AI_DEVELOPMENT_CONTEXT.md:

This is particularly important.

Write a detailed, self-contained technical handover that enables any future AI development environment, including ChatGPT Codex, Claude Code, Cursor or another coding assistant, to understand the entire FEDMOGA application without access to this conversation.

It should explain:
- What the application does.
- Its architecture.
- Its technology stack.
- Its database.
- Its user roles.
- Its menus and routes.
- Its registration workflows.
- Its payment logic.
- Its membership rules.
- Its renewal calculations.
- Its email infrastructure.
- Its reports.
- Its deployment.
- Its environment configuration.
- Its tests.
- Known limitations.
- Important development constraints.
- How to continue development safely.

All documentation must be based on verified source code and actual implementation. Clearly label unknowns, assumptions and incomplete features. Do not invent implementation details.

Whenever future code changes are made, update the relevant documentation and CHANGELOG.md.

## 11. PHASE NINE — STAGING DEPLOYMENT

Prepare a completely separate V3 staging environment.

Requirements:
- Separate hosting or staging deployment.
- Separate database.
- Separate environment variables.
- Paystack test keys only.
- Isolated email testing.
- Synthetic test records.
- No accidental production emails.
- No live payment transactions.
- No shared writable production database.
- Document the deployment and configuration process.

Do not deploy V3 to production.

## 12. PHASE TEN — TESTING AND QUALITY ASSURANCE

Preserve all existing tests and create additional tests.

Test:
- Login and authentication.
- Member access.
- Admin access.
- Super Admin access.
- Role-based navigation.
- Direct URL and API authorization.
- Registration filters.
- Payment-method filters.
- Online payment classification.
- Bank-transfer approval.
- Paid-but-incomplete registrations.
- Registration pagination.
- Registration reports.
- Registration exports.
- Membership paid/owing filters.
- Dues calculations.
- Renewal and expiry logic.
- Individual email reminders.
- Bulk email reminders.
- Duplicate reminder prevention.
- Failed email retry.
- Membership reports.
- Exports.
- Existing Paystack functionality.
- Existing registration workflows.
- Responsive mobile and desktop design.

Run supported:
- Lint.
- Type checking.
- Automated tests.
- Production build.
- Staging acceptance tests.

Do not claim that tests passed unless actually executed.

## 13. PHASE ELEVEN — FINAL DELIVERY

Provide:

1. V3 GitHub repository URL.
2. Verified source commit and target commit.
3. Development branch and Git history information.
4. Summary of implemented functionality.
5. Summary of preserved functionality.
6. Complete documentation inventory.
7. Test results and test count.
8. Staging deployment URL, if successfully deployed.
9. Environment configuration requirements.
10. Known issues and outstanding tasks.
11. Database and migration notes.
12. Rollback instructions.
13. Instructions for future developers and AI agents.
14. Confirmation that V2 production was not modified.

## 14. NON-NEGOTIABLE RULES

- Do not rebuild the application from scratch.
- Do not change existing branding or overall layout.
- Do not unnecessarily alter database structures.
- Do not delete working functionality.
- Do not change existing payment calculations.
- Do not change membership renewal rules without approval.
- Do not expose credentials or secrets.
- Do not overwrite GitHub repository history.
- Do not modify the existing V2 production application.
- Do not connect staging to the production database.
- Do not send real emails during development.
- Do not use live Paystack credentials in staging.
- Work incrementally with clear Git commits.
- Keep documentation updated.
- Ask for approval before destructive or irreversible operations.
- Require my explicit approval before production deployment.

## 15. EXECUTION INSTRUCTIONS

Start immediately with the read-only audit of both repositories.

Verify the source commit and test status.

Check the target V3 repository before making any changes.

Present:
1. Technical audit.
2. Current application feature inventory.
3. Proposed menu and route mapping.
4. Implementation plan.
5. GitHub migration strategy.
6. Documentation strategy.
7. Staging deployment strategy.
8. Risks and approval requirements.

Do not begin modifying code until you have presented the audit and implementation plan.

After approval, execute the project incrementally through the phases above, reporting progress and asking for approval at the appropriate checkpoints.

The ultimate goal is a stable, fully documented FEDMOGA V3 that can be maintained and extended by any competent developer or AI coding platform without needing the original ChatGPT conversation.

## Mandatory additions approved in this session
1. Restore correct registration/member View behavior from the underlying cause, with complete personal/contact/form/payment/reference/approval/dues/renewal/outstanding/history data. Protect record identity and role authorization; add regressions for roles and payment states.
2. Individual account deletion in existing user management is Super Admin-only. Confirm identified account; protect current and last-active Super Admin; audit actor/target/time/outcome. Prefer soft deactivation; preserve registrations, members, payments, dues and audits. No destructive database changes without approval.
3. Proceed with V3 while V2 database, information, API keys and all production connections remain exactly as they are. V3 staging must stay separate and use synthetic records/test keys/isolated mail.
