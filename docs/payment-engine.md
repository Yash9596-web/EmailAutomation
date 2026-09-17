# Payment Engine

The Payment Engine allocates monolithic payments against granular invoices.

## Core Problem
A customer pays $1,000 for three invoices: $400, $500, and $100. 

## The Implementation
1. The engine checks existing `PaymentAllocation` sums.
2. It verifies the incoming payload does not exceed the payment total.
3. It creates atomic `PaymentAllocation` joins mapping the Invoice to the Payment.
4. It dynamically checks if `Allocated Total === Invoice Total`. If yes, sets status to `PAID`. Otherwise, `PARTIALLY_PAID`.

## Concurrency Protection
Because this occurs within `db.$transaction`, concurrent requests allocating the same payment will throw serialization or validation errors, preventing duplicate financial credit.
