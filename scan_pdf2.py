import fitz

path = r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\ITIL 4 Übungsfragen aktuell.pdf"
doc = fitz.open(path)

lines = []
for i in range(doc.page_count):
    t = doc[i].get_text().strip()
    imgs = len(doc[i].get_images())
    lines.append(f"page {i+1:3d}: text_len={len(t):5d} images={imgs}")

with open(r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\pdf2_scan.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

substantial = []
for i in range(doc.page_count):
    t = doc[i].get_text().strip()
    if len(t) > 100:
        substantial.append((i+1, t))

with open(r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\pdf2_text_pages.txt", "w", encoding="utf-8") as f:
    for p, t in substantial:
        f.write(f"\n\n{'='*60}\nPAGE {p}\n{'='*60}\n")
        f.write(t)

print(f"total pages: {doc.page_count}, text pages: {len(substantial)}")