# Membership workflow
Members are linked to one completed registration and unique by email + test/live mode. Duplicate legacy registrations are flagged; they are not silently converted into duplicate accounts. New/legacy-eligible members use a 24-hour activation link to verify email and set a password. Registration fees do not buy dues coverage.

server/calendar.ts is the unchanged calendar authority (Africa/Lagos): monthly ends at month-end, quarterly at quarter-end, annually on December 31. Early renewal begins the day after paid_until. Expired coverage renews from the payment date/current period. No proration, accumulated historical arrears or automatic recurring deductions.

membershipStatus: active when enabled coverage includes today; overdue when unpaid within the configured grace window; inactive after grace or when disabled. New unpaid members use account creation as the grace anchor. Default grace is 30 days; configured 0–90. Zero plan price disables checkout.

server/membership-summary.ts separately reports paid/owing based on coverage. Outstanding is one next renewal at current configured preferred-plan price for an enabled unpaid member. Disabled accounts have zero actionable outstanding; expired enabled accounts remain owing even if status is inactive. A paid disabled account can retain paid coverage while sign-in remains disabled. Do not relabel this estimate as historical debt.

finalizeDues locks member then payment, extends only once, stores coverage and queues a receipt. Manual dues use the approved paid date. Existing paid-through dates, prices and rounding are preserved. Details include successful dues totals plus all dues attempts, source/reference/status, coverage and approval.
