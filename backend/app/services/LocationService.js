const db = require("../models");
const BaseModel = db.Location;
const SpotModel = db.SurflineSpot;
const BaseService = require('./BaseService');
const { placeDetails, toLocation } = require('./google/places');

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
    async resolve (locationId)
    {
        const existing = await BaseModel.findByPk(locationId);
        if (existing) return existing;

        const spot = await SpotModel.findByPk(locationId);
        if (spot) return this.createFromSpot(spot);

        const place = await placeDetails(locationId);
        await this.upsert(toLocation(place));
        return BaseModel.findByPk(locationId);
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
