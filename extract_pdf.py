import fitz
import pdfplumber
import json

path = r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\Servicemanagement English 25 with processes.pdf"
out = []

doc = fitz.open(path)
out.append(f"pages: {doc.page_count}")

for i in range(min(5, doc.page_count)):
    t = doc[i].get_text()
    out.append(f"=== FITZ PAGE {i+1} len={len(t)} ===")
    out.append(t[:4000] if t else "(empty)")

with pdfplumber.open(path) as pdf:
    for i in range(min(5, len(pdf.pages))):
        t = pdf.pages[i].extract_text() or ""
        out.append(f"=== PLUMBER PAGE {i+1} len={len(t)} ===")
        out.append(t[:4000] if t else "(empty)")

page = doc[0]
imgs = page.get_images()
out.append(f"images on page 1: {len(imgs)}")

with open(r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\pdf_sample.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print("done")