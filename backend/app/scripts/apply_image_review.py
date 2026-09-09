#!/usr/bin/env python3
"""
Applies the visual review to the harvest: tags every image with what it is a
picture of, and reorders each spot's images so the best one is rank 1.

The review classified the 3,033 distinct files, not the 4,039 slots, because
adjacent OSM nodes are usually the same beach and the same photograph would
otherwise have been judged a dozen times with a dozen chances to disagree.

Three classes:
  coastal  the ocean, beach, surf, shoreline, dunes, a pier or boardwalk at the
           water, cliffs meeting water - the coast IS the subject. Usable.
  context  a coastal setting whose subject is something else: people, a beach
           bar, a lighthouse, a boat, an aerial of a coastal town. Judgement.
  not      no coastal subject at all: inland streets, buildings, vegetation,
           monuments, documents, wildlife close-ups. Not usable.

Reordering is by class first, relevance score second. It moves 300 spots from a
non-coastal rank 1 to a coastal one, which is the whole point: the harvester
scored on filename and category text, and text cannot tell a photograph of a
beach from a photograph of a lizard standing on one.

This edits the per-spot cache, not the manifest. Run the harvester's download
and docs stages afterwards to rewrite the files and the manifest from it:

  rm -rf data/spot-images
  node app/scripts/harvest_spot_images.js --stage=download
  node app/scripts/harvest_spot_images.js --stage=docs

The rm matters. Filenames encode rank, so reordering without clearing the tree
leaves a stale file wherever the new image happens to be the same size.
"""

import json
import os
import sys

ROOT = os.path.expanduser('~/mnt/glazewave/backend/data')
CACHE = os.path.expanduser('~/.cache/glazewave/spot-images')
RANK = {'coastal': 0, 'context': 1, 'not': 2}


def main():
    index = json.load(open(os.path.join(ROOT, 'contact-sheets/index.json')))
    verdicts = json.load(open(sys.argv[1]))

    by_hash = {}
    for i, rec in index['images'].items():
        if i in verdicts:
            by_hash[rec['sha256']] = verdicts[i]
    print(f'{len(by_hash)} distinct files classified')

    manifest = json.load(open(os.path.join(ROOT, 'spot_images.json')))
    touched = 0
    reordered = 0
    unclassified = 0

    for spot in manifest['spots']:
        if not spot['images']:
            continue
        key = f"spot_{slug(spot['spot_id'])}"
        path = os.path.join(CACHE, f'{key}.json')
        rec = json.load(open(path))

        for img in rec['images']:
            cls = by_hash.get(img.get('sha256'))
            if cls is None:
                unclassified += 1
            img['subject'] = cls
            touched += 1

        before = [i['sha256'] for i in rec['images']]
        rec['images'].sort(
            key=lambda i: (RANK.get(i.get('subject'), 3), -i['relevance_score'])
        )
        if [i['sha256'] for i in rec['images']] != before:
            reordered += 1

        rec['coverage'] = rec['images'][0]['tier'] if rec['images'] else 'none'
        rec['best_subject'] = rec['images'][0].get('subject') if rec['images'] else None
        json.dump(rec, open(path, 'w'))

    print(f'{touched} image records tagged, {unclassified} had no verdict')
    print(f'{reordered} spots reordered')


def slug(s):
    import re
    import unicodedata
    s = unicodedata.normalize('NFD', str(s))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-z0-9]+', '-', s.lower())
    return re.sub(r'^-+|-+$', '', s)[:60] or 'unnamed'


main()
