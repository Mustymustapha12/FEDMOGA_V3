# Reports and exports
Registration list/report joins all payment attempts with completed registrations and manual approval records. Pending transfer claims are included separately; approved claims are represented by their payment row, so they are not counted twice. Removed the legacy latest-500 payment cap from admin state.

Filters: name/email/phone search (saved form answers also participate), payment status paid/pending/awaiting, Paystack/Bank Transfer method, completed/paid-incomplete, mode, registration-or-attempt date range, graduation year/country/profession, ordering by date/name/number. Pending & Incomplete adds completion != completed. Page sizes 10/25/50/100; default 25.

Registration API returns filtered totals, paid/pending/awaiting counts, online/bank counts, incomplete count and confirmed amounts. Method counts describe records, including attempts; they do not imply successful collections. Amounts sum confirmed payments only. Dates are selected registration date where present, otherwise attempt/claim creation date; paidAt is a separate display/export column. A separate payment-date-range filter is not implemented.

Member reports filter paid/owing, active/overdue/inactive, preferred dues plan, expiry range, mode, date and demographics. They display paid dues totals and outstanding next renewal, plus filtered paid/owing/outstanding summaries. Pagination happens after filtering. Member lists are scoped to the current configured Paystack mode.

CSV includes every matching row across all pages. Registration export requests export=all with the identical filter query; membership export uses the complete filtered array, not pageRows. Serial numbers follow selected direction over the whole result. Permanent registration numbers never change. Shared escaping quotes values and mitigates spreadsheet formula injection.

Payment history remains in record details and dues collections with reference, method/source, status, amount, date and linked account. Existing dues-collection CSV is an unfiltered history export and is distinct from member-profile reports.

Scalability limitation: joined registration rows and member datasets are loaded before in-memory filtering. Screen response pagination is implemented, but database-side pagination/streaming and dedicated workload indexes are future improvements. Do not claim large-scale performance testing.
