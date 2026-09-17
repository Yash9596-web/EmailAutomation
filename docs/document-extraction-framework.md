# Document Extraction Framework

The Document Extraction Framework parses raw OCR text and layout metadata into normalized, structured business representations (JSON).

## Architecture

```
DocumentPipeline
   ├── OCR Provider
   ├── Document Classifier (INVOICE, PO, etc)
   ├── ExtractionProvider (AI / LLM mapping)
   ├── EntityMatcher (DB normalization)
   └── DocumentValidator (Business math logic)
```

## Process
1. The **Classifier** categorizes the document (e.g., `INVOICE`).
2. The **Extractor** pulls semantic fields (Supplier Name, Subtotal).
3. The **Matcher** attempts to link `Supplier Name` strictly to the `Supplier` table in the database.
4. The **Validator** proves financial math (e.g. `decimal.js` checks that Subtotal + Tax = Total) and checks `db.invoice` for duplicates.
5. If at any point confidence drops below `0.8` or validation throws an error, the document's status transitions to `REVIEW_REQUIRED`, halting automation until human intervention occurs.
