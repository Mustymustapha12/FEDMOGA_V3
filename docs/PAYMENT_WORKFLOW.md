# Payment workflow
Registration: /api/paystack/initialize → Paystack checkout → /api/paystack/callback or signed /api/paystack/webhook → app/paystack.ts verifyPayment. Recovery/continuation/resume routes retain existing links and avoid silently initiating a second charge.

Dues: authenticated member chooses monthly/quarterly/annually → /api/dues/initialize → /api/dues/callback or shared webhook → server/dues.ts verifyDues/finalizeDues.

Validation checks server API status/success, exact reference, positive safe integer amount at least the saved fee, NGN currency, payer email and test/live domain. Customer-borne charges may exceed the fee. Webhooks validate SHA-512 HMAC with timingSafeEqual, then call server verification. Browser redirects alone are insufficient.

Payment status SUCCESS means confirmed. PENDING represents an attempt. Manual registration approval requires bank/Paystack record confirmation; manual dues require plan coverage, a valid paid date and unique reference. Approval records the actor and audit event. Manual registration details show the external bank/payment reference separately from the internal payment ID and FEDMOGA reference.

Registration fees and dues remain in separate tables. Financial reports sum successful rows once by payment identity; pending transfer claims contribute zero. Dues records retain coverage, source, reference, approval and amount; Paystack dues can also retain charged_kobo including surcharges.

Historical limitation: a legacy manually approved registration entry says the administrator verified external records, but may not prove whether those external funds originated from a bank transfer or an outside Paystack transaction. V3's manual-method grouping uses Bank Transfer for manual records; no historical provider evidence is invented.

Error paths never grant registration access or membership coverage on unverified attempts. No payment has been made against live services during V3 development. Staging's paystackKey rejects live mode independently of the checkout toggle.
