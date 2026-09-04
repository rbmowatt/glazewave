const db = require("../models");
const BaseModel = db.Session;
const BaseService = require('./BaseService');
const LocationService = require('./LocationService');
const SessionDataModel = db.SessionData;


class SessionService  extends BaseService {

    constructor(){
        super(BaseModel);
    }

    async create(params, callback = null)
    {
        await this.ensureLocation(params);
        return super.create(params, callback);
    }

    async addConditons( conditions )
    {
        return SessionDataModel.create(conditions);
    }

    async update(id, params, callback = null)
    {
        await this.ensureLocation(params);
        return super.update(id, params, callback);
    }

    // The FK means the locations row has to land first. The old version fired
    // the lookup and the save together and never rejected, so a failed details
    // call left the request hanging open instead of returning an error.
    async ensureLocation(params)
    {
        if(!params.location_id) return null;
        return LocationService.make().createFromGoogle(params.location_id);
    }
}

module.exports = SessionService;
