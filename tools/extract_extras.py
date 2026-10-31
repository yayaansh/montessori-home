"""Extract the etymological dictionary, the experiments and the word problems into JSON."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "source-material"
PRINT = ROOT / "public" / "printables"
OUT = ROOT / "src" / "data"
TMP = ROOT / "tools" / ".tmp"

LANGS = (
    "Latin|Greek|Phoenician|Celtic\\+Latin|Celtic|Old English|French|Italian|Arabic|German|Spanish|"
    "Sanskrit|Hebrew|Old Norse|Norse|Middle English|Dutch|Persian|Portuguese|Egyptian"
)
DEF_SPLIT = re.compile(rf"(?=(?<![+\w])(?:{LANGS})\s*:|Old name for Wales|For the region of Perm)")
WORD_TOKEN = re.compile(r"[A-Za-z][A-Za-z-]*(?:\s\([^)]*\))?")

MANUAL_WORD_FIX = {
    # the second "viscous" in the source is a typo for the entry defined as Latin vox "voice"
    ("viscous", 2): "vowel",
}


# --------------------------------------------------------------------------- dictionary


def dictionary() -> list[dict]:
    TMP.mkdir(exist_ok=True)
    shutil.copyfile(SRC / "[SCREEN VERSION] Montessori Etymological Dictionary.pdf", TMP / "dictionary.pdf")
    subprocess.run(
        ["pdftotext", "-enc", "UTF-8", str(TMP / "dictionary.pdf"), str(TMP / "dictionary.txt")], check=True
    )
    pages_text = (TMP / "dictionary.txt").read_text(encoding="utf-8", errors="replace").split("\f")
    words: list[str] = []
    def_lines: list[str] = []
    seen_count: dict[str, int] = {}
    for raw in pages_text:
        lines = [ln.strip() for ln in raw.split("\n")]
        marker = next((i for i, ln in enumerate(lines) if "Page |" in ln), None)
        if marker is None:
            continue  # title page
        lines[marker] = lines[marker].split("Page |")[0]
        for ln in lines:
            ln = ln.strip()
            if not ln or re.fullmatch(r"[A-Z](-[A-Z])?", ln):
                continue
            is_def = (":" in ln or "“" in ln or '"' in ln
                      or ln.startswith(("Old name for Wales", "For the region of Perm", "between France")))
            if is_def:
                def_lines.append(ln)
                continue
            for tok in WORD_TOKEN.findall(ln):
                tok = tok.strip()
                seen_count[tok] = seen_count.get(tok, 0) + 1
                words.append(MANUAL_WORD_FIX.get((tok, seen_count[tok]), tok))
    pending_def = " ".join(def_lines)
    parts = [p.strip() for p in DEF_SPLIT.split(pending_def) if p.strip()]
    entries = []
    for i, w in enumerate(words):
        d = parts[i] if i < len(parts) else ""
        m = re.match(rf"^((?:{LANGS}))\s*:\s*(.*)$", d)
        if m:
            lang, rest = m.group(1), m.group(2)
        else:
            lang, rest = "", d
        rm = re.match(r"^(.*?)\s*:\s*(.*)$", rest) if m else None
        if rm:
            root, meaning = rm.group(1).strip(), rm.group(2).strip()
        else:
            root, meaning = "", rest.strip()
        meaning = meaning.replace("“", "").replace("”", "").replace('"', "").strip()
        meaning = re.sub(r"\s+", " ", meaning)
        entries.append({"word": w, "language": lang.replace("+", " + "), "root": root, "meaning": meaning})
    if len(words) != len(parts):
        print(f"WARNING dictionary: {len(words)} words vs {len(parts)} definitions", file=sys.stderr)
    return entries


# --------------------------------------------------------------------------- experiments


def experiments() -> list[dict]:
    """The PDF text layer is identical on every page in MuPDF, so use pdftotext (xpdf)."""
    TMP.mkdir(exist_ok=True)
    shutil.copyfile(PRINT / "Experiments" / "Experiments.pdf", TMP / "experiments.pdf")
    subprocess.run(
        ["pdftotext", "-layout", "-enc", "UTF-8", str(TMP / "experiments.pdf"), str(TMP / "experiments.txt")],
        check=True,
    )
    pages = (TMP / "experiments.txt").read_text(encoding="utf-8", errors="replace").split("\f")
    exps: list[dict] = []
    for raw in pages:
        lines = [ln.rstrip() for ln in raw.split("\n")]
        lines = [ln for ln in lines if ln.strip() and not re.match(r"\s*Experiment no\.?\s*\d+", ln)]
        if not lines:
            continue
        title = lines[0].strip()
        try:
            ex_idx = next(i for i, ln in enumerate(lines) if re.match(r"\s*Explanation\s*:?\s*$", ln))
        except StopIteration:
            ex_idx = len(lines)
        first = lines[1:ex_idx]
        if first and first[-1].strip() == title:
            first = first[:-1]
        explanation_lines = lines[ex_idx + 1:]
        materials: list[str] = []
        proc: list[str] = []
        mode = None
        for ln in first:
            t = ln.strip()
            if re.match(r"Materials? required", t, re.I):
                mode = "m"
                continue
            if re.match(r"Procedure", t, re.I):
                mode = "p"
                continue
            if mode == "m":
                t = re.sub(r"^[-•]\s*", "", t)
                if t:
                    materials.append(t)
            elif mode == "p":
                proc.append(t)
        procedure = re.sub(r"\s+", " ", " ".join(proc)).strip()
        procedure = re.sub(r"\s(?=\d\.\s)", "\n", procedure)
        explanation = re.sub(r"\s+", " ", " ".join(l.strip() for l in explanation_lines)).strip()
        explanation = re.sub(r"\s(?=\d\.\s)", "\n", explanation)
        exps.append({
            "number": len(exps) + 1,
            "title": title,
            "materials": materials,
            "procedure": procedure,
            "explanation": explanation,
        })
    return exps


# --------------------------------------------------------------------------- word problems


def word_problems() -> list[dict]:
    base = PRINT / "Arithmetic" / "Word problems (Mathematics)"
    sets: list[dict] = []
    for pdf in sorted(base.rglob("*.pdf")):
        doc = pymupdf.open(pdf)
        header = ""
        problems: list[dict] = []
        for page in doc:
            blocks = sorted(page.get_text("blocks"), key=lambda b: (round(b[1]), b[0]))
            for b in blocks:
                text = re.sub(r"\s+", " ", b[4]).strip()
                if not text:
                    continue
                if re.fullmatch(r"\d{1,2}", text):
                    continue
                looks_header = "?" not in text and len(text) < 80 and (("/" in text or ":" in text or "(" in text) or b[0] > 380)
                if looks_header:
                    header = header or text
                    continue
                if "?" not in text and ("=" in text or len(text) < 90):
                    continue  # a worked solution or stray label, not a problem
                if len(text) < 25 and not re.search(r"\d", text):
                    continue
                if any(p["text"] == text for p in problems):
                    continue
                problems.append({"n": len(problems) + 1, "text": text})
        rel = pdf.relative_to(PRINT).as_posix()
        parts = pdf.relative_to(base).parts[:-1]
        topic = " - ".join(re.sub(r"^\d+\.\s*", "", p) for p in parts) or "General"
        name = pdf.stem.replace("Word Problems", "").replace("Word problems", "").strip(" -")
        name = re.sub(r"\s+", " ", name)
        # drop the topic words repeated in the file name ("Passage to Abstraction Addition" -> "Addition")
        rest = name
        for part in topic.split(" - "):
            rest = re.sub(re.escape(part), "", rest, flags=re.I)
        rest = re.sub(r"\s+", " ", rest).strip(" -")
        rest = re.sub(r"^with\s*", "", rest, flags=re.I).strip()
        core = re.sub(r"\([^)]*\)", "", rest).strip()
        if not core or rest.startswith("(") or re.match(r"^and\b", rest, re.I):
            name = f"{topic} {rest}".strip()
        else:
            name = rest[:1].upper() + rest[1:]
        steps = 2 if re.search(r"2-steps|multiple", pdf.stem, re.I) else 1
        sets.append({
            "id": re.sub(r"[^a-z0-9]+", "-", rel.lower().replace("arithmetic/word problems (mathematics)/", "")).strip("-"),
            "topic": topic,
            "name": name or pdf.stem,
            "header": header,
            "steps": steps,
            "file": "/printables/" + rel,
            "problems": problems,
        })
    return sets


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    d = dictionary()
    (OUT / "dictionary.json").write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    print("dictionary entries:", len(d))
    e = experiments()
    (OUT / "experiments.json").write_text(json.dumps(e, ensure_ascii=False, indent=1), encoding="utf-8")
    print("experiments:", len(e))
    w = word_problems()
    (OUT / "wordproblems.json").write_text(json.dumps(w, ensure_ascii=False, indent=1), encoding="utf-8")
    print("word problem sets:", len(w), "problems:", sum(len(s["problems"]) for s in w))


if __name__ == "__main__":
    main()
