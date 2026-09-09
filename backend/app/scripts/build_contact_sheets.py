#!/usr/bin/env python3
"""
Builds numbered contact sheets from spot_images.json so the harvest can be
reviewed by eye at 16 images a page instead of 4,039 one at a time.

Sheets are keyed on sha256, not on spot: 4,039 image slots resolve to 3,033
distinct files because adjacent OSM nodes are usually the same beach, and
reviewing the same photograph twelve times is twelve chances to answer
differently.

Each tile carries its global index as a label. index -> sha256 -> every spot
that uses it lives in contact_sheets/index.json, which is what turns a verdict
list back into rows.

Usage:
  build_contact_sheets.py [--cols 4] [--rows 4] [--tile 400x300] [--budget 150]

Exit 3 means the budget was hit with sheets left to build; rerun.
"""

import json
import os
import subprocess
import sys
import time

STARTED = time.time()
ROOT = os.path.expanduser('~/mnt/glazewave/backend/data')
OUT = os.path.join(ROOT, 'contact-sheets')


def arg(name, default):
    for a in sys.argv[1:]:
        if a.startswith(f'--{name}='):
            return a.split('=', 1)[1]
    return default


COLS = int(arg('cols', 4))
ROWS = int(arg('rows', 4))
TILE = arg('tile', '400x300')
BUDGET = float(arg('budget', 150))
PER_SHEET = COLS * ROWS


def main():
    manifest = json.load(open(os.path.join(ROOT, 'spot_images.json')))

    # Ordered by region then spot so a sheet is geographically coherent; a
    # reviewer calibrates faster on sixteen Baja beaches than on sixteen
    # unrelated coastlines.
    order = []
    by_hash = {}
    for spot in manifest['spots']:
        for img in spot['images']:
            h = img['sha256']
            if h not in by_hash:
                by_hash[h] = {
                    'sha256': h,
                    'file': img['file'],
                    'title': img['title_plain'],
                    'license': img['license'],
                    'score': img['relevance_score'],
                    'used_by': [],
                }
                order.append(h)
            by_hash[h]['used_by'].append({
                'spot_id': spot['spot_id'],
                'spot': spot['name'],
                'region': spot['region'],
                'rank': img['rank'] if 'rank' in img else None,
                'position': spot['images'].index(img),
            })

    os.makedirs(OUT, exist_ok=True)
    index = {}
    for i, h in enumerate(order):
        by_hash[h]['index'] = i
        index[str(i)] = by_hash[h]
    json.dump(
        {'per_sheet': PER_SHEET, 'cols': COLS, 'rows': ROWS,
         'count': len(order), 'images': index},
        open(os.path.join(OUT, 'index.json'), 'w'),
    )

    sheets = [order[i:i + PER_SHEET] for i in range(0, len(order), PER_SHEET)]
    built = 0
    for n, chunk in enumerate(sheets):
        dest = os.path.join(OUT, f'sheet-{n:04d}.jpg')
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            continue
        if time.time() - STARTED > BUDGET:
            print(f'budget hit after {built} sheets, {len(sheets)} total')
            sys.exit(3)

        args = ['montage']
        for h in chunk:
            args += ['-label', str(by_hash[h]['index']),
                     os.path.join(ROOT, by_hash[h]['file'])]
        args += [
            '-tile', f'{COLS}x{ROWS}',
            '-geometry', f'{TILE}+4+4',
            '-background', 'white',
            '-pointsize', '22',
            '-fill', 'black',
            '-quality', '82',
            dest,
        ]
        subprocess.run(args, check=True, stderr=subprocess.DEVNULL)
        built += 1

    print(f'{len(order)} distinct images, {len(sheets)} sheets, {built} built this run')


main()
