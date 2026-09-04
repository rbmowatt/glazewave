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
    async createFromGoogle (locationId)
    {
        const place = await placeDetails(locationId);
        return this.upsert(toLocation(place));
    }
}

module.exports = LocationService;
