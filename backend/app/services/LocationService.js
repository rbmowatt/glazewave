const db = require("../models");
const BaseModel = db.Location;

const BaseService = require('./BaseService');

class LocationService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = LocationService;