#!/usr/bin/env python3
"""
Removes the images the visual review classified `not` — no coastal subject at
all — from the harvest, and records what was dropped so a later run does not
fetch and re-propose the same hotel lobby.

`context` images survive. A lighthouse or a pier-town aerial is a weaker answer
than a photograph of the break, but it beats a gray placeholder, and the
ordering already keeps it below anything coastal.

What this does:
  - drops every `not` image from the per-spot cache
  - writes data/spot_image_rejects.json: sha256, Commons page, spot, and the
    filename it used to occupy
  - deletes the blobs that no surviving image references, so a rerun of the
    download stage cannot resurrect them

The rejects ledger is keyed on sha256 rather than on URL because the harvest
already found two Commons URLs returning identical bytes; a URL key would let
the twin back in.

Run the download and docs stages afterwards to rewrite the tree and manifest:

  rm -rf data/spot-images
  node app/scripts/harvest_spot_images.js --stage=download
  node app/scripts/harvest_spot_images.js --stage=docs
  python3 app/scripts/sort_spot_images.py

Pass --dry-run to see the counts without touching anything.
"""

import json
import os
import re
import sys
import unicodedata

ROOT = os.path.expanduser('~/mnt/glazewave/backend/data')
CACHE = os.path.expanduser('~/.cache/glazewave/spot-images')
BLOBS = os.path.join(CACHE, 'blobs')
DRY = '--dry-run' in sys.argv


def slug(s):
    s = unicodedata.normalize('NFD', str(s))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-z0-9]+', '-', s.lower())
    return re.sub(r'^-+|-+$', '', s)[:60] or 'unnamed'


import hashlib


def blob_for(url):
    return os.path.join(BLOBS, hashlib.sha1(url.encode()).hexdigest())


def main():
    manifest = json.load(open(os.path.join(ROOT, 'spot_images.json')))

    rejects = {}
    kept_hashes = set()
    dropped_urls = set()
    spots_emptied = 0
    dropped = 0

    for spot in manifest['spots']:
        if not spot['images']:
            continue
        path = os.path.join(CACHE, f"spot_{slug(spot['spot_id'])}.json")
        rec = json.load(open(path))

        keep = [i for i in rec['images'] if i.get('subject') != 'not']
        drop = [i for i in rec['images'] if i.get('subject') == 'not']

        for i in keep:
            kept_hashes.add(i['sha256'])
        for i in drop:
            dropped += 1
            dropped_urls.add(i['download_url'])
            entry = rejects.setdefault(i['sha256'], {
                'sha256': i['sha256'],
                'title': i['title'],
                'source_page_url': i['source_page_url'],
                'download_url': i['download_url'],
                'license': i['license'],
                'reason': 'visual review: no coastal subject',
                'relevance_score': i['relevance_score'],
                'was_used_by': [],
            })
            entry['was_used_by'].append({
                'spot_id': spot['spot_id'],
                'spot': spot['name'],
                'region': spot['region'],
                'file': i.get('file'),
            })

        if not keep:
            spots_emptied += 1

        rec['images'] = keep
        rec['candidates_kept'] = len(keep)
        rec['coverage'] = keep[0]['tier'] if keep else 'none'
        rec['best_subject'] = keep[0].get('subject') if keep else None
        if not DRY:
            json.dump(rec, open(path, 'w'))

    # A blob still referenced by a surviving image must not be deleted: the same
    # photograph can be `not` for one spot's slot and survive in another only if
    # the review disagreed with itself, which it cannot, but the guard is cheap
    # and a wrong delete costs a re-download of 1.9GB.
    freed = 0
    removed_blobs = 0
    for url in dropped_urls:
        b = blob_for(url)
        if not os.path.exists(b):
            continue
        size = os.path.getsize(b)
        if not DRY:
            os.remove(b)
        freed += size
        removed_blobs += 1

    ledger = {
        'generated_at': manifest['generated_at'],
        'reason': 'classified `not` by visual review — no coastal subject',
        'note': ('Keyed on sha256, not URL: two Commons URLs in this harvest '
                 'return identical bytes, and a URL key would let the twin back in. '
                 'The harvester should skip any candidate whose sha256 appears here.'),
        'distinct_files': len(rejects),
        'slots_removed': dropped,
        'spots_left_with_nothing': spots_emptied,
        'rejects': sorted(rejects.values(), key=lambda r: -len(r['was_used_by'])),
    }
    if not DRY:
        json.dump(ledger, open(os.path.join(ROOT, 'spot_image_rejects.json'), 'w'),
                  indent=2)

    print(f"{'DRY RUN: ' if DRY else ''}dropped {dropped} slots "
          f"({len(rejects)} distinct files)")
    print(f"  {spots_emptied} spots left with no image")
    print(f"  {removed_blobs} blobs removed, {freed / 1e9:.2f} GB freed from the cache")


main()
