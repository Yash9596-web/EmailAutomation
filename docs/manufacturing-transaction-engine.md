# Manufacturing Transaction Engine

The Transaction Engine handles all atomic mutations mapping real-world artifacts (like PDFs) to structured database records (like Invoices).

## Core Philosophy
1. **Safety First**: AI can extract data, but it cannot commit financial transactions. `DocumentValidator` verifies rules, and `InvoiceEngine.createFromDocument` executes the atomic creation.
2. **Immutability**: Once an Invoice reaches `ISSUED`, it cannot transition to `DRAFT`. Adjustments must happen via Credit Notes.
3. **Traceability**: Every record traces its origin (e.g. `documentId`) ensuring full visual provenance.

## Financial Calculations
The platform strictly mandates the use of `decimal.js` for all math.
```ts
const subtotal = new Decimal(line.quantity).times(line.unitPrice);
```
