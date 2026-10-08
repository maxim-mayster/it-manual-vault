# Manual Vault

A first working prototype for an IT manual reference library.

## Included in this prototype

- Searchable manual library with sample IT equipment records
- Search by model, manufacturer, symptom, or keyword
- Category filters
- Manual detail/PDF viewer placeholder
- Guided troubleshooting surface that maps an issue to likely manuals
- Add-manual intake flow with cover-photo upload field
- Browser-local persistence using `localStorage`
- Responsive layout for desktop and mobile

## Important boundary

The current prototype does **not** yet perform OCR, web searching, PDF downloading, or AI retrieval. Those require a backend and a source-verification workflow. The interface is intentionally ready for those capabilities without claiming they are connected.

## Production architecture

1. Upload cover/nameplate photo.
2. OCR the manufacturer, model, and part number.
3. Search manufacturer sites and trusted documentation sources.
4. Verify the match before saving an official PDF.
5. Extract/index PDF text, including OCR for scanned manuals.
6. Search with model + symptom and cite the manual/page.
7. Store PDFs in object storage and records in a database with authentication.

Recommended production stack: Next.js, Supabase Auth/Postgres/Storage, PDF text extraction with PyMuPDF, OCR only when needed, and retrieval results that always show the source manual and page.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
