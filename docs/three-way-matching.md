# Three-Way Matching

The `ThreeWayMatchingEngine` executes a deterministic comparison between:
1. The structured Supplier Invoice.
2. The originating Purchase Order (PO).
3. The actual Goods Receipt registered by the warehouse.

## Logic Flow
1. Fetch Invoice totals.
2. Fetch PO totals.
3. Fetch Goods Receipt lines.
4. Compare amounts. 

## Tolerance
The engine classifies variances. A variance `< 5.00` is flagged as `MINOR_VARIANCE` and may be auto-approved depending on tenant workflow settings. Variances exceeding this are `MAJOR_VARIANCE` and forcibly routed to the human Approval Queue.
