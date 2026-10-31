"""Integrity checks over the generated app data. Run: python -I tools/check_data.py"""
import collections
import glob
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
DATA = os.path.join(ROOT, "src", "data")

ids = collections.Counter()
stats = {"missing_img": 0, "total_img": 0, "no_content": 0, "lessons": 0}
empty_lessons = []
weird = []
used_images = set()

for f in sorted(glob.glob(os.path.join(DATA, "albums", "*.json"))):
    if f.endswith("index.json"):
        continue
    d = json.load(open(f, encoding="utf-8"))

    def walk(n):
        ids[n["id"]] += 1
        for im in n["images"]:
            stats["total_img"] += 1
            used_images.add(im)
            if not os.path.exists(PUB + im):
                stats["missing_img"] += 1
        if n["lesson"]:
            stats["lessons"] += 1
            if not any(s["blocks"] for s in n["sections"]) and not n["children"]:
                empty_lessons.append((d["id"], n["title"]))
        if not n["sections"] and not n["children"] and not n["images"]:
            stats["no_content"] += 1
        if re.search(r"[�-]", n["title"]):
            weird.append(n["title"])
        for s in n["sections"]:
            for b in s["blocks"]:
                if re.search(r"[�-]", b["text"]):
                    weird.append(b["text"][:60])
        for c in n["children"]:
            walk(c)

    for r in d["roots"]:
        walk(r)

dups = [k for k, v in ids.items() if v > 1]
print("nodes", sum(ids.values()), "lessons", stats["lessons"], "dup ids", len(dups), "images", stats["total_img"], "missing images", stats["missing_img"])
print("empty lessons", len(empty_lessons), empty_lessons[:8])
print("nodes with no content at all", stats["no_content"])
print("weird glyphs", len(weird), weird[:5])

p = json.load(open(os.path.join(DATA, "printables.json"), encoding="utf-8"))
mp = [x["file"] for x in p if not os.path.exists(PUB + x["file"])]
mt = [x["thumb"] for x in p if x["thumb"] and not os.path.exists(PUB + x["thumb"])]
print("printables", len(p), "missing files", mp, "missing thumbs", len(mt))

w = json.load(open(os.path.join(DATA, "wordproblems.json"), encoding="utf-8"))
print("wp sets", len(w), "dup ids", len(w) - len({s["id"] for s in w}), "empty", [s["id"] for s in w if not s["problems"]])
odd = [(s["name"], q["n"], q["text"]) for s in w for q in s["problems"] if len(q["text"]) < 40 or "?" not in q["text"]]
print("odd problems", len(odd), odd[:5])

on_disk = set()
for dp, dn, fn in os.walk(os.path.join(PUB, "images", "albums")):
    for x in fn:
        rel = os.path.relpath(os.path.join(dp, x), PUB).replace(os.sep, "/")
        on_disk.add("/" + rel)
print("album images on disk", len(on_disk), "unused on disk", len(on_disk - used_images))
