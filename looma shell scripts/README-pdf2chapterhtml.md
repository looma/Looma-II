# Converting chapter PDFs to HTML

[`pdf2chapterhtml.py`](pdf2chapterhtml.py) turns Looma's textbook chapter PDFs into self-contained HTML
files. The pages keep their original look, and their text can be selected, searched and read aloud with
line highlighting.

The conversion is deterministic. It uses PyMuPDF and the code in this folder, and it makes no calls to an
AI model or other network service. The script reads files named in a job list and writes the results; it
does not touch MongoDB.

## At a glance

```text
jobs.json ──> pdf2chapterhtml.py ──┬─ vector PDF: artwork as SVG + real HTML text
                                   └─ scan PDF:   page as JPEG + transparent OCR text
                                          │
                                          v
              {id}.html, next to {id}.pdf in ../content/chapters/
                                          │
                                          v
              Looma finds the file on disk and opens it instead of the PDF
```

| File | Purpose |
|---|---|
| [`pdf2chapterhtml.py`](pdf2chapterhtml.py) | Converts the PDFs and runs the jobs in parallel |
| [`preeti.py`](preeti.py) | Converts legacy Preeti-family Nepali text to Unicode |
| [`OcrMyPdf multiple files command.txt`](OcrMyPdf%20multiple%20files%20command.txt) | Sample OCRmyPDF command for adding an OCR layer to PDFs |

## Requirements

- Python 3.9 or newer (`preeti.py` uses `str.removesuffix`)
- PyMuPDF. The last test used `PyMuPDF==1.27.2`, the version pinned in `looma-ai/requirements.txt`
- A copy of `js/looma.js`, which holds the Preeti mapping tables

PyMuPDF 1.27.2 prints a `FutureWarning` because the script uses `import fitz`. The warning is harmless for
now, but a future PyMuPDF release may remove that module name.

## Running a conversion

### 1. Point `preeti.py` at `looma.js`

`LOOMA_JS` in `preeti.py` is hardcoded to a Windows path. Change it for your machine, or the workers fail
with `FileNotFoundError`:

```python
LOOMA_JS = r"/path/to/Looma/js/looma.js"
```

To check the tables load, run `python preeti.py`. It should print:

```text
g]kfn -> नेपाल
sIff -> कक्षा
ljBfno -> विद्यालय
```

### 2. Create `jobs.json`

The script builds nothing itself: it needs a JSON list with one object per PDF. The tool that generated
the original list is not in this repository, so you have to create your own.

```json
[
  {
    "pdf": "/var/www/html/content/chapters/Class10/Math/en/10M01.pdf",
    "html": "/var/www/html/content/chapters/Class10/Math/en/10M01.html",
    "title": "Math - Class 10 - 10M01: Sets",
    "lang": "en",
    "kind": "vector",
    "rel": "Class10/Math/en/10M01.pdf"
  }
]
```

| Field | Meaning |
|---|---|
| `pdf` | Input PDF |
| `html` | Output file, which is overwritten if it exists |
| `title` | Text for the HTML `<title>` |
| `lang` | Value for `<html lang>`. Existing files use `en` and `ne` |
| `kind` | `scan` for the scan pipeline. Any other value takes the vector path, so use `vector` |
| `rel` | Label used in the log and in failure messages |

**Choosing `kind`:** `kind` applies to the whole file, and the script does not detect it. The original
selection rule was not kept, but scanned PDFs can be recognised by Tesseract's `GlyphLessFont`:

```python
import fitz

def pdf_kind(path):
    with fitz.open(path) as doc:
        fonts = {font[3].lower() for page in doc for font in page.get_fonts()}
        if any("glyphless" in font for font in fonts):
            return "scan"
        # OCR from other tools (e.g. a "HiddenHorzOCR" font with Times/Helvetica
        # runs) is drawn in invisible text mode over a page image: also a scan.
        chars = invisible = 0
        for page in doc:
            for span in page.get_texttrace():
                n = len(span["chars"])
                chars += n
                if span["type"] == 3 or span.get("opacity", 1) == 0:
                    invisible += n
    return "scan" if chars and invisible / chars > 0.5 else "vector"
```

The font test alone is not enough. `Class8/Science/en/8S01.pdf` is a page image with invisible OCR text in a
`HiddenHorzOCR` font and no `GlyphLessFont`; taken as `vector`, its invisible text was redacted (the visible
text is part of the image, so it stayed), and the OCR words were laid over it in black: every line appeared
twice, and OCR misreadings of the safety signs showed up as stray "@", "®" and "x". Check `kind` before a large
run.

