# Registration workflow
1. Applicant enters full name, email and phone. The configured one-time fee defaults to ₦5,000 only when no setting exists.
2. Server initializes Paystack with a saved fee snapshot and unique reference. An attempt is PENDING, not paid.
3. Server verifies payment before issuing a private single-use continuation token, ordinarily valid for 30 days.
4. Applicant completes the published form. Full name/email/phone come from the verified payment even if the submitted body is changed.
5. In one transaction, create the registration and permanent registration number, create a member account if eligible, queue activation, and consume the continuation token.

Default fields: fullName, dob, phone, whatsapp, email, address, country, year, profession and consent. Additional published fields are JSON in registrations.answers. All saved answers remain visible in details, even when the current form no longer contains the field.

Registration rows are joined by registrations.payment_id to payments.id. Details explicitly distinguish registration IDs, member IDs and incomplete-payment IDs. A missing or mismatched ID returns 400/404 rather than another profile. Incomplete confirmed payments remain available for recovery, copying/emailing their existing continuation link, and reports.

Previous payments: existing individual approval and Super Admin CSV import remain. V3 adds an admin-recorded bank-transfer claim in registration_transfer_requests. Pending claims grant no access and contribute zero confirmed revenue. Bank confirmation approves the claim and creates the existing successful manual payment/link transactionally. Repeated approvals are rejected. This is an administrator workflow, not a new public bank-proof upload portal.

Existing safe test-only cleanup remains restricted to Super Admin. No live records are deleted by this workflow.
