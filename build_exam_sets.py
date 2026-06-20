"""Build exam sets from AI-curated per-question practice assignments."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent
QUESTIONS = json.loads((ROOT / "data" / "questions.json").read_text(encoding="utf-8"))
CLASSIFICATIONS = json.loads((ROOT / "data" / "exam-classifications.json").read_text(encoding="utf-8"))

PRACTICE_ORDER = [
    "Continual Improvement",
    "Change Management",
    "Incident Management",
    "Problem Management",
    "Service Request Management",
    "Service Desk",
    "Service Level Management",
]

pools = {name: [] for name in PRACTICE_ORDER}
unassigned = []

for q in QUESTIONS:
    practice = CLASSIFICATIONS.get(str(q["id"]), "NONE")
    if practice in pools:
        pools[practice].append(q["id"])
    else:
        unassigned.append(q["id"])

exam_sets = []
for index, practice in enumerate(PRACTICE_ORDER, start=1):
    exam_sets.append({
        "id": f"set-{index:02d}",
        "label": f"Set {index:02d}",
        "title": practice,
        "practice": practice,
        "questionIds": pools[practice],
    })

out = ROOT / "data" / "exam-sets.json"
out.write_text(json.dumps(exam_sets, indent=2), encoding="utf-8")

total_assigned = sum(len(s["questionIds"]) for s in exam_sets)
lines = [
    f"Wrote {len(exam_sets)} sets from AI classifications",
    f"Assigned: {total_assigned} / {len(QUESTIONS)} questions",
    f"Unassigned (not one of 7 practices): {len(unassigned)}",
    "",
]
for s in exam_sets:
    lines.append(f"  {s['practice']}: {len(s['questionIds'])} questions")
sys.stdout.buffer.write(("\n".join(lines) + "\n").encode("utf-8"))