### 3. Run it

Run this from this folder, or keep `preeti.py` next to the script so that the import works:

```bash
python pdf2chapterhtml.py jobs.json 8 convert.log
```

| Argument | Default | Meaning |
|---|---|---|
| 1 | Required | Path to the job list |
| 2 | `8` | Number of worker processes |
| 3 | `convert.log` | Log file |

The script prints progress every 100 files and a final summary:

```text
DONE ok=3 fail=0 in 7s
```

### 4. Check the result

Each line of the log is tab-separated:

```text
status    rel    pages    output_bytes    seconds    error
```

A failed file does not stop the run, so look for `FAIL` lines. Then open a few converted chapters in Looma
and check that the pages look right, the text can be selected, and Speak highlights the lines being read.

Running the script does not skip finished files, so give it only the PDFs you want to convert.

## How the two pipelines work

### Vector PDFs

For PDFs with real fonts, each page goes through these steps:

1. Read every run of text with its position, font, size and colour.
2. Clean the text and, where needed, convert it to Unicode. See [Text fixes](#text-fixes).
3. Remove the original text from the page with PyMuPDF redaction, leaving images and line art in place.
4. Export what remains as an inline SVG, with its IDs prefixed so pages do not collide in one document.
5. Add the words back as absolutely positioned HTML `<span>` elements in a `.tl.pdf-text` layer.

Redaction happens in the PDF, not in the exported SVG, because MuPDF draws glyphs in different ways from
file to file. Pattern-matching the SVG could miss some, leaving the old text visible under the new text.

Some text cannot be redrawn as HTML text without looking wrong. Since November 2026 it keeps its original ink
in the SVG and gets only a transparent, selectable span on top:

| Text | Why it is not redrawn |
|---|---|
| Private Use Area characters (`U+E000`-`U+F8FF`) | Symbol-font pieces with no Unicode: big-bracket parts, Wingdings bullets. No browser font has them |
| Fonts whose name contains `math` | Word equations (Cambria Math) extract each letter twice: one drawn `x` reads `𝑥𝑥` |
| Rotated lines | HTML text is laid out horizontally; a chart's vertical axis title came out scrambled |
| Garbled text (control characters, `\`, a capital inside a lowercase word) | A CID font with an incomplete ToUnicode: "'iscuss in \our grouS" for "Discuss in your group" |

A false positive in that list costs nothing visible, because the ink stays.

Redaction is first tried on a copy of the page. If any other text survives it (text inside some form XObjects:
tables of contents, equation objects), nothing is redacted on that page: the SVG keeps all the original text and
every span is transparent. Without this, those words showed twice, and redaction could also remove only part of
a run.

A run is split where its characters jump forward by more than half the font size, or at a space wider than 0.8
of it. The gap is room for something drawn as line art, such as the radical in "Does √64". One span stretched
across it distorted the words on both sides.

In November 2026 all 507 vector chapters on the box were reconverted with these rules, together with every Grade 8
Science chapter as a scan. Before that, 23 had duplicated text and 15 had symbol characters as text.

### Scanned PDFs

A scanned page has no separate text or artwork, so each page goes through these steps:

1. Render the page to a JPEG at 150 dpi, quality 88, and embed it as base64.
2. Read the OCR words already in the PDF.
3. Place them over the image as transparent spans, so the text can be selected but the page still looks
   like the scan.

**This pipeline does not run OCR.** The PDF must already have an OCR layer. The repository's sample command
does that with OCRmyPDF for English and Nepali:

```bash
find . -name '*.pdf' -exec ocrmypdf --force-ocr --rotate-pages --output-type pdf --optimize 2 -l eng+nep '{}' '{}.ocr.pdf' ';'
```

Text quality on these pages depends entirely on that OCR.

### Output

Each chapter is one HTML file containing its CSS, JavaScript, SVG and base64 images. The structure is:

```html
<div class="book">
  <div class="page vector" style="aspect-ratio:W/H">
    <svg>...</svg>                 <!-- or <img class="bg"> on a scan page -->
    <div class="tl pdf-text">
      <span style="left:..%;top:..%;font-size:..cqw" data-w="..">words</span>
    </div>
  </div>
</div>
```

- **Scaling:** positions are percentages and font sizes use `cqw`, so the text scales with the page.
- **Width fit:** a small script stretches each span to its width in the PDF, because the browser's font may
  differ from the original. It ignores corrections outside the range 0.5 to 2, which indicate a bad bounding
  box, and rotated pages get no width fit.
- **Fonts:** fonts are not embedded in the text layer. Vector text uses a font stack based on the PDF font's
  name, and Nepali text uses `Noto Sans Devanagari`, `Kalimati`, `Mangal` or similar. Its appearance therefore
  depends on the fonts installed on the device.
- **Reading highlight:** `.pdf-text` is what makes `LOOMA.speak.highlightBlock()` draw one band per line. The
  `.tts-pdf-highlight` style is duplicated in the script and must stay in sync with `css/looma.css`.

## Text fixes

**Fake spaces.** Some textbooks give a glyph zero width and then add its real width as a space, so extraction
reads "Mathematics" as "Mathem atic s". `line_runs()` drops any space that directly follows a zero-width glyph.

**Legacy Nepali fonts.** Fonts such as Preeti store Nepali as Latin bytes: `g]kfn` means `नेपाल`. For a font
matching the legacy list in `preeti.py`:

- If a mapping table exists, the text is converted to Unicode.
- If there is no table, the text is kept as a 200 dpi image crop, because its bytes are not meaningful
  characters. That text cannot be selected or read aloud.

`preeti.py` reads its tables from `js/looma.js` so that the two cannot drift apart. It also applies the
table's post-rules, which the JavaScript `map_to_unicode()` computes and then discards.

**Unusual PDF geometry.** The script keeps runs whose width could not be calculated, so characters are not
lost, and it maps text coordinates through the page's rotation.

## How Looma uses the HTML

Conversion only writes files, and Looma finds them on disk. No database registration is involved, and **HTML
always wins over PDF** when a chapter has both:

```text
../content/chapters/{Class}/{Subject}/en/{id}.html
../content/chapters/{Class}/{Subject}/np/{id}-nepali.html
```

| Part of Looma | What it does |
|---|---|
| `looma-chapters.php` | Marks a chapter button `data-ft='htmlchapter'` when the HTML exists |
| `looma-chapter-file.php`, `LOOMA.resolveChapterFile()` | Upgrades a `.pdf` request to HTML for other entry points such as library search, lesson plans and the assistant |
| `looma-html.php` | Displays the chapter, adds its telemetry context and finds the same chapter in the other language |
| `looma-ai/scripts/ingest_bulk_content_to_mongo.py` | Skips a PDF that has an HTML twin and indexes the HTML's words, not its markup |
| `looma-ai/scripts/looma_server.py` | Treats the HTML as the chapter's textbook file on the AI Tooling page |

Deleting an HTML file makes Looma fall back to the PDF. The endpoint never breaks an existing PDF chapter: if
its input is unusable, it answers with the PDF.

The HTML does not replace the PDF as a source file, so keep the PDFs for reconversion.

## Why not pdf2htmlEX?

It was tried first and rejected. Its poppler build silently drops JPEG-2000 images, which are most of the
illustrations in these textbooks, and it crashes on the glyph-less OCR font.

## Known limitations

- **Job generator missing:** `jobs.json` and its generator are not in the repository.
- **Reproducibility:** the original library was converted with an unrecorded PyMuPDF version, so reruns may not
  be byte-identical. In a test with 1.27.2, the output matched the existing files in page count and kind, and
  the file sizes differed by less than 0.5%.
- **One `kind` per file:** a PDF that mixes scanned and vector pages goes through a single pipeline.
- **New legacy fonts:** a new font needs a table in `js/looma.js`, or a matching name in `LEGACY` and `ALIAS`.
  A legacy font missing from `LEGACY` would be written as meaningless text.
- **Files not made by this script:** `Class5/English/en/5EN14.html` has a different structure from the script's
  output, and converting its PDF would overwrite it. Check that a target is safe to replace before including it.

## Library snapshot

Counted on the Looma box at 192.168.1.146 on 6 November 2026:

| Output type | HTML files |
|---|---|
| `scan` | 1599 |
| `vector` | 514 |
| Other structure (`5EN14.html`) | 1 |
| **Total** | **2114** |

Three PDFs had no HTML twin:

- `Class7/SocialStudies/np/7SS07.07-noOCR-nepali.pdf`
- `Class7/SocialStudies/np/7SS07.10-noOCR-nepali.pdf`
- `Class10/Nepali/np/10N18-nepali.pdf`
