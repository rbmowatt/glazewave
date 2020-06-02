const db = require("../models");
const BaseModel = db.Location;
const GooglePlaces = require('node-googleplaces');

const BaseService = require('./BaseService');

class LocationService  extends BaseService {
    constructor(){
        super(BaseModel);
    }

    createFromGoogle (locationId) 
    {
        const places = new GooglePlaces("AIzaSyBaaD_720jqJaoIBsQib_N79Q5_iciLRBc");
        return new Promise( (resolve, reject)=>{ places.details({placeid : locationId})
            .then(data=>{
                params.location_id  = data.id;
                resolve(super.create(params, callback));
            })})

        
        return 
    }
}

module.exports = LocationService;