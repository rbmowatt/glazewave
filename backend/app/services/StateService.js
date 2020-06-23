const db = require("../models");
const BaseModel = db.State;
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');

class StateService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = StateService;