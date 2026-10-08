# Manual Vault

A working prototype for an IT manual reference library.

## Current functionality

- Searchable library by model, manufacturer, symptom, category, and extracted PDF text
- Add a manual with a cover/nameplate photo and a real PDF file
- Store uploaded PDFs in browser IndexedDB
- Open PDFs inside the app with the browser's native PDF viewer
- Extract text from text-based PDFs with PDF.js and read it in the app
- Search within extracted manual text
- Replace an attached PDF
- Delete a manual and its locally stored PDF after confirmation
- Troubleshooting starting point linked to the relevant manual record

## Important storage boundary

This is still a browser-local prototype. Manuals and PDFs are saved only in the browser/device where they were added. They do not sync across devices, and clearing site data can remove them. Scanned PDFs without a text layer can still be opened and read in the PDF viewer, but their text will not be indexed yet.

## Production upgrade

The next production version should move PDFs to private object storage, records to a database, and extracted/OCR text to a server-side index. It should also add login, manufacturer-source verification, page-level citations, and OCR for scanned manuals. The current UI is intentionally shaped around that workflow.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
