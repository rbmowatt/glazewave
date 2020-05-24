const db = require("../models");
const BaseModel = db.UserBoard;

const BaseService = require('./BaseService');

class UserBoardService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = UserBoardService;