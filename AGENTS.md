# FEDMOGA agent instructions
Read README.md, docs/AI_DEVELOPMENT_CONTEXT.md and the relevant workflow documentation before changing code. Inspect existing behavior first.

- Work on V3 only. V2 production, database contents, credentials, Paystack configuration and connections must remain unchanged.
- Preserve branding, layout, data, registration/payment identity, dues calculations and calendar renewal rules.
- Never expose credentials, encrypted tokens, account links or database exports in logs, commits or responses.
- Staging must have an independent writable database, Paystack test keys, synthetic data and isolated email delivery. Never send development mail to real members.
- No production deployment without explicit approval. No destructive migrations, history overwrites or deletion of financial/membership records without approval.
- Use transactions, server authorization and parameterized SQL. Navigation visibility is not an authorization boundary.
- Account deletion means auditable login deactivation, not deletion of a person's business history. Protect self and last active Super Admin.
- Keep the existing tests, add meaningful regression coverage, and run relevant tests, typecheck and production build. Report skipped checks honestly.
- Update relevant docs and docs/CHANGELOG.md after changes. Report modified files, test counts, limitations and deployment state.
- Recheck remote branches before pushing. Do not force-push. Do not push or deploy V3 into V2.
