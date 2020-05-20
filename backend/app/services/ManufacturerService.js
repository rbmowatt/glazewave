const db = require("../models");
const BaseModel = db.Manufacturer;
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');

class ManufacturerService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = ManufacturerService;