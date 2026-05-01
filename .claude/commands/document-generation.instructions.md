---
applyTo: "**/*.{py,js,ts,mjs,cjs}"
---

# Document Generation Accessibility

These rules apply when code imports or uses document generation libraries. They catch accessibility issues at the point of document creation — before the document is even produced.

---

## Detection

These rules activate when the file imports any of these libraries:

**Python:** `python-docx` / `docx`, `openpyxl`, `python-pptx` / `pptx`, `reportlab`, `fpdf2` / `fpdf`, `WeasyPrint`, `xlsxwriter`, `pdfkit`

**JavaScript/TypeScript:** `docx` (npm), `exceljs`, `pptxgenjs`, `pdfkit`, `jspdf`, `pdf-lib`, `officegen`

---

## Metadata (All Formats)

- Always set `title` — a descriptive document title is required for accessibility. Never leave it blank or default.
- Always set `language` — screen readers need the document language to use correct pronunciation.
- Set `author` — identifies the creator for audit trail and accountability.

## Word Generation (python-docx / docx npm)

- Use heading styles (`Heading 1`, `Heading 2`, etc.) for document structure — never apply bold/font-size manually to simulate headings.
- Never skip heading levels (e.g., `Heading 1` → `Heading 3` without `Heading 2`).
- Add alt text to every inserted image via the `descr` parameter.
- Mark decorative images explicitly — do not leave `descr` empty; either provide alt text or mark as decorative.
- Set table header rows — mark the first row as a header row so it repeats on page breaks and is recognized by screen readers.
- Use descriptive hyperlink text — never use raw URLs as link text.

## Excel Generation (openpyxl / exceljs / xlsxwriter)

- Give every sheet a descriptive name — never leave default names like `Sheet1`.
- Set print title rows — freeze and repeat the header row for printed/PDF output.
- Add alt text to charts and images.
- Avoid merged cells when possible — they break screen reader table navigation. If merging is required, ensure the merged cell's content is meaningful.
- Never rely on color alone to convey meaning — add text labels, patterns, or icons alongside color coding.
- Add data validation messages — when using dropdown lists or validation, include input messages and error alerts.

## PowerPoint Generation (python-pptx / pptxgenjs)

- Every slide must have a title — add a title placeholder even if the slide is primarily visual.
- Add alt text to every image, chart, and shape.
- Set a logical reading order — the XML order of shapes determines the screen reader reading sequence.
- Use built-in slide layouts — custom layouts without proper placeholders may lack accessibility structure.
- Add speaker notes for complex visual slides — notes provide additional context for screen reader users accessing the notes view.

## PDF Generation (reportlab / pdfkit / jspdf / pdf-lib)

- Generate tagged PDFs — enable tagging/structure trees in the PDF output.
- Set the `/Lang` entry in the PDF catalog.
- Mark headings with proper structure tags (`<H1>` through `<H6>`), not just bold text.
- Add `/Alt` attributes to figure elements.
- Set the document title in both XMP metadata and the `/Info` dictionary.
- Add bookmarks for navigation in documents longer than 5 pages.

## Common Anti-Patterns

- **Bold as heading:** Using `bold=True` or `font-weight: bold` instead of heading styles. Screen readers cannot detect visual-only headings.
- **Empty alt text:** Setting `alt=""` or `descr=""` when the image is not decorative. Provide meaningful descriptions.
- **Color-only tables:** Using cell background colors to indicate status without text labels. Add text like "Complete", "Pending" alongside the color.
- **Generic titles:** Setting title to "Document", "Untitled", or the filename. Use a meaningful title describing the document's content.
- **Raw URL links:** Inserting `https://example.com/page?id=123` as visible link text instead of "View project details".
