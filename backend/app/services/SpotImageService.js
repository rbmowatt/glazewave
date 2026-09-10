const db = require("../models");
const BaseService = require('./BaseService');
const DisplayScope = require('./rights/DisplayScope');
const s3Config = require('./../config/s3');

const BaseModel = db.SpotImage;

// 400 is the picker chip and the search row, 800 the card, 1600 the hero.
//
// Which of these actually exist for a given image is derived from its stored
// width, not listed in a column, and this has to stay in step with
// build_spot_derivatives.py: a rung only exists when it is smaller than the
// source, plus the source itself capped at TOP. Sources run from 600 to 1920,
// so a 640px photo has 400 and 640 and nothing else. Emitting a srcset entry
// for a key that was never built is a 403 in the browser, not a fallback.
const LADDER = [400, 800, 1600];
const TOP = 1600;
const DEFAULT_WIDTH = 800;

function widthsFor(sourceWidth) {
  const w = Number(sourceWidth) || TOP;
  return [...new Set([...LADDER.filter((n) => n < w), Math.min(w, TOP)])]
    .sort((a, b) => a - b);
}

class SpotImageService extends BaseService {

    constructor(){
        super(BaseModel);
    }

    /**
     * The only supported way to get spot imagery out of the API.
     *
     * Loads under the `rights` scope on purpose: the default scope hides the
     * URL columns from generic includes, and this needs them to build a URL.
     * The gate is not skipped, it moves into DisplayScope.publicImage, which
     * also attaches the credit the default scope cannot.
     */
    async publicFor(spotId, width = DEFAULT_WIDTH)
    {
        const rows = await BaseModel.scope('rights').findAll({
            where: { spot_id: spotId },
            include: [{ model: db.ImageLicense }, { model: db.ContentSource }],
            order: [['is_default', 'DESC'], ['position', 'ASC'], ['id', 'ASC']],
        });

        return rows.map((row) => this.render(row, width)).filter(Boolean);
    }

    /**
     * The default image for a batch of spots, in one query.
     *
     * /api/spot/nearest returns up to 50 rows and /search up to 25, both
     * unauthenticated. Calling publicFor per row is 50 round trips on an open
     * endpoint, so this exists to make the batch case the easy one to write.
     * Returns a Map keyed by spot_id; a spot with no usable image is absent
     * rather than present-and-null, so callers cannot render an empty <img>.
     */
    async defaultsFor(spotIds, width = DEFAULT_WIDTH)
    {
        const out = new Map();
        if (!spotIds || !spotIds.length) return out;

        const rows = await BaseModel.scope('rights').findAll({
            where: {
                spot_id: spotIds,
                is_default: true,
                is_public: true,
                display_scope: DisplayScope.RENDERABLE,
            },
            include: [{ model: db.ImageLicense }, { model: db.ContentSource }],
        });

        for (const row of rows) {
            const image = this.render(row, width);
            if (image) out.set(row.spot_id, image);
        }
        return out;
    }

    /**
     * A row becomes {url, credit, credit_url} or nothing at all.
     *
     * DisplayScope.publicImage builds the URL from `name` as a whole key, which
     * is right for board images: one row, one object. A spot image stores the
     * prefix and picks a width here, so the width is appended after the gate
     * has run rather than before it.
     */
    render(row, width = DEFAULT_WIDTH)
    {
        const image = DisplayScope.publicImage(row, s3Config.publicRoot);
        if (!image) return null;

        const available = widthsFor(row.width);
        // Ask for 1600 of a 640px photo and you get 640, because that is the
        // largest rung that was built. Never round up to a key that is not there.
        const asked = Number(width) || DEFAULT_WIDTH;
        const w = available.filter((n) => n <= asked).pop() || available[0];

        if (row.storage === 'mirrored' && row.name) {
            image.url = `${s3Config.publicRoot}${row.name}${w}.jpg`;
            image.srcset = available
                .map((n) => `${s3Config.publicRoot}${row.name}${n}.jpg ${n}w`)
                .join(', ');
        }
        image.width = w;
        image.height = row.height && row.width
            ? Math.round((row.height * w) / row.width)
            : null;
        image.subject = row.subject;
        // The composed credit line runs to 279 characters, which is right
        // under a photograph and unusable under a 28px picker chip. The author
        // alone is what a thumbnail strip can carry, so it ships beside the
        // full line rather than instead of it.
        image.author = row.author || null;
        return image;
    }
}

module.exports = SpotImageService;
module.exports.LADDER = LADDER;
module.exports.TOP = TOP;
module.exports.widthsFor = widthsFor;
