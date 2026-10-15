import fitz
import json
import re

pdf_path = r"C:\Users\surface laptop 4\Desktop\zakaria choix.pdf"
output_path = "choix_opus_raw.txt"

doc = fitz.open(pdf_path)

clean_text = ""
for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    text = page.get_text("text")
    
    lines = text.split('\n')
    filtered = []
    for line in lines:
        line_s = line.strip()
        if not line_s:
            continue
        if line_s in ["about:blank", "BAC 2026", "7/15/26, 9:20 PM"]:
            continue
        if re.match(r'^\d+/\d+$', line_s):
            continue
        # Also remove headers
        if "Filière" in line_s and "Etablissement" in line_s:
            continue
        if "Note de" in line_s and "classement" in line_s:
            continue
        if "Priorité" in line_s and "Détail de la formation" in line_s:
            continue
        filtered.append(line_s)
    
    clean_text += "\n".join(filtered) + "\n\n"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(clean_text)

print("Saved raw text to", output_path)
