const db = require("../models");
const BaseModel = db.User;
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');

class UserService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = UserService;