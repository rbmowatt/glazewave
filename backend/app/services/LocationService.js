const db = require("../models");
const BaseModel = db.Location;
const SpotModel = db.SurflineSpot;
const BaseService = require('./BaseService');
const { placeDetails, toLocation } = require('./google/places');
const coastline = require('./Coastline');

class LocationService  extends BaseService {
    constructor(){
        super(BaseModel);
    }

    // sessions.location_id is a FK onto this table, so a session cannot be
    // written until the location row exists. Callers must await this rather
    // than firing it alongside the save.
    //
    // The row is what the FK needs, not a fresh lookup. Every session save used
    // to call Google again for a place already stored, which meant an unset
    // GOOGLE_MAPS_KEY turned every edit that echoed location_id back into a 500
    // reading "Error updating Session" - with the real cause, "GOOGLE_MAPS_KEY
    // is not set", thrown from placeDetails and swallowed by the route.
    //
    // The id now arrives from either the Google autocomplete or the nearest-spot
    // picker, so surfline_spots is checked before Google. Do not branch on the
    // shape of the string to skip a lookup: the current seed is entirely
    // prefixed (osm:way/, osm:node/, osm:relation/) but an older one wrote slug
    // + OSM ref instead, e.g. playa-cerritos-n13722001282, and any box seeded
    // before that change still holds those. The read is what makes both work.
    // It costs one indexed PK hit, and only the first time a place is used.
    async resolve (locationId, userId = null)
    {
        const existing = await BaseModel.findByPk(locationId);
        if (existing) {
            // The location row is cached; the spot row may still be missing,
            // because a place used before promotion existed has one and not the
            // other. Promotion is idempotent, so this is safe to re-run.
            await this.promote(existing, userId);
            return existing;
        }

        const spot = await SpotModel.findByPk(locationId);
        if (spot) return this.createFromSpot(spot);

        const place = await placeDetails(locationId);
        await this.upsert(toLocation(place));
        const created = await BaseModel.findByPk(locationId);
        await this.promote(created, userId);
        return created;
    }

    /*
     * A place someone logged a session at becomes a spot everybody can find,
     * the first time it is used - but only if it passes the same shoreline test
     * that filtered every seeded row. Without that gate one session logged at a
     * home address puts that address in the search for every user, permanently.
     *
     * Failure is silent and non-fatal. Promotion is a side effect of saving a
     * session; a session must still save when the coastline file is missing or
     * the row collides.
     */
    async promote (location, userId = null)
    {
        if (!location || !location.lat || !location.lng) return null;

        const existing = await SpotModel.findByPk(location.id);
        if (existing) return existing;

        try {
            const verdict = coastline.classify(Number(location.lat), Number(location.lng));
            if (!verdict.coastal) return null;

            await SpotModel.create({
                id: location.id,
                name: location.name,
                // The seed fills this from the region it queried. A captured
                // spot has only what Google returned, and vicinity is the
                // closest thing to "where is this" that does not repeat name.
                crumbs: location.vicinity || null,
                cams: null,
                state_id: null,
                county: null,
                lat: String(location.lat),
                lon: String(location.lng),
                url: location.url || null,
                // 'user', not 'osm': these rows carry no OSM provenance and the
                // ODbL credit does not apply to them.
                source: 'user',
                created_by: userId,
                is_public: true,
            });
            return SpotModel.findByPk(location.id);
        } catch (e) {
            console.error(`spot promotion failed for ${location.id}:`, e.message);
            return null;
        }
    }

    // A spot has a name and a point and nothing else, so formatted_address and
    // vicinity stay null rather than getting a made-up value - Conditions reads
    // lat/lng only, and the session title reads name. url is the OSM object,
    // which is also what carries the ODbL provenance back to the source.
    //
    // The column is `lon` on surfline_spots and `lng` here. Both are VARCHAR, so
    // the values copy across as text with no coercion.
    async createFromSpot (spot)
    {
        await this.upsert({
            id: spot.id,
            name: spot.name,
            formatted_address: null,
            lat: spot.lat,
            lng: spot.lon,
            vicinity: null,
            url: spot.url || null,
        });
        return BaseModel.findByPk(spot.id);
    }
}

module.exports = LocationService;
