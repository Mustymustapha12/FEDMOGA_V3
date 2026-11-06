# Roles and permissions
| Capability | Member | Admin | Super Admin |
|---|---|---|---|
| Own member dashboard and dues payment | Yes | Separate member identity required | Separate member identity required |
| Registration and member management/details/reports | No | Yes | Yes |
| Individual previous-payment / bank dues approval | No | Yes | Yes |
| Bulk previous-payment CSV approval | No | No | Yes |
| Dues settings and registration fee/form | No | Yes | Yes |
| Configure Paystack keys/mode | No | No | Yes |
| Admin users and account deactivation | No | No | Yes |
| Email history, retries, processing, SMTP test | No | No | Yes |
| Legacy-member migration / test-data cleanup | No | No | Yes |

Admin sessions are hashed tokens, eight-hour expiry, HttpOnly/SameSite=Lax cookies, Secure under NODE_ENV=production, active-account and auth_version checks. Member sessions use separate cookies and require enabled, verified accounts. Passwords use salted scrypt. Login determines the role server-side and revokes the opposite role session.

Protected pages render shells; API authorization protects data. /api/admin/records is restricted to Admin/Super Admin and validates kind plus UUID. It never searches a different person's record when an ID fails. Members use the separate own-state endpoint; they cannot request admin detail APIs.

DELETE /api/admin/users soft-deactivates an admin account. The transaction locks the entire role set, rechecks the actor, protects self/last active Super Admin, sets active=0, increments auth_version, removes sessions and inserts a success audit. Failed authenticated attempts are also audited. Account rows, email identity, memberships, registrations and financial records remain. Existing activation can restore login access; deletion is deliberately reversible deactivation. This action operates on existing Admin Users, not member-account deletion. Member access already has a separate Super Admin enable/disable action.
