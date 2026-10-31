import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "data"
d = json.load(open(ROOT / "dictionary.json", encoding="utf-8"))
bad = [e for e in d if not e["meaning"]]
print("dict", len(d), "missing meaning", len(bad), [e["word"] for e in bad][:10])
for e in d[:3] + d[13:17] + d[-8:]:
    print(e)
e = json.load(open(ROOT / "experiments.json", encoding="utf-8"))
print([x["title"] for x in e])
print(e[3])
w = json.load(open(ROOT / "wordproblems.json", encoding="utf-8"))
for s in w:
    if len(s["problems"]) != 15:
        print("ODD", s["id"], len(s["problems"]))
print(w[-1]["topic"], "|", w[-1]["name"], "|", w[-1]["header"], w[-1]["problems"][0])
print(w[20]["topic"], "|", w[20]["name"], "|", w[20]["header"], w[20]["problems"][14]["text"][:80])
