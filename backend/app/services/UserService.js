const db = require("../models");
const BaseModel = db.User;
const BaseService = require('./BaseService');
const getElasticClient = require('./elastic/client');
const esb = require('elastic-builder');



class UserService  extends BaseService {
    constructor(){
        super(BaseModel);
    }

    getUserAverages(parser)
    {
        return new Promise((resolve, reject)=>{
        const client = getElasticClient();
        const requestBody = esb.requestBodySearch()
            .size(0)
            .agg(esb.avgAggregation('wave_period', 'wave_period'))
            .agg(esb.avgAggregation('wave_height', 'wave_height'))
            .agg(esb.avgAggregation('swell_height', 'swell_height'))
            .agg(esb.avgAggregation('swell_period', 'swell_period'))
            .agg(esb.avgAggregation('water_temperature', 'water_temperature'))
            .agg(esb.avgAggregation('wind_speed', 'wind_speed'))
            .agg(esb.avgAggregation('session_rating', 'rating'))
            .agg(esb.valueCountAggregation('total_sessions', 'id'))
            .query(esb.matchQuery('user_id', parser.id));
        client
        .search({
            index: process.env.ELASTIC_SESSIONS_INDEX,
            body: requestBody.toJSON()
        })
        .then(resp => {
            const parsedValues = {};
            let val = 0.0;
            //here we'll clean up the response a bit and round things off
            for (const [key, value] of Object.entries(resp.body.aggregations)) {
                val = value.value ? value.value.toFixed(1) : 0.0;
                parsedValues[key] = val;
            }
            resolve(parsedValues)
        })
        .catch(err => {
            reject(err.message);
        });
    });
}
}

module.exports = UserService;