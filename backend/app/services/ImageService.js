const db = require("../models");
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');

class ImageService  extends BaseService {
    constructor(model){
        super(db[model]);
    }
}

module.exports = ImageService;