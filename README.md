# Manual Vault

A server-backed IT manual library for storing, opening, reading, and searching equipment manuals.

## Working functionality

- Real backend API and filesystem storage
- Add a manual with manufacturer, model, notes, cover photo, and PDF
- Upload PDFs from the public app
- PDFs persist on the server instead of only in browser storage
- Open uploaded PDFs through the browser PDF viewer
- Extract text from text-based PDFs and search inside the manual
- Read scanned/image-only PDFs in the viewer (OCR is the next upgrade)
- Replace an attached PDF
- Edit a manual's title, manufacturer, category, year, tags, and notes after saving
- Add custom categories from Settings and use them in filters, new manual intake, and editing
- Delete a manual and its stored files
- Troubleshooting starting point linked to the relevant manual

## Run the working server

```bash
node server.mjs
```

Then open `http://localhost:4173`.

The server stores records in `data/manuals.json` and uploaded files in `data/files/`.

## Current access model

This deployment is running through a temporary Cloudflare Tunnel to the Mac. It is usable from another device while the Node server and tunnel are running. It is not yet a permanent hosted production service or authenticated multi-user system.

## Next production hardening

- Add login/authentication before exposing private manuals publicly
- Move files to private object storage and records to a hosted database
- Add OCR for scanned/image-only manuals
- Add verified manufacturer web search and source provenance
- Add page-level citations and server-side full-text indexing
- Add backups and permissions
