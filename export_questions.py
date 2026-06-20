import json
from pathlib import Path
q = json.loads(Path("data/questions.json").read_text(encoding="utf-8"))
out = Path("_all_questions.txt")
lines = []
for item in q:
    opts = " | ".join(f"{o['id']}:{o['text'][:60]}" for o in item["options"])
    lines.append(f"ID:{item['id']}\tTOPIC:{item.get('topic','')}\tCORRECT:{item['correct']}")
    lines.append(f"Q: {item['question']}")
    lines.append(f"O: {opts}")
    lines.append("")
out.write_text("\n".join(lines), encoding="utf-8")
print(len(q), "questions exported")