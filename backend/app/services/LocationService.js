const db = require("../models");
const BaseModel = db.Location;
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
    async createFromGoogle (locationId)
    {
        const existing = await BaseModel.findByPk(locationId);
        if (existing) return existing;

        const place = await placeDetails(locationId);
        return this.upsert(toLocation(place));
    }
}

module.exports = LocationService;
