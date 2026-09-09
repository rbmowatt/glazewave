/*
 * Downloads data/coastline.bin to match data/coastline.manifest.json.
 *
 * The extract is 2.6MB and regenerating it writes a different file, so
 * committing it would put a fresh copy in git history every time a coast is
 * added. It lives in the uploads bucket instead, which the bucket policy
 * already serves public-read, so this needs no credentials and no AWS SDK.
 *
 * The manifest is committed, which is what pins the deploy: the hash in the
 * repo is the extract the code in the repo was tested against. A box holding
 * anything else re-downloads.
 *
 * Dependency-free - global fetch and node crypto - so it runs before npm ci as
 * easily as after.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../../data');
const OUT = path.join(DIR, 'coastline.bin');
const MANIFEST = path.join(DIR, 'coastline.manifest.json');

const sha256 = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const run = async () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

  if (fs.existsSync(OUT)) {
    const have = sha256(OUT);
    if (have === manifest.sha256) {
      console.log('coastline.bin is current');
      return;
    }
    console.log(`coastline.bin is ${have.slice(0, 12)}, manifest wants ${manifest.sha256.slice(0, 12)}`);
  }

  console.log(`fetching ${manifest.url}`);
  const res = await fetch(manifest.url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`coastline download failed: HTTP ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());

  // Written to a temp name and renamed, so a truncated download never becomes
  // the file the API opens. The service reads through a descriptor it holds
  // open, so replacing the path under a running process is safe until restart.
  const tmp = OUT + '.part';
  fs.writeFileSync(tmp, body);
  const got = sha256(tmp);
  if (got !== manifest.sha256) {
    fs.unlinkSync(tmp);
    throw new Error(`coastline hash mismatch: got ${got}, expected ${manifest.sha256}`);
  }
  fs.renameSync(tmp, OUT);
  console.log(`wrote ${OUT}, ${(body.length / 1048576).toFixed(2)} MB`);
};

run().catch((e) => { console.error(e.message); process.exit(1); });
