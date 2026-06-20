"""Build one unique exam set per ITIL practice from questions.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
QUESTIONS = json.loads((ROOT / "data" / "questions.json").read_text(encoding="utf-8"))
QUESTIONS_PER_SET = 15

PRACTICES = [
    ("Continual Improvement", [r"continual improvement|csi register|seven.step|improvement register|continual service improvement"]),
    ("Change Management", [r"change management|change control|\bcab\b|rfc|standard change|normal change|emergency change|remediation plan"]),
    ("Incident Management", [r"incident management|incident manager|restore service|priority matrix|major incident|incident record"]),
    ("Problem Management", [r"problem management|root cause|known error|workaround|problem record"]),
    ("Service Request Management", [r"service request|request fulfil|request fulfill|request fulfillment|standard request"]),
    ("Service Desk", [r"service desk|help desk|follow the sun|virtual service desk|first.line|first line|local service desk"]),
    ("Service Level Management", [r"service level|sla\b|slm\b|olm\b|service target|underpinning contract"]),
]

TOPIC_ALIASES = {
    "Change Management": ["Change Control"],
    "Service Level Management": ["Service Level Mgmt"],
    "Continual Improvement": ["Continual Improvement"],
    "Incident Management": ["Incident Management"],
    "Problem Management": ["Problem Management"],
    "Service Request Management": ["Service Operation"],
    "Service Desk": ["Service Operation"],
}

SET_TITLES = {
    "Continual Improvement": "Continual Improvement",
    "Change Management": "Change Management",
    "Incident Management": "Incident Management",
    "Problem Management": "Problem Management",
    "Service Request Management": "Service Request Management",
    "Service Desk": "Service Desk",
    "Service Level Management": "Service Level Management",
}

SECONDARY = {
    "Continual Improvement": ["Service Level Management", "Change Management"],
    "Change Management": ["Incident Management", "Problem Management"],
    "Incident Management": ["Service Desk", "Problem Management"],
    "Problem Management": ["Incident Management", "Change Management"],
    "Service Request Management": ["Service Desk"],
    "Service Desk": ["Incident Management", "Service Request Management"],
    "Service Level Management": ["Continual Improvement", "Incident Management"],
}


def matches_practice(q, patterns, topics):
    blob = (q["question"] + " " + q.get("topic", "")).lower()
    if q.get("topic") in topics:
        return True
    return any(re.search(p, blob, re.I) for p in patterns)


def pool_for_practice(name, patterns):
    topics = TOPIC_ALIASES.get(name, [name])
    return [q["id"] for q in QUESTIONS if matches_practice(q, patterns, topics)]


def pick_unique(used, candidates, limit):
    chosen = []
    for qid in candidates:
        if qid in used or qid in chosen:
            continue
        chosen.append(qid)
        if len(chosen) >= limit:
            break
    return chosen


pools = {name: pool_for_practice(name, pats) for name, pats in PRACTICES}
used_global = set()
exam_sets = []

for index, (practice, _) in enumerate(PRACTICES, start=1):
    primary = pick_unique(used_global, pools[practice], QUESTIONS_PER_SET)
    chosen = list(primary)

    if len(chosen) < QUESTIONS_PER_SET:
        for sec in SECONDARY.get(practice, []):
            extra = pick_unique(used_global | set(chosen), pools.get(sec, []), QUESTIONS_PER_SET - len(chosen))
            chosen.extend(extra)
            if len(chosen) >= QUESTIONS_PER_SET:
                break

    if len(chosen) < QUESTIONS_PER_SET:
        general = [q["id"] for q in QUESTIONS if q.get("topic") == "General ITIL"]
        extra = pick_unique(used_global | set(chosen), general, QUESTIONS_PER_SET - len(chosen))
        chosen.extend(extra)

    chosen = chosen[:QUESTIONS_PER_SET]
    used_global.update(chosen)

    label = f"Set {index:02d}"
    exam_sets.append({
        "id": f"set-{index:02d}",
        "label": label,
        "title": SET_TITLES[practice],
        "practice": practice,
        "questionIds": chosen,
    })

out = ROOT / "data" / "exam-sets.json"
out.write_text(json.dumps(exam_sets, indent=2), encoding="utf-8")

all_ids = [qid for s in exam_sets for qid in s["questionIds"]]
unique_ids = set(all_ids)
print(f"Wrote {len(exam_sets)} sets ({len(unique_ids)} unique questions, {len(all_ids) - len(unique_ids)} repeats)")
for s in exam_sets:
    primary_hits = sum(1 for qid in s["questionIds"] if qid in pools[s["practice"]])
    print(f"  {s['label']}: {s['practice']} — {len(s['questionIds'])} Q ({primary_hits} primary)")