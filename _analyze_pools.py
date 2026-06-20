import json, re
from pathlib import Path
Q = json.loads(Path("data/questions.json").read_text(encoding="utf-8"))
so = [q for q in Q if q.get("topic") == "Service Operation"]
print("Service Operation total:", len(so))
desk_p = r"service desk|help desk|follow the sun|virtual service desk|first.line|first line|local service desk"
req_p = r"service request|request fulfil|request fulfill|request fulfillment|standard request"
for label, p in [("desk", desk_p), ("req", req_p)]:
    m = [q for q in so if re.search(p, q["question"], re.I)]
    print(label, len(m))
unmatched = [q for q in so if not re.search(desk_p, q["question"], re.I) and not re.search(req_p, q["question"], re.I)]
print("unmatched SO:", len(unmatched))
for q in unmatched:
    print(" ", q["id"], q["question"][:90])