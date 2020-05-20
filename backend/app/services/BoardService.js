const db = require("../models");
const BaseModel = db.Board;
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');

class BoardService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = BoardService;