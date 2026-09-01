const db = require("../models");
const BaseModel = db.Location;
const GooglePlaces = require('node-googleplaces');
const googleConfig  = require('./../config/google')

const BaseService = require('./BaseService');

class LocationService  extends BaseService {
    constructor(){
        super(BaseModel);
    }

    createFromGoogle (locationId)
    {
        const places = new GooglePlaces(googleConfig.MAPS_KEY);
        return new Promise( (resolve, reject) => {
            places.details({placeid : locationId})
            .then(data => {
                const loc = {
                    id : locationId,
                    name : data.body.result.name,
                    formatted_address : data.body.result.formatted_address,
                    lat : data.body.result.geometry.location.lat,
                    lng : data.body.result.geometry.location.lng,
                    vicinity : data.body.result.vicinity,
                    url : data.body.result.url
                };
                this.upsert(loc)
                .then(result => resolve(result))
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        });
    }
}

module.exports = LocationService;