const db = require("../models");
const BaseModel = db.Shaper;
const BaseService = require('./BaseService');

class ShaperService  extends BaseService {
    constructor(){
        super(BaseModel);
    }
}

module.exports = ShaperService;
