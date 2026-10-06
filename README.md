# Tender Document Package Builder

**AI DevFest 2026 — AI Vibe-Coding Contest (Solo)**
Daffodil International University · 6 October 2026

| | |
|---|---|
| **Name** | Abdul Kayum |
| **Registration number** | 232-15-915 |
| **Live website** | **https://ak1725.github.io/devfest-232-15-915/** |
| **Repository** | https://github.com/AK1725/devfest-232-15-915 |
| **Languages** | Bangla and English (switch in the header) |
| **License** | MIT — see [LICENSE](LICENSE) |

Turn a folder of PDF files into one complete, checked and correctly ordered
tender package — entirely inside the browser. No server, no database, no upload.

---

## How to run

There is no build step. The app is plain HTML, CSS and JavaScript.

**Online:** open https://ak1725.github.io/devfest-232-15-915/ in Google Chrome.

**Locally:**

```bash
git clone https://github.com/AK1725/devfest-232-15-915.git
cd devfest-232-15-915
python -m http.server 5500
# then open http://localhost:5500
```

A local web server is needed because the browser blocks module/CDN behaviour on
`file://` in some cases. Opening `index.html` directly usually works too.

### Using it
1. Load `requirements.json` from the tender pack.
2. Upload the PDF documents (drag and drop, or click to browse).
3. Match one file to each requirement — or press **Auto-match by file name**.
4. Enter expiry dates for documents that have them.
5. When nothing is blocking, press **Generate and download package**.

---

## Main features (all of Section 4 implemented)

| Task | Status |
|---|---|
| 4.1 Load `requirements.json`, show tender details, sort by `order` | Done |
| 4.2 Upload many PDFs, show name and page count, reject non-PDFs, remove files | Done |
| 4.3 Match files to requirements, one-to-one, changeable and undoable | Done |
| 4.4 Enter expiry dates when `has_expiry` is true and a file is matched | Done |
| 4.5 Live status for every requirement, updated on every change | Done |
| 4.6 Duplicate detection by content, blocked from double-matching | Done |
| 4.7 Generate disabled while anything blocks, with reasons shown | Done |
| 4.8 Download as `<tender_id>_Package.pdf` | Done |
| 4.9 Full Bangla / English switch | Done |

**Status rules (Section 5)** are implemented exactly as specified, including the
edge case that a document expiring *on* the submission deadline is still **OK** —
only a date strictly *before* the deadline counts as **Expired**.

**Duplicate detection** hashes each file's bytes with SHA-256 via the Web Crypto
API, so two files with identical content are caught even when their names differ
(as with `experience_cert.pdf` and `experience_cert (1).pdf` in the sample pack).
Once one of them is matched, the others are disabled in every other dropdown.

**Package rules (Section 6)**
- Page 1 is an English cover page with tender ID, title, procuring entity,
  bidder, submission deadline, creation date and the ordered list of documents.
- Documents follow the cover sorted by `order`, with all their pages in the
  original order. Optional documents with no file are skipped.
- Every page, including the cover, carries the footer
  `<tender_id> | Page X of Y`, where `Y` is the total page count of the package.
- The footer sits in a clear strip in the bottom margin so it never sits on top
  of the document's own content.

---

## Bonus features

- **Index page** (optional checkbox) listing the page each document starts on.
  Page numbers are computed before the pages are copied, so they are exact.
- **Auto-match by file name** — token-overlap scoring suggests matches, while
  still respecting the duplicate rule.
- **Checklist export to CSV** (document, file name, pages, expiry date, status),
  written with a UTF-8 BOM so Bangla opens correctly in Excel.
- **Safe handling of bad files** — damaged or password-protected PDFs are
  reported with a clear message instead of crashing the app.
- **Language choice remembered** between visits via `localStorage`.
- Dark mode, full keyboard access, and a responsive layout down to phone width.

---

## Known problems

- The PDF cover and index pages are drawn with the standard Helvetica font, which
  cannot render Bangla glyphs. Section 6.1 requires the cover to be in English, so
  the cover and index are English-only by design; the whole **interface** is fully
  bilingual. Bangla text inside the uploaded documents is untouched and renders
  normally, because those pages are copied as-is.
- The footer is drawn over a white strip across the bottom 20 points of each page.
  On a document whose content runs right to the very bottom edge with no margin,
  that strip could overlap it. Every document in the sample pack has a normal
  margin and is unaffected.
- Very large packages are limited by browser memory; the contest limits
  (30 files, 50 MB) are enforced in the app and are well within a safe range.
- Matching is deliberately one file per requirement, as the specification states.
  A requirement needing several files would have to be merged beforehand.

---

## AI tools used

- **Claude Opus 5** via Claude Code (VS Code extension) — used for the whole build.

## Most useful prompt

> Build a frontend-only web app for the AI DevFest Tender Document Package
> Builder problem. Plain HTML/CSS/JS plus pdf-lib from a CDN, no build step,
> deployable to GitHub Pages. Load `requirements.json`, upload many PDFs and show
> page counts, match one file per requirement, enter expiry dates, compute the
> five statuses from Section 5, detect duplicate files by SHA-256 and stop them
> being matched to two documents, disable Generate while any blocking status
> remains, and build one combined PDF with an English cover page, documents in
> order, and a `<tender_id> | Page X of Y` footer on every page. Every label must
> come from a Bangla/English translation table with a language switch. Make it
> modern, minimal and visually polished.

---

## Technical notes

| | |
|---|---|
| Stack | Plain HTML, CSS, JavaScript — no framework, no build step |
| PDF engine | [pdf-lib](https://pdf-lib.js.org/) 1.17.1 from cdnjs (page counts, merging, drawing) |
| Hashing | Web Crypto `crypto.subtle.digest("SHA-256", …)` |
| Storage | `localStorage`, only for the chosen language |
| Backend | None. No server, no database, no online storage — Rulebook §5.1 |
| Secrets | None in the code, the repository or the live site — Rulebook §5.8 |

```
index.html          markup and layout
css/styles.css      design system, light and dark themes
js/i18n.js          every Bangla and English string
js/app.js           state, status rules, duplicates, PDF generation
output/             the generated package for the sample pack
screenshots/        screenshots of the running app
```
