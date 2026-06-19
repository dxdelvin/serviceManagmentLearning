import json
from collections import Counter

PATH = r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\quiz-app\data\questions.json"
q = json.load(open(PATH, encoding="utf-8"))

fallback = sum(1 for x in q if "In ITIL terms:" in x.get("explanation", ""))
generic = sum(1 for x in q if x.get("explanation", "").count("doesn't match") >= 2)

lines = [f"fallback teach: {fallback}", f"mostly generic wrong: {generic}", ""]

opts = []
for x in q:
    if "In ITIL terms:" in x.get("explanation", ""):
        for o in x["options"]:
            opts.append(o["text"][:70])

lines.append("Top unmatched option texts:")
for t, c in Counter(opts).most_common(40):
    lines.append(f"  {c:3d}  {t}")

with open(r"c:\Users\dxdel\Extra Activities\iis-servicemanagment\explain_analysis.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("done", fallback, generic)