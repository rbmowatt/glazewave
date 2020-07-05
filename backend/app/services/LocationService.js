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
        return new Promise( (resolve, reject)=>{ places.details({placeid : locationId})
            .then(data=>{
                params.location_id  = data.id;
                resolve(super.create(params, callback));
            })})

        
        return 
    }
}

module.exports = LocationService;