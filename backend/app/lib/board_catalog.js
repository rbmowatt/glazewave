'use strict';

// Pure catalog logic: how a harvested record becomes a board row. No database
// and no config, so it can be exercised on its own.

// Ranked worst to best. A year only overwrites one that ranks lower, so an EOS
// yearIntroduced column beats a regex over Shopify marketing copy, and
// 'boilerplate' - the brand founding year lifted out of house copy - never wins
// anything.
const YEAR_RANK = { boilerplate: 0, mentioned: 1, title: 2, stated: 3, field: 4 };

// Which source to believe per field when the same model arrives from several.
// EOS is the historical authority; the brand stores describe what is being sold
// now and are the only ones with volume and photographs.
const FIELD_SOURCE = {
  designer: ['eos'],
  category: ['shopify', 'eos'],
  volume_l: ['shopify'],
  length_in: ['shopify', 'eos'],
  width_in: ['shopify', 'eos'],
  thickness_in: ['shopify', 'eos'],
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// The upsert key. A leading "the" is dropped because EOS writes BLACK BEAUTY
// where a brand store writes The Black Beauty, and they are one board.
const canonicalKey = (makerSlug, model) =>
  `${makerSlug}::${slugify(String(model || '').replace(/^the\s+/i, ''))}`;

// Feeds disagree about a maker's name: Boardcave says "Pyzel Surfboards", the
// Shopify vendor field says "Pyzel". Left alone that produces two canonical
// keys and imports one board twice under two manufacturers, because the key is
// built before resolveManufacturer ever reconciles aliases. Only a trailing
// standalone word is stripped, so Haydenshapes and JS Industries survive.
const MAKER_SUFFIX = /[\s-]+(surfboards?|surf|surf-co|designs|shapes-co)$/;

// Trailing-word stripping does not close every gap: "Sharp Eye" and "Sharpeye"
// still differ. Those need a curated map, which --report-makers exists to help
// build. Shape: { "sharpeye": "sharp-eye" }.
function makerSlugOf(name, aliases = {}) {
  const base = slugify(name).replace(MAKER_SUFFIX, '');
  return aliases[base] || aliases[slugify(name)] || base;
}

// Flags maker slugs that are probably one maker, for review before an import
// writes two. Prefix containment catches the suffix cases; removing every
// separator catches "sharp-eye" against "sharpeye".
function nearDuplicateMakers(slugs) {
  const flat = (s) => s.replace(/-/g, '');
  const list = [...new Set(slugs)].sort();
  const pairs = [];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const [a, b] = [list[i], list[j]];
      if (flat(a) === flat(b) || a.startsWith(b) || b.startsWith(a)) pairs.push([a, b]);
    }
  }
  return pairs;
}

const sourceKeyOf = (record) => String(record.source || '').split(':')[0] || 'shopify';

/** Collapses every record carrying the same canonical_key into one board. */
function merge(records, makerAliases = {}) {
  const byKey = new Map();

  for (const r of records) {
    if (r.record_type && r.record_type !== 'model') continue;
    if (!r.maker || !r.model) continue;

    const makerSlug = makerSlugOf(r.maker, makerAliases);
    const key = canonicalKey(makerSlug, r.model);
    const source = sourceKeyOf(r);

    if (!byKey.has(key)) {
      byKey.set(key, {
        canonical_key: key,
        maker: r.maker,
        maker_slug: makerSlug,
        maker_aliases: new Set([r.maker]),
        model: r.model,
        slug: slugify(r.model),
        designer: null, category: null, discontinued: false,
        year_introduced: null, year_confidence: null, year_evidence: null,
        length_in: null, width_in: null, thickness_in: null, volume_l: null,
        sources: [], images: [], _fieldSource: {},
      });
    }
    const board = byKey.get(key);
    board.maker_aliases.add(r.maker);
    if (r.discontinued) board.discontinued = true;

    for (const field of Object.keys(FIELD_SOURCE)) {
      const incoming = r[field];
      if (incoming === null || incoming === undefined || incoming === '') continue;
      const order = FIELD_SOURCE[field];
      const rank = (s) => { const i = order.indexOf(s); return i === -1 ? 99 : i; };
      if (board[field] === null || rank(source) < rank(board._fieldSource[field])) {
        board[field] = incoming;
        board._fieldSource[field] = source;
      }
    }

    const rank = YEAR_RANK[r.year_confidence] ?? -1;
    if (r.year_introduced && rank > (YEAR_RANK[board.year_confidence] ?? -1)) {
      board.year_introduced = r.year_introduced;
      board.year_confidence = r.year_confidence;
      board.year_evidence = r.year_evidence || null;
    }

    board.sources.push({
      source_key: source,
      source_url: r.url || null,
      source_ref: r.slug || null,
      payload: r,
    });

    for (const src of String(r.image_all || r.image_primary || '').split(' ').filter(Boolean)) {
      board.images.push({ source_key: source, source_url: src });
    }
  }
  return [...byKey.values()];
}


module.exports = {
  slugify,
  makerSlugOf,
  canonicalKey,
  nearDuplicateMakers,
  merge,
  YEAR_RANK,
  FIELD_SOURCE,
};
