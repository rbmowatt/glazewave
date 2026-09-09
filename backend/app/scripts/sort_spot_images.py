#!/usr/bin/env python3
"""
Builds data/spot-images-by-subject/<class>/<region>/ as hard links into
data/spot-images, so the review verdict can be eyeballed in a file browser
without a second copy of 2.4GB.

Hard links, not copies: same filesystem, so each link costs an inode and
nothing else. Deleting a link here never touches the real file. Rebuild it any
time; it clears itself first.

Also writes reject lists: the spots whose best image is not a photograph of the
coast, which is the set that needs either a fallback image or a second harvest
pass.
"""

import json
import os
import shutil

ROOT = os.path.expanduser('~/mnt/glazewave/backend/data')
OUT = os.path.join(ROOT, 'spot-images-by-subject')

manifest = json.load(open(os.path.join(ROOT, 'spot_images.json')))

if os.path.exists(OUT):
    shutil.rmtree(OUT)

counts = {}
for spot in manifest['spots']:
    for n, img in enumerate(spot['images']):
        cls = img.get('subject') or 'unreviewed'
        src = os.path.join(ROOT, img['file'])
        dest_dir = os.path.join(OUT, cls, spot['region'].lower())
        os.makedirs(dest_dir, exist_ok=True)
        dest = os.path.join(dest_dir, os.path.basename(img['file']))
        if not os.path.exists(dest):
            os.link(src, dest)
        counts[cls] = counts.get(cls, 0) + 1

print('linked by subject:', counts)

# The spots that still have no usable photo, and the ones carrying a merely
# contextual one. Separate lists: the first needs a fallback, the second needs
# a decision.
no_coastal = []
context_only = []
for spot in manifest['spots']:
    if not spot['images']:
        continue
    subjects = [i.get('subject') for i in spot['images']]
    if 'coastal' in subjects:
        continue
    row = {
        'spot_id': spot['spot_id'],
        'name': spot['name'],
        'region': spot['region'],
        'lat': spot['lat'],
        'lon': spot['lon'],
        'best_subject': subjects[0],
        'files': [i['file'] for i in spot['images']],
    }
    (context_only if 'context' in subjects else no_coastal).append(row)

uncovered = [
    {'spot_id': s['spot_id'], 'name': s['name'], 'region': s['region'],
     'lat': s['lat'], 'lon': s['lon']}
    for s in manifest['spots'] if not s['images']
]

json.dump(
    {
        'generated_at': manifest['generated_at'],
        'summary': {
            'spots_total': len(manifest['spots']),
            'spots_with_a_coastal_image': sum(
                1 for s in manifest['spots']
                if any(i.get('subject') == 'coastal' for i in s['images'])
            ),
            'spots_context_only': len(context_only),
            'spots_no_usable_image': len(no_coastal),
            'spots_no_image_at_all': len(uncovered),
        },
        'context_only': context_only,
        'no_usable_image': no_coastal,
        'no_image_at_all': uncovered,
    },
    open(os.path.join(ROOT, 'spot_image_gaps.json'), 'w'),
    indent=2,
)

print('context only:', len(context_only))
print('no usable image:', len(no_coastal))
print('no image at all:', len(uncovered))
