const db = require("../models");
const BaseModel = db.City;
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');

class CityService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = CityService;