const db = require("../models");
const BaseModel = db.Session;
const Op = db.Sequelize.Op;
const BaseService = require('./BaseService');
const LocationService = require('./LocationService');
const SessionDataModel = db.SessionData;
const GooglePlaces = require('node-googleplaces');
const googleConfig  = require('./../config/google')
let algolaiIndex = 'user_sessions';


class SessionService  extends BaseService {

    constructor(){
        super(BaseModel, algolaiIndex);
    }

    async create(params, callback = null)
    {
        if(params.location_id)
        {
           const places = new GooglePlaces(googleConfig.MAPS_KEY);
            return new Promise( (resolve, reject)=>{ places.details({placeid : params.location_id})
            .then(data=>{
                let loc = {
                    id : params.location_id,
                    name : data.body.result.name,
                    formatted_address : data.body.result.formatted_address,
                    lat : data.body.result.geometry.location.lat,
                    lng : data.body.result.geometry.location.lng,
                    vicinity : data.body.result.vicinity,
                    url : data.body.result.url 
                }
                LocationService.make().upsert(loc)
                .then( data=>
                    {
                    resolve(super.create(params, callback));
                    }
                )
            })})
        } else {
            return super.create(params, callback);
        }
    }

    async addConditons( conditions )
    {
        return SessionDataModel.create(conditions);
    }

    async update(id, params, callback = null)
    {
        if(params.location_id)
        {
           const places = new GooglePlaces(googleConfig.MAPS_KEY);
            return new Promise( (resolve, reject)=>{ places.details({placeid : params.location_id})
            .then(data=>{
                let loc = {
                    id : params.location_id,
                    name : data.body.result.name,
                    formatted_address : data.body.result.formatted_address,
                    lat : data.body.result.geometry.location.lat,
                    lng : data.body.result.geometry.location.lng,
                    vicinity : data.body.result.vicinity,
                    url : data.body.result.url 
                }
                LocationService.make().upsert(loc)
                .then( data=>
                    {
                    resolve(super.update(id, params, callback));
                    }
                )
            })})
        } else {
            return super.update(id, params, callback);
        }
    }
}

module.exports = SessionService;