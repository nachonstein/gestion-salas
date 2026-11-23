---
name: discovery-knowledge-convert-pdf
description: Converts PDF documents to Markdown + JSON using Python (pdfplumber). Extracts text, tables, and metadata. Falls back to OCR (Tesseract) for scanned PDFs.
license: Apache-2.0
compatibility: Requires Python 3. Installs pdfplumber on demand. Optional Tesseract for OCR.
metadata:
  author: discovery-knowledge
  version: "2.0"
---

# Knowledge - Convert PDF

Convert a PDF document to structured output in `.discovery/knowledge/`. Extracts text, tables, images, and metadata.

## Fallback Chain

```
pdfplumber (text) → Tesseract (OCR) → Ollama vision (diagrams) → warn user
```

- **Text PDFs**: pdfplumber extracts text directly
- **Scanned PDFs**: Tesseract OCR as fallback
- **Image-only PDFs (diagrams)**: Ollama vision with guided prompts
- **If all fail**: Mark as pending manual review

## Output Format

- **Text-heavy PDFs** (docs, specs, manuals) → Markdown (`.md`)
- **Table-heavy PDFs** (data sheets, reports) → JSON (`.json`) + Markdown summary
- Both formats include frontmatter/metadata with source, pages, and conversion date

## Steps

### 1. Check tool availability

```bash
python3 -c "import pdfplumber; print(pdfplumber.__version__)" 2>/dev/null && echo "OK" || echo "NOT INSTALLED"
```

If NOT INSTALLED:
```bash
pip install pdfplumber
```

For scanned PDFs (OCR), check Tesseract:
```bash
tesseract --version 2>/dev/null && echo "TESSERACT OK" || echo "NO OCR"
```

If Tesseract not available and OCR needed:
```bash
# macOS
brew install tesseract
# Also install Python bindings
pip install pytesseract Pillow
```

### 2. Analyze PDF type

```python
import pdfplumber

with pdfplumber.open("<input_path>") as pdf:
    first_page = pdf.pages[0]
    text = first_page.extract_text() or ""
    tables = first_page.extract_tables()

    if len(text.strip()) < 50 and not tables:
        print("SCANNED_PDF")  # needs OCR
    elif tables and len(tables) > 0:
        print("TABLE_HEAVY")  # produce JSON + MD
    else:
        print("TEXT_HEAVY")   # produce MD
```

### 3. Extract content

Create or use `.discovery/knowledge/tools/pdf-convert.py`:

```python
#!/usr/bin/env python3
import pdfplumber
import json
import sys
import os
from datetime import datetime

input_path = sys.argv[1]
basename = os.path.splitext(os.path.basename(input_path))[0]
output_dir = ".discovery/knowledge/ingested"
os.makedirs(output_dir, exist_ok=True)

with pdfplumber.open(input_path) as pdf:
    metadata = {
        "source": input_path,
        "pages": len(pdf.pages),
        "converted_at": datetime.now().isoformat(),
        "converter": "pdfplumber",
    }

    all_text = []
    all_tables = []

    for i, page in enumerate(pdf.pages):
        page_text = page.extract_text() or ""
        page_tables = page.extract_tables() or []

        all_text.append(f"<!-- Page {i+1} -->\n{page_text}")

        for j, table in enumerate(page_tables):
            all_tables.append({
                "page": i + 1,
                "table_index": j,
                "headers": table[0] if table else [],
                "rows": table[1:] if table else [],
            })

    # Generate Markdown
    frontmatter = f"""---
source: {input_path}
pages: {len(pdf.pages)}
converted_at: {metadata['converted_at']}
converter: pdfplumber
---

"""
    md_content = frontmatter + "\n\n".join(all_text)

    # Write Markdown
    md_path = os.path.join(output_dir, f"{basename}.md")
    with open(md_path, "w") as f:
        f.write(md_content)
    print(f"Markdown: {md_path}")

    # If tables found, also write JSON
    if all_tables:
        json_data = {
            "metadata": metadata,
            "tables": all_tables,
        }
        json_path = os.path.join(output_dir, f"{basename}.tables.json")
        with open(json_path, "w") as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        print(f"Tables JSON: {json_path}")
```

Run:
```bash
python3 .discovery/knowledge/tools/pdf-convert.py "<input_path>"
```

### 4. OCR fallback for scanned PDFs

If the PDF is scanned (no extractable text), use Tesseract:

```python
#!/usr/bin/env python3
import pdfplumber
from PIL import Image
import pytesseract
import io

with pdfplumber.open("<input_path>") as pdf:
    for i, page in enumerate(pdf.pages):
        # Convert page to image
        img = page.to_image(resolution=300)
        # Run OCR
        text = pytesseract.image_to_string(img.original)
        print(f"--- Page {i+1} ---")
        print(text)
```

If Tesseract is not available, warn:
```
⚠️ This PDF appears to be scanned (no extractable text).
   Install Tesseract for OCR: brew install tesseract && pip install pytesseract Pillow
   Without OCR, only metadata can be extracted.
```

### 5. Ollama Vision fallback for image-only PDFs (diagrams)

When the PDF contains only images (diagrams, charts, architecture schemas) and no extractable text:

#### 5.1 Check and install Ollama

```bash
# Check if Ollama is available
ollama --version 2>/dev/null && echo "OLLAMA OK" || echo "NOT INSTALLED"
```

If NOT INSTALLED:
```bash
# macOS
brew install ollama
brew services start ollama
# Wait for service to start
sleep 3
```

