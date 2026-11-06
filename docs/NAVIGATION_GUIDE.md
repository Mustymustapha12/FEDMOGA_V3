# Navigation guide
Public routes: / (registration/payment recovery), /login (all roles), /member (member dashboard and account activation/reset links), /admin (admin portal).

| Group | Item | /admin tab |
|---|---|---|
| Dashboard | Dashboard | dashboard |
| Registrations | All Registrations | registrations |
| Registrations | Pending & Incomplete | abandoned |
| Registrations | Previous Payments to Approve | manual |
| Registrations | Reports & Export | registrationReports |
| Registrations | Registration Form | builder |
| Members | All Members | memberships |
| Members | Dues & Renewals | dues |
| Members | Reports & Export | reports |
| Administration | Registration & Payment Settings | settings |
| Administration | Membership Settings | membershipSettings |
| Administration | Admin Users (Super Admin only) | users |
| Administration | My Account | account |

Sign Out retains the existing logout workflow. Membership Settings retains dues prices, grace period, manual bank-dues approval, migration and mail processing; it now includes email history. Payment history is retained within registration/member details and dues collections, and the registration toolbar opens the existing full Payment History with its controls; legacy payments/incomplete tabs remain in code for compatibility, although duplicate sidebar links are removed.

Mobile sidebar remains expandable. Public pages retain the header. Member navigation remains Dashboard, Pay Dues / Renew, My Payments and My Profile. View opens a fetched details panel in the existing layout and scrolls into view; it does not navigate to an empty route.
