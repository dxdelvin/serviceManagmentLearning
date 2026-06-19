import re
import json
import fitz

PDF = r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\ITIL 4 Übungsfragen aktuell.pdf"
OUT = r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\data\questions.json"

doc = fitz.open(PDF)
full_text = "\n".join(page.get_text() for page in doc)

# Normalize weird PDF characters
full_text = full_text.replace("\ufb01", "fi").replace("\ufb02", "fl")
full_text = full_text.replace("1TIL", "ITIL").replace("oƯ", "off").replace("eƯ", "eff")
full_text = re.sub(r"https://exampracticetests\.com\s*", "", full_text)

def clean_text(s: str) -> str:
    s = s.replace("\ufb01", "fi").replace("\ufb02", "fl")
    s = s.replace("diƯicult", "difficult").replace("oƯ", "off").replace("eƯ", "eff")
    s = s.replace("1TIL", "ITIL")
    return re.sub(r"\s+", " ", s).strip()


# Split on QUESTION markers
blocks = re.split(r"(?=QUESTION\s+\d+)", full_text)
blocks = [b.strip() for b in blocks if re.match(r"QUESTION\s+\d+", b)]

questions = []
for block in blocks:
    m = re.match(r"QUESTION\s+(\d+)\s+(.*)", block, re.DOTALL)
    if not m:
        continue
    qnum = int(m.group(1))
    rest = m.group(2).strip()

    # Extract correct answer
    ans_match = re.search(r"Correct Answer:\s*([A-D])\s*$", rest, re.MULTILINE | re.IGNORECASE)
    if not ans_match:
        ans_match = re.search(r"Correct Answer:\s*([A-D])", rest, re.IGNORECASE)
    if not ans_match:
        print(f"WARN: no answer for Q{qnum}")
        continue
    correct = ans_match.group(1).upper()
    body = rest[: ans_match.start()].strip()

    # Find options A-D
    opt_pattern = re.compile(r"^([A-D])\.\s*(.+)$", re.MULTILINE)
    opts = {}
    opt_positions = []
    for om in opt_pattern.finditer(body):
        opts[om.group(1)] = om.group(2).strip()
        opt_positions.append(om.start())

    if len(opts) < 4:
        print(f"WARN: Q{qnum} only {len(opts)} options")
        continue

    if opt_positions:
        question_text = body[: opt_positions[0]].strip()
    else:
        question_text = body

    question_text = clean_text(question_text)

    options = []
    for letter in "ABCD":
        if letter in opts:
            options.append({"id": letter, "text": clean_text(opts[letter])})

    questions.append({
        "id": qnum,
        "question": question_text,
        "options": options,
        "correct": correct,
    })

questions.sort(key=lambda q: q["id"])
print(f"Parsed {len(questions)} questions")

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Saved to {OUT}")
if questions:
    print("Sample:", json.dumps(questions[0], ensure_ascii=False)[:200])