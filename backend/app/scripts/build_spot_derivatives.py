#!/usr/bin/env python3
"""
Builds the S3 payload: each spot image at every ladder width below its own,
plus itself, keyed by content hash.

  data/spot-images-cdn/spot-images/<sha256>/400.jpg
                                            /800.jpg
                                            /1600.jpg      <- or the source width,
                                                              whichever is smaller

Content-addressed rather than named per spot, because 1,322 default images
resolve to 1,018 distinct files - one photograph is the best match for as many
as ten adjacent OSM nodes on the same beach. spot_images.name stores the
"spot-images/<sha256>/" prefix, and the available widths are derivable from
spot_images.width, so no column has to list them.

Why the hash and not the filename: the uploads bucket has versioning on, so a
key whose contents can change is a key you pay for twice. A hash key never
changes, which also makes `aws s3 sync --size-only` correct rather than merely
fast.

Python, not the app's sharp pipeline: sharp 0.30.7 ships no darwin-arm64
prebuild, which is the same reason the backend will not install locally. This
runs against files already on disk and needs nothing from the app.

The full-size rung is a byte copy when the source is a JPEG - re-encoding an
untouched image only loses quality. PNGs are converted, because a PNG of a
photograph is several times the size of the JPEG for no visible gain and the key
scheme is .jpg either way.

Source widths are read off the file headers, never from Commons. The API reports
thumbwidth as the width you asked for and then serves a bucketed render: asking
for 1600 yields 1920, and asking for more than the original yields the original.
Trusting it put a wrong width and height on 2,311 of 2,341 rows.

Usage:
  build_spot_derivatives.py                     rank 1 only, the default set
  build_spot_derivatives.py --rank=all          every image in the manifest
  build_spot_derivatives.py --widths=400,800,1600
  build_spot_derivatives.py --budget=150        stop cleanly, exit 3, rerun
  build_spot_derivatives.py --verify            re-check what is already built
"""

import json
import os
import shutil
import sys
import time

from PIL import Image

STARTED = time.time()
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data'))
OUT = os.path.join(ROOT, 'spot-images-cdn', 'spot-images')

# 400 is the picker chip and the search row, 800 the spot card, 1600 the hero.
# A rung is only built when it is genuinely smaller than the source, and the
# source width is always emitted as its own key, so <sha>/800.jpg is 800px wide
# or it does not exist. Nothing is upscaled and no two keys hold the same bytes.
#
# Most sources are 1920 (Commons hands back a bucketed render, not the width you
# asked for) but the tail runs down to 600, so a fixed three-rung ladder would
# have written a 640px image to a key called 1600.jpg for 300-odd files.
LADDER = [400, 800, 1600]
# Nothing is served larger than the hero. Without the cap, a 1920 source - which
# is most of them - gets both a 1600 and a 1920 rung holding visually identical
# images, which was 829 redundant objects and 0.3GB on the first build.
TOP = 1600
QUALITY = 82


def widths_for(source_width):
    return sorted({w for w in LADDER if w < source_width} | {min(source_width, TOP)})


def arg(name, default=None):
    for a in sys.argv[1:]:
        if a == f'--{name}':
            return True
        if a.startswith(f'--{name}='):
            return a.split('=', 1)[1]
    return default


RANK = arg('rank', '1')
BUDGET = float(arg('budget', 0) or 0)
VERIFY = bool(arg('verify', False))
if arg('widths'):
    LADDER = [int(w) for w in str(arg('widths')).split(',')]


def sources():
    manifest = json.load(open(os.path.join(ROOT, 'spot_images.json')))
    out = {}
    for spot in manifest['spots']:
        images = spot['images'] if RANK == 'all' else spot['images'][:1]
        for img in images:
            out.setdefault(img['sha256'], img)
    return out


def build(img):
    src = os.path.join(ROOT, img['file'])
    dest_dir = os.path.join(OUT, img['sha256'])
    os.makedirs(dest_dir, exist_ok=True)
    written = 0

    for w in widths_for(img['width']):
        dest = os.path.join(dest_dir, f'{w}.jpg')
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            continue

        # The full-size rung is a byte copy when the source is already JPEG:
        # re-encoding an untouched image only loses quality.
        if w >= img['width'] and img['mime'] == 'image/jpeg':
            shutil.copyfile(src, dest)
            written += 1
            continue

        with Image.open(src) as im:
            # A PNG may carry an alpha channel that JPEG cannot; flatten onto
            # white rather than letting Pillow raise on save.
            if im.mode in ('RGBA', 'LA', 'P'):
                im = im.convert('RGBA')
                flat = Image.new('RGB', im.size, (255, 255, 255))
                flat.paste(im, mask=im.split()[-1])
                im = flat
            elif im.mode != 'RGB':
                im = im.convert('RGB')

            if im.width > w:
                im = im.resize((w, max(1, round(im.height * w / im.width))),
                               Image.LANCZOS)
            # Metadata is dropped on purpose: attribution lives in spot_images,
            # not in EXIF, and stripping it is most of the size win at 400px.
            im.save(dest, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
            written += 1
    return written


def verify(srcs):
    missing, empty, extra, total_bytes, expected = [], [], [], 0, 0
    for h, img in srcs.items():
        want = {f'{w}.jpg' for w in widths_for(img['width'])}
        expected += len(want)
        have = set(os.listdir(os.path.join(OUT, h))) if os.path.isdir(os.path.join(OUT, h)) else set()
        for f in want - have:
            missing.append(os.path.join(h, f))
        # A key left over from an earlier ladder is a key that will be synced to
        # S3 and then never referenced, and versioning means paying for it.
        for f in have - want:
            extra.append(os.path.join(h, f))
        for f in want & have:
            size = os.path.getsize(os.path.join(OUT, h, f))
            if size == 0:
                empty.append(os.path.join(h, f))
            total_bytes += size

    stray = [d for d in os.listdir(OUT) if d not in srcs] if os.path.isdir(OUT) else []
    print(f'expected {expected} objects across {len(srcs)} hashes')
    print(f'  missing {len(missing)}, zero-length {len(empty)}, '
          f'stale keys {len(extra)}, orphan dirs {len(stray)}')
    print(f'  total {total_bytes / 1e9:.2f} GB')
    for p in (missing + extra)[:5]:
        print('   ', p)
    return not (missing or empty or extra or stray)


def main():
    srcs = sources()
    print(f'{len(srcs)} distinct files, ladder {LADDER}')

    if VERIFY:
        sys.exit(0 if verify(srcs) else 1)

    os.makedirs(OUT, exist_ok=True)
    done = written = 0
    for h, img in srcs.items():
        if BUDGET and time.time() - STARTED > BUDGET:
            print(f'budget hit after {done} files, {written} objects written')
            sys.exit(3)
        written += build(img)
        done += 1
        if done % 200 == 0:
            print(f'  {done}/{len(srcs)}')

    print(f'{done} files, {written} objects written this run')
    verify(srcs)


main()
