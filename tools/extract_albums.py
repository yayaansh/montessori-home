"""Extract lesson trees from the Montessori Elementary album PDFs.

Outputs one JSON file per album into src/data/albums/ and album pictures into
public/images/albums/<album>/.  Run from anywhere: paths are resolved from this file.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "source-material"
OUT_DATA = ROOT / "src" / "data" / "albums"
OUT_IMG = ROOT / "public" / "images" / "albums"
TMP = ROOT / "tools" / ".tmp"

ALBUMS = [
    # id, display name, header word used on every page, file, mode
    ("arithmetic", "Arithmetic", "Arithmetic", "888151619-Elementary-Arithmetic-album-for-montessori-elementary.pdf", "toc"),
    ("geometry", "Geometry", "Geometry", "(Elementary) Geometry album.pdf", "outline"),
    ("language", "Language", "Language", "(Elementary) Language album.pdf", "outline"),
    ("biology", "Biology", "Biology", "(Elementary) Biology album.pdf", "outline"),
    ("geography", "Geography", "Geography", "(Elementary) Geography album.pdf", "outline"),
    ("history", "History", "History", "(Elementary) History album.pdf", "outline"),
    ("art", "Art", "Art", "(Elementary) Art album.pdf", "outline"),
    ("theory", "Theory", "Psychology/Theory", "(Elementary) Psychology_Theory album.pdf", "outline"),
]

FOOTER_LINES = {
    "the 58th elementary international course, bergamo, italy",
    "stefan jaleru",
}

LABEL_RE = re.compile(
    r"^(?P<label>"
    r"materials?( and description| needed| required| description)?|material and description|"
    r"presentations?|direct aims?|indirect aims?|aims?|age(/cycle)?|age/cycles?|"
    r"follow[- ]?ups?( activities| activity| exercises| exercise| presentations| work| games)?|"
    r"further explorations?|further activities|further exploration|extensions?|etymolog(y|ies)|"
    r"observations?|introduction|pre-?requisites?|points? of interest|control of error|notes?|"
    r"conclusions?|variations?|vocabulary|games?|exercises?|activities|purpose|preparation|"
    r"procedure|explanation|language|story|description|presentation of the material|"
    r"presentation of the lesson|the story|parallel activities|extension|key lesson|comments?|"
    r"materials and description|material description|aim|special note|remarks?"
    r")\s*:?\s*$",
    re.IGNORECASE,
)

KIND_BY_LABEL = [
    (re.compile(r"^material", re.I), "materials"),
    (re.compile(r"^presentation", re.I), "presentation"),
    (re.compile(r"^direct aim", re.I), "directAim"),
    (re.compile(r"^indirect aim", re.I), "indirectAim"),
    (re.compile(r"^aims?$", re.I), "directAim"),
    (re.compile(r"^age", re.I), "age"),
    (re.compile(r"^follow", re.I), "followUp"),
    (re.compile(r"^further", re.I), "followUp"),
    (re.compile(r"^extension", re.I), "extension"),
    (re.compile(r"^etymolog", re.I), "etymology"),
    (re.compile(r"^observation", re.I), "observations"),
    (re.compile(r"^introduction", re.I), "introduction"),
    (re.compile(r"^pre-?requisite", re.I), "prerequisites"),
    (re.compile(r"^points? of interest", re.I), "pointsOfInterest"),
    (re.compile(r"^control of error", re.I), "controlOfError"),
    (re.compile(r"^note", re.I), "notes"),
    (re.compile(r"^conclusion", re.I), "conclusion"),
    (re.compile(r"^(games?|exercises?|activities|variations?|parallel)", re.I), "activities"),
    (re.compile(r"^(story|the story)", re.I), "story"),
    (re.compile(r"^(explanation|procedure|purpose|preparation)", re.I), "other"),
]


def kind_for(label: str) -> str:
    for rx, kind in KIND_BY_LABEL:
        if rx.search(label):
            return kind
    return "other"


def norm(s: str) -> str:
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = s.replace("–", "-").replace("—", "-").replace("�", "'")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def fix_unknown(text: str) -> str:
    """pdftotext emits U+FFFD for curly quotes/dashes whose encoding it cannot read."""
    def repl(m):
        before = m.group(1)
        after = m.group(2)
        if before.isalnum() and after.isalnum():
            return before + "'" + after
        if before == " " and after == " ":
            return before + "-" + after
        if (before in " (" or before == "") and after.isalnum():
            return before + "“" + after
        if before.isalnum() or before in ".,!?)":
            return before + "”" + after
        return before + "'" + after
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r"(.?)�(.?)", repl, text, count=1)
    return text


SYMBOL_MAP = {
    "": "≈", "": "∴", "": "∼", "": "≅", "": "°",
    "": "×", "": "÷", "": "≤", "": "≥", "": "≠",
    "": "→", "": "√", "": "∞", "": "±", "": "°",
    "": "″", "": "′", "": "∠", "": "⊥", "": "∣",
    "": "", "": "•", "": "•", "": "•",
}


def fix_symbols(text: str) -> str:
    """Replace Symbol-font private-use glyphs that pdftotext leaves behind."""
    for k, v in SYMBOL_MAP.items():
        text = text.replace(k, v)
    return re.sub(r"[-]", "", text)


def slug(s: str) -> str:
    s = norm(s).replace(" ", "-")
    return s[:60].strip("-") or "node"


# --------------------------------------------------------------------------- text


def pdf_pages_text(pdf: Path, simple_name: str) -> list[list[str]]:
    """Return per-page lists of lines using pdftotext -layout (xpdf)."""
    TMP.mkdir(parents=True, exist_ok=True)
    tmp_pdf = TMP / simple_name
    if not tmp_pdf.exists() or tmp_pdf.stat().st_size != pdf.stat().st_size:
        shutil.copyfile(pdf, tmp_pdf)
    tmp_txt = TMP / (simple_name + ".txt")
    subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", str(tmp_pdf), str(tmp_txt)], check=True)
    raw = tmp_txt.read_text(encoding="utf-8", errors="replace")
    pages = raw.split("\f")
    if pages and not pages[-1].strip():
        pages = pages[:-1]
    return [p.split("\n") for p in pages]


def clean_page(lines: list[str], header: str) -> list[str]:
    out = []
    h = header.lower()
    for ln in lines:
        s = ln.strip().lower()
        if not s:
            out.append(ln)
            continue
        if s == h or s in FOOTER_LINES:
            continue
        out.append(ln)
    return out


# --------------------------------------------------------------------------- nodes


@dataclass
class Node:
    title: str
    depth: int
    page: int  # 0-based page where the node is expected to start
    idx: int = 0  # document order
    start: int | None = None  # global line index of title line
    end: int | None = None  # global line index (exclusive)
    located: bool = False
    children: list["Node"] = field(default_factory=list)
    parent: "Node | None" = None
    sections: list[dict] = field(default_factory=list)
    images: list[str] = field(default_factory=list)
    id: str = ""


def flatten_outline(reader: PdfReader) -> list[Node]:
    nodes: list[Node] = []

    def walk(items, depth):
        for it in items:
            if isinstance(it, list):
                walk(it, depth + 1)
            else:
                try:
                    p = reader.get_destination_page_number(it)
                except Exception:
                    p = nodes[-1].page if nodes else 0
                title = fix_unknown(re.sub(r"[-▪•·]+\s*", "", str(it.title)).strip())
                nodes.append(Node(title=title, depth=depth, page=int(p)))

    walk(reader.outline, 0)
    return nodes


def parse_toc(pages: list[list[str]], first_body_title: str) -> tuple[list[Node], int, int]:
    """Parse the indented table of contents of the Arithmetic album.

    Returns nodes (pages unknown), plus (page_index, line_index) where the body starts.
    """
    entries: list[tuple[int, str]] = []
    seen_marker = 0
    body_pos = (len(pages), 0)
    target = norm(first_body_title)
    done = False
    for pi, lines in enumerate(pages[1:], start=1):
        for li, ln in enumerate(lines):
            t = re.split(r"\s{3,}", ln.strip())[0].strip()
            if not t:
                continue
            if norm(t) == target and pi >= 3 and li <= 4:
                body_pos = (pi, li)
                done = True
                break
            if norm(t) in ("table of contents arithmetic", "arithmetic album"):
                continue
            indent = len(ln) - len(ln.lstrip())
            # wrapped continuation of previous entry (starts lowercase, same indent)
            if entries and t[0].islower() and indent >= entries[-1][0]:
                entries[-1] = (entries[-1][0], entries[-1][1] + " " + t)
                continue
            entries.append((indent, t))
        if done:
            break
    indents = sorted({i for i, _ in entries})
    depth_of = {ind: k for k, ind in enumerate(indents)}
    nodes = [Node(title=fix_unknown(t), depth=depth_of[i], page=-1) for i, t in entries]
    return nodes, body_pos[0], body_pos[1]


def build_tree(nodes: list[Node]) -> list[Node]:
    roots: list[Node] = []
    stack: list[Node] = []
    for n in nodes:
        while stack and stack[-1].depth >= n.depth:
            stack.pop()
        if stack:
            n.parent = stack[-1]
            stack[-1].children.append(n)
        else:
            roots.append(n)
        stack.append(n)
    return roots


def title_matches(line: str, nxt: str, title: str) -> bool:
    nt = norm(title)
    if not nt:
        return False
    nl = norm(line)
    if not nl:
        return False
    if nl == nt:
        return True
    if len(nl) > 140:
        return False
    # wrapped heading across two lines
    if nxt:
        joined = norm(line + " " + nxt)
        if joined == nt:
            return True
        if len(nt) > 25 and SequenceMatcher(None, joined, nt).ratio() >= 0.92:
            return True
    if len(nt) > 12 and SequenceMatcher(None, nl, nt).ratio() >= 0.9:
        return True
    # title is a prefix of the line (e.g. "Presentation" vs "Presentation of the material")
    return False


def locate_nodes(nodes: list[Node], pages: list[list[str]], page_offsets: list[int], glines: list[str],
                 body_start: int, sequential: bool) -> None:
    prev_start = body_start - 1
    for n in nodes:
        if sequential:
            lo = prev_start + 1
            hi = min(len(glines), lo + 60 * 60)  # at most ~60 pages ahead
        else:
            lo = max(page_offsets[n.page], prev_start + 1)
            hi = page_offsets[n.page + 2] if n.page + 2 < len(page_offsets) else len(glines)
            if hi <= lo:
                hi = min(len(glines), lo + 120)
        found = None
        for i in range(lo, hi):
            nxt = glines[i + 1] if i + 1 < len(glines) else ""
            if title_matches(glines[i], nxt, n.title):
                found = i
                break
        if found is None:
            n.start = max(prev_start + 1, page_offsets[n.page] if n.page >= 0 else prev_start + 1)
            n.located = False
        else:
            n.start = found
            n.located = True
            # skip the heading line(s)
            if norm(glines[found]) != norm(n.title) and found + 1 < len(glines) and norm(glines[found] + " " + glines[found + 1]) == norm(n.title):
                n.start = found + 1
        prev_start = n.start
    for a, b in zip(nodes, nodes[1:]):
        a.end = b.start
    if nodes:
        nodes[-1].end = len(glines)


# --------------------------------------------------------------------------- blocks

BULLET_RE = re.compile(r"^(?:[-–•▪·]|o)\s*(.+)$")
SUBBULLET_RE = re.compile(r"^(?:o|▪|•|·|◦|[])\s*(.+)$")


def parse_blocks(lines: list[str]) -> list[dict]:
    blocks: list[dict] = []
    cur: dict | None = None
    prev_blank = True
    for raw in lines:
        s = raw.rstrip()
        t = s.strip()
        if not t:
            prev_blank = True
            if cur and cur["type"] == "para":
                cur = None
            continue
        indent = len(s) - len(s.lstrip())
        if LABEL_RE.match(t) and len(t) <= 60:
            blocks.append({"type": "label", "text": t.rstrip(":")})
            cur = None
            prev_blank = False
            continue
        m = BULLET_RE.match(t)
        if m:
            level = 1 if SUBBULLET_RE.match(t) else 0
            if level == 0 and cur and cur["type"] == "item" and cur["level"] == 1 and indent > cur["indent"]:
                # a dash bullet nested deeper than an 'o' bullet
                level = 2
            cur = {"type": "item", "level": level, "indent": indent, "text": m.group(1).strip()}
            blocks.append(cur)
            prev_blank = False
            continue
        if cur and cur["type"] == "item" and indent > cur["indent"]:
            prev_text = cur["text"]
            ends_sentence = prev_text.endswith((".", "!", "?", ":", ")", '"', "”"))
            looks_sub = t[0].isupper() and len(t) <= 60 and not t.endswith((".", ",", ";"))
            very_short = len(t.split()) <= 4 and len(t) <= 30
            named_part = re.match(r"^(Game|Exercise|Activity|Step|Part|Stage|Variation|Chart|Series|Period|Level|Phase|Story|Lesson|Day|Round|Version)", t)
            if not (ends_sentence and looks_sub and (prev_blank or very_short or named_part)):
                cur["text"] = (prev_text + " " + t).strip()
                prev_blank = False
                continue
            blocks.append({"type": "sub", "text": t})
            cur = None
            prev_blank = False
            continue
        # sub-heading heuristic: short, standalone, title-like
        is_short = len(t) <= 70 and len(t.split()) <= 10
        title_like = t[0].isupper() and not t.endswith((".", ",", ";")) and not re.search(r"\b(the|a|an|of|to|and|with|in|on)$", t, re.I)
        named_part = re.match(r"^(Game|Exercise|Activity|Step|Part|Stage|Variation|Chart|Series|Period|Level|Phase|Lesson|Day|Round|Version)\b[^.]{0,60}$", t)
        if is_short and title_like and (prev_blank or named_part) and (cur is None or named_part):
            blocks.append({"type": "sub", "text": t})
            cur = None
            prev_blank = False
            continue
        if cur and cur["type"] == "para":
            cur["text"] = cur["text"] + " " + t
        else:
            cur = {"type": "para", "text": t}
            blocks.append(cur)
        prev_blank = False
    # tidy
    out = []
    for b in blocks:
        b["text"] = re.sub(r"\s+", " ", b["text"]).strip()
        b["text"] = fix_symbols(fix_unknown(b["text"]))
        if b["type"] == "item":
            b.pop("indent", None)
        if b["text"]:
            out.append(b)
    # merge a 'sub' that is immediately followed by a 'para' that starts lowercase (false positive)
    merged: list[dict] = []
    for b in out:
        if merged and merged[-1]["type"] == "sub" and b["type"] == "para" and b["text"][0].islower():
            merged[-1] = {"type": "para", "text": merged[-1]["text"] + " " + b["text"]}
        else:
            merged.append(b)
    return merged


def blocks_to_sections(blocks: list[dict]) -> list[dict]:
    sections: list[dict] = []
    cur = {"label": "", "kind": "intro", "blocks": []}
    for b in blocks:
        if b["type"] == "label":
            if cur["blocks"] or cur["label"]:
                sections.append(cur)
            cur = {"label": b["text"], "kind": kind_for(b["text"]), "blocks": []}
        else:
            cur["blocks"].append(b)
    if cur["blocks"] or cur["label"]:
        sections.append(cur)
    return [s for s in sections if s["blocks"] or s["label"]]


# --------------------------------------------------------------------------- images


def extract_images(reader: PdfReader, album_id: str, page_to_node: dict[int, Node]) -> int:
    out_dir = OUT_IMG / album_id
    out_dir.mkdir(parents=True, exist_ok=True)
    seen: dict[str, str] = {}
    page_count_by_hash: dict[str, int] = {}
    saved = 0
    per_page: list[tuple[int, str]] = []
    for pi, page in enumerate(reader.pages):
        try:
            imgs = page.images
        except Exception:
            continue
        for im in imgs:
            try:
                pil = im.image
                if pil is None:
                    continue
                w, h = pil.size
                if w < 110 or h < 110:
                    continue
                if pil.mode not in ("RGB", "RGBA", "L", "P"):
                    pil = pil.convert("RGB")
                buf = io.BytesIO()
                pil.convert("RGB").save(buf, format="JPEG", quality=82, optimize=True)
                data = buf.getvalue()
                hsh = hashlib.md5(data).hexdigest()[:12]
                page_count_by_hash[hsh] = page_count_by_hash.get(hsh, 0) + 1
                if hsh not in seen:
                    fn = f"{hsh}.jpg"
                    (out_dir / fn).write_bytes(data)
                    seen[hsh] = fn
                    saved += 1
                per_page.append((pi, hsh))
            except Exception:
                continue
    # drop decorative images that repeat on many pages (logos)
    for pi, hsh in per_page:
        if page_count_by_hash[hsh] > 6:
            continue
        node = page_to_node.get(pi)
        if node is None:
            continue
        url = f"/images/albums/{album_id}/{seen[hsh]}"
        if url not in node.images:
            node.images.append(url)
    for hsh, cnt in page_count_by_hash.items():
        if cnt > 6:
            try:
                (out_dir / seen[hsh]).unlink()
                saved -= 1
            except Exception:
                pass
    return saved


# --------------------------------------------------------------------------- main


def is_lesson(n: Node) -> bool:
    own_kinds = {s["kind"] for s in n.sections}
    if own_kinds & {"materials", "presentation", "directAim", "age"}:
        return True
    for c in n.children:
        if re.match(r"^(presentation|materials?|direct aim)", c.title, re.I):
            return True
    return False


def process(album_id: str, name: str, header: str, filename: str, mode: str) -> dict:
    pdf = SRC / filename
    reader = PdfReader(str(pdf))
    pages = [clean_page(p, header) for p in pdf_pages_text(pdf, f"{album_id}.pdf")]
    page_offsets: list[int] = []
    glines: list[str] = []
    gpage: list[int] = []
    for pi, lines in enumerate(pages):
        page_offsets.append(len(glines))
        glines.extend(lines)
        gpage.extend([pi] * len(lines))
    page_offsets.append(len(glines))

    if mode == "outline":
        nodes = flatten_outline(reader)
        body_start = 0
        sequential = False
    else:
        nodes, bp, bl = parse_toc(pages, "Children's House Arithmetic")
        body_start = page_offsets[bp] + bl
        sequential = True
    for i, n in enumerate(nodes):
        n.idx = i
    roots = build_tree(nodes)
    locate_nodes(nodes, pages, page_offsets, glines, body_start, sequential)

    # ids
    used: set[str] = set()
    for n in nodes:
        base = slug(n.title)
        parent_t = n.parent.title if n.parent else ""
        h = hashlib.md5(f"{n.title}|{parent_t}|{n.depth}".encode()).hexdigest()[:5]
        nid = f"{album_id}.{base}.{h}"
        k = 2
        while nid in used:
            nid = f"{album_id}.{base}.{h}{k}"
            k += 1
        used.add(nid)
        n.id = nid
        n.page = gpage[n.start] if n.start is not None and n.start < len(gpage) else max(n.page, 0)

    # sections
    for n in nodes:
        body = glines[n.start + (1 if n.located else 0): n.end]
        n.sections = blocks_to_sections(parse_blocks(body))

    # images -> deepest node that starts on/before the page
    page_to_node: dict[int, Node] = {}
    by_page_start: dict[int, Node] = {}
    for n in nodes:
        by_page_start.setdefault(n.page, n)
    last = None
    for pi in range(len(pages)):
        if pi in by_page_start:
            last = by_page_start[pi]
        if last is not None:
            page_to_node[pi] = last
    n_img = extract_images(reader, album_id, page_to_node)

    def dump(n: Node) -> dict:
        return {
            "id": n.id,
            "title": n.title,
            "depth": n.depth,
            "page": n.page + 1,
            "lesson": is_lesson(n),
            "sections": n.sections,
            "images": n.images,
            "children": [dump(c) for c in n.children],
        }

    unlocated = sum(1 for n in nodes if not n.located)
    lessons = sum(1 for n in nodes if is_lesson(n))
    data = {
        "id": album_id,
        "name": name,
        "source": filename,
        "pages": len(pages),
        "nodeCount": len(nodes),
        "lessonCount": lessons,
        "roots": [dump(r) for r in roots],
    }
    OUT_DATA.mkdir(parents=True, exist_ok=True)
    (OUT_DATA / f"{album_id}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{name:12s} pages={len(pages):4d} nodes={len(nodes):5d} lessons={lessons:4d} unlocated={unlocated:4d} images={n_img}")
    return data


def main(only: list[str] | None = None) -> None:
    index = []
    for album_id, name, header, filename, mode in ALBUMS:
        if only and album_id not in only:
            continue
        d = process(album_id, name, header, filename, mode)
        index.append({"id": album_id, "name": name, "nodeCount": d["nodeCount"], "lessonCount": d["lessonCount"], "pages": d["pages"]})
    if not only:
        (OUT_DATA / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:] or None)
