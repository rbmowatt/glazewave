const db = require("../models");
const BaseModel = db.SurflineSpot;
const Op = db.Sequelize.Op;
const BaseService  = require('./BaseService');

class SurflineSpotService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = SurflineSpotService;