const db = require("../models");
const BaseModel = db.Session;
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');

class SessionService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = SessionService;