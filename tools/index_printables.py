"""Index every printable under public/printables and compress the oversized PDFs.

Produces src/data/printables.json with area, name, path, size, page count and a
first-page thumbnail (public/images/printables/<hash>.jpg).
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
PRINT = ROOT / "public" / "printables"
THUMBS = ROOT / "public" / "images" / "printables"
OUT = ROOT / "src" / "data" / "printables.json"
MAX_BYTES = 24 * 1024 * 1024  # keep every file under the strictest static-host limit


def compress_pdf(path: Path) -> None:
    """Re-render an image-heavy PDF as JPEG pages until it fits under MAX_BYTES."""
    size = path.stat().st_size
    if size <= MAX_BYTES:
        return
    doc = pymupdf.open(path)
    n = len(doc)
    for dpi, quality in ((110, 72), (96, 65), (80, 60), (72, 50), (60, 45)):
        out = pymupdf.open()
        for page in doc:
            pix = page.get_pixmap(dpi=dpi, colorspace=pymupdf.csRGB, alpha=False)
            img = pix.tobytes("jpeg", jpg_quality=quality)
            rect = page.rect
            np_ = out.new_page(width=rect.width, height=rect.height)
            np_.insert_image(rect, stream=img)
        tmp = path.with_suffix(".tmp.pdf")
        out.save(tmp, garbage=4, deflate=True)
        out.close()
        new_size = tmp.stat().st_size
        print(f"  {path.name}: {size/1e6:.0f} MB -> {new_size/1e6:.1f} MB at {dpi} dpi q{quality} ({n} pages)")
        if new_size <= MAX_BYTES:
            doc.close()
            path.unlink()
            tmp.rename(path)
            return
        tmp.unlink()
    doc.close()
    print(f"  WARNING could not get {path.name} under limit", file=sys.stderr)


def nice_name(stem: str) -> str:
    s = re.sub(r"^\d+\.\s*", "", stem)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def main() -> None:
    THUMBS.mkdir(parents=True, exist_ok=True)
    items = []
    for f in sorted(PRINT.rglob("*")):
        if not f.is_file():
            continue
        if f.suffix.lower() not in (".pdf", ".png", ".jpg", ".jpeg"):
            continue
        rel = f.relative_to(PRINT)
        area = rel.parts[0]
        if f.suffix.lower() == ".pdf":
            compress_pdf(f)
        size = f.stat().st_size
        pages = 0
        thumb = ""
        h = hashlib.md5(str(rel).encode()).hexdigest()[:10]
        try:
            if f.suffix.lower() == ".pdf":
                doc = pymupdf.open(f)
                pages = len(doc)
                pix = doc[0].get_pixmap(dpi=40, colorspace=pymupdf.csRGB, alpha=False)
                tp = THUMBS / f"{h}.jpg"
                pix.save(tp, jpg_quality=70)
                thumb = f"/images/printables/{h}.jpg"
                doc.close()
            else:
                pages = 1
                pix = pymupdf.Pixmap(str(f))
                if pix.n - pix.alpha >= 4:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                if pix.alpha:
                    pix = pymupdf.Pixmap(pix, 0)
                scale = 300 / max(pix.width, 1)
                if scale < 1:
                    pix = pymupdf.Pixmap(pix, int(pix.width * scale), int(pix.height * scale), None) if hasattr(pymupdf.Pixmap, "__call__") else pix
                tp = THUMBS / f"{h}.jpg"
                pix.save(tp, jpg_quality=70)
                thumb = f"/images/printables/{h}.jpg"
        except Exception as exc:  # thumbnails are optional
            print("  thumb failed", rel, exc, file=sys.stderr)
        sub = "/".join(rel.parts[1:-1])
        items.append({
            "id": h,
            "area": area,
            "group": re.sub(r"^\d+\.\s*", "", sub.split("/")[0]) if sub else "",
            "subgroup": re.sub(r"^\d+\.\s*", "", sub.split("/")[1]) if sub and "/" in sub else "",
            "name": nice_name(f.stem),
            "file": "/printables/" + rel.as_posix(),
            "ext": f.suffix.lower().lstrip("."),
            "bytes": size,
            "pages": pages,
            "thumb": thumb,
        })
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(i["bytes"] for i in items)
    print(f"indexed {len(items)} printables, {total/1e6:.0f} MB total, largest {max(i['bytes'] for i in items)/1e6:.1f} MB")


if __name__ == "__main__":
    main()
