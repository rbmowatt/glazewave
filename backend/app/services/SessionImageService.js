const db = require("../models");
const BaseModel = db.SessionImage;
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');

class SessionImageService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = SessionImageService;