#### 5.2 Select and pull vision model

Choose a model based on available hardware:

| Hardware | Model | Size | Quality | Speed |
|----------|-------|------|---------|-------|
| 8GB RAM | `gemma3:4b` | 3.3 GB | Medium (needs guided prompts) | Fast |
| 16GB RAM | `gemma3:12b` | 8.1 GB | Good | Medium |
| 32GB+ RAM | `gemma3:27b` | 17 GB | Excellent | Slow |
| Apple Silicon M2+ 16GB | `gemma3:12b` | 8.1 GB | Recommended balance | Medium |

```bash
# Pull the selected model (example: 4b for lightweight machines)
ollama pull gemma3:4b
```

#### 5.3 Extract images from PDF with pymupdf

```bash
# Install pymupdf if needed
pip install pymupdf 2>/dev/null || pip install PyMuPDF
```

```python
import fitz  # pymupdf

doc = fitz.open("<input_path>")
page = doc[0]
images = page.get_images(full=True)

# Extract the largest embedded image (usually the diagram)
for i, img in enumerate(images):
    xref = img[0]
    pix = fitz.Pixmap(doc, xref)
    if pix.n > 4:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    out_path = f"<output_dir>/{basename}_img{i}_{pix.width}x{pix.height}.png"
    pix.save(out_path)
doc.close()
```

#### 5.4 Analyze diagram with Ollama (GUIDED approach)

**CRITICAL**: Small vision models (≤12B) require **guided prompts** — provide known vocabulary/names from the project context. Without guidance, they hallucinate.

**Strategy**:
1. First, gather context (e.g., directory names, module names, component names from the codebase)
2. Then ask the model to confirm which elements it sees and describe relationships

```python
import requests
import base64

def analyze_diagram_guided(image_path, known_names, context_description):
    """
    Analyze a diagram using Ollama vision with guided prompts.
    
    Args:
        image_path: Path to the PNG image
        known_names: List of known element names from codebase
        context_description: What this diagram represents
    """
    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    names_list = "\n".join(f"- {name}" for name in known_names)

    prompt = f"""This is a dependency diagram showing: {context_description}

Here is the list of known elements that MAY appear in this diagram:
{names_list}

Task: Look at the diagram and tell me:
1. Which of these elements appear as boxes in the diagram?
2. What are the arrows between them? (source -> target)
3. Are there any labels on the arrows?

Only report what you SEE. Use the exact names from the list above."""

    resp = requests.post("http://localhost:11434/api/generate", json={
        "model": "gemma3:4b",  # or gemma3:12b, gemma3:27b
        "prompt": prompt,
        "images": [img_b64],
        "stream": False,
        "options": {"temperature": 0.0, "num_predict": 4000}
    })
    return resp.json().get("response", "NO RESPONSE")
```

**Example — extracting CGT dependencies:**
```python
# 1. Get known names from filesystem
import os
cgt_dirs = [d for d in os.listdir("input/modules_to_migrate/GERE-EditBusinessRule/")
            if d.startswith("cgt-")]

# 2. Call with guided prompt
result = analyze_diagram_guided(
    "diagram.png",
    known_names=cgt_dirs,
    context_description="dependencies between CGTs in GERE-EditBusinessRule module"
)
```

#### 5.5 When guided approach is not possible

If no context is available to guide the model:
1. Try with the largest available model (≥12B)
2. Use a two-step approach: first ask "how many boxes do you see?", then "list the text in each box"
3. If results are inconsistent, mark as `confidence: low` and flag for manual review

#### 5.6 Output format for vision-extracted diagrams

```markdown
---
source: <pdf_path>
pages: 1
converted_at: <timestamp>
converter: pymupdf+ollama(<model_name>)
tag: <tag>
confidence: nodes=high(validated), relationships=medium(vision-inferred)
---

# <Title>

> Extracted via local vision (Ollama <model>). 
> Nodes validated against source code. Relationships inferred by vision model.

## Nodes
| # | Name | Description |
...

## Relationships
```mermaid
graph TD
    A --> B
    ...
`` `

## Original Image
![<title>](<image.png>)
```

### 6. Handle embedded images (non-diagram)

For PDFs with important diagrams or charts:
1. Extract images using `pdfplumber` page images
2. If LLM has vision capabilities, describe each image
3. Insert image descriptions inline in the Markdown

### 7. Verify and report

```
📄 PDF converted: requirements.pdf
├── Pages: 42
├── Output: .discovery/knowledge/requirements.md (text)
├── Tables: .discovery/knowledge/requirements.tables.json (8 tables)
├── OCR: not needed (text-based PDF)
└── Size: 2,847 lines extracted
```

## Guardrails

- **DO NOT modify the source PDF** — read-only
- **Preserve structure** — maintain headings, lists, tables as much as possible
- **Frontmatter required** — every output must include source, pages, converter, and conversion date
- **Large PDFs** — for PDFs >100 pages, report progress every 25 pages
- **Encoding** — handle non-ASCII characters properly (UTF-8)
- **Fallback chain** — pdfplumber → Tesseract OCR → Ollama vision (guided) → warn user
- **Confidence tagging** — vision-extracted content MUST include confidence level in frontmatter
- **Guided prompts** — for models ≤12B, ALWAYS provide known vocabulary from project context
- **No hallucination** — if the model produces repetitive/nonsensical output, stop and mark as failed
- **Model auto-install** — if Ollama is not available and an image-only PDF is detected, offer to install it
