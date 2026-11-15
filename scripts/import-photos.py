#!/usr/bin/env python3
"""Bring photographs into assets/photos/, ready for the site.

    python3 scripts/import-photos.py ~/Pictures/export       # every image in a folder
    python3 scripts/import-photos.py a.jpg b.heic            # or single files

Each image is rotated upright, converted to sRGB, downscaled so its long edge is
at most 2560 px (the largest size the site serves) and saved as JPEG. Metadata is
rebuilt from an allow-list — camera, lens, exposure and capture date, which the
captions use — so GPS, serial numbers, owner names and embedded thumbnails never
reach the repo. HEIC/HEIF is decoded with macOS `sips`. Needs Pillow.
"""
import argparse
import io
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageCms, ImageOps

EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".heic", ".heif"}
EXIF_IFD = 0x8769
KEEP_BASE = (0x010F, 0x0110)  # Make, Model
KEEP_EXIF = (
    0x829A,  # ExposureTime
    0x829D,  # FNumber
    0x8827,  # ISO
    0x9003,  # DateTimeOriginal
    0x920A,  # FocalLength
    0xA405,  # FocalLengthIn35mmFilm
    0xA434,  # LensModel
)


def to_srgb(im):
    """Returns (image, icc profile to embed). Wide-gamut files are converted so
    the colours survive Hugo's resize, which ignores profiles."""
    icc = im.info.get("icc_profile")
    if not icc:
        return im, None
    try:
        src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        if "sRGB" in ImageCms.getProfileDescription(src):
            return im, None
        return ImageCms.profileToProfile(im, src, ImageCms.createProfile("sRGB"), outputMode="RGB"), None
    except Exception as e:  # unreadable profile: keep it embedded rather than guess
        print(f"    colour profile left as is ({e})")
        return im, icc


def clean_exif(im):
    src = im.getexif()
    sub = src.get_ifd(EXIF_IFD)
    out = Image.Exif()
    for tag in KEEP_BASE:
        if tag in src:
            out[tag] = src[tag]
    ifd = out.get_ifd(EXIF_IFD)
    for tag in KEEP_EXIF:
        if tag in sub:
            ifd[tag] = sub[tag]
    return out, sub.get(0x9003, ""), str(src.get(0x0110, "")).strip()


def convert(src, dst, max_edge, quality, tmp):
    path = src
    if src.suffix.lower() in {".heic", ".heif"}:
        path = Path(tmp) / (src.stem + ".jpg")
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "100", str(src), "--out", str(path)],
            check=True, capture_output=True,
        )
    with Image.open(path) as im:
        exif, date, model = clean_exif(im)
        im = ImageOps.exif_transpose(im)
        im, icc = to_srgb(im)
        if im.mode != "RGB":
            im = im.convert("RGB")
        im.thumbnail((max_edge, max_edge), Image.LANCZOS)
        im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True, exif=exif, icc_profile=icc)
        return im.size, date, model


def main():
    root = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("paths", nargs="+", type=Path, help="image files, or folders of them")
    ap.add_argument("--out", type=Path, default=root / "assets" / "photos")
    ap.add_argument("--max", type=int, default=2560, help="long edge in px (default 2560)")
    ap.add_argument("--quality", type=int, default=90)
    ap.add_argument("--force", action="store_true", help="overwrite files that already exist")
    args = ap.parse_args()

    files = []
    for p in args.paths:
        found = sorted(p.iterdir()) if p.is_dir() else [p]
        files += [f for f in found if f.is_file() and f.suffix.lower() in EXTS and not f.name.startswith(".")]
    if not files:
        sys.exit("no images found (looking for: %s)" % " ".join(sorted(EXTS)))

    args.out.mkdir(parents=True, exist_ok=True)
    done = skipped = failed = 0
    with tempfile.TemporaryDirectory() as tmp:
        for f in files:
            dst = args.out / (f.stem + ".jpg")
            if dst.exists() and not args.force:
                print(f"  skip  {f.name}  (already in {args.out.name}/, use --force to replace)")
                skipped += 1
                continue
            try:
                (w, h), date, model = convert(f, dst, args.max, args.quality, tmp)
            except Exception as e:
                print(f"  FAIL  {f.name}: {e}")
                failed += 1
                continue
            done += 1
            print(f"  ok    {dst.name}  {w}×{h}  {dst.stat().st_size / 1e6:.1f} MB  {date[:10].replace(':', '.')} {model}".rstrip())
    print(f"\n{done} imported, {skipped} skipped, {failed} failed → {args.out}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
