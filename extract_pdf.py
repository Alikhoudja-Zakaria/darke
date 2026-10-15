import json
import os

transcript_path = r'C:\Users\surface laptop 4\.gemini\antigravity\brain\daefdd36-a490-4a59-8653-16c1fd986454\.system_generated\logs\transcript_full.jsonl'
output_path = 'raw_pdf.txt'

found = False
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        content = data.get('content', '')
        if '==Start of PDF==' in content:
            print(f"Found in type: {data['type']}")
            start = content.find('==Start of PDF==')
            end = content.find('==End of PDF==')
            if start != -1 and end != -1:
                pdf_text = content[start:end]
                with open(output_path, 'w', encoding='utf-8') as out:
                    out.write(pdf_text)
                print(f"Wrote {len(pdf_text)} chars to {output_path}")
                found = True
                break

if not found:
    print("Could not find PDF text.")
