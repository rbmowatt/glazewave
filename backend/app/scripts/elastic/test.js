const elasticConfig = require("./../../config/elastic");
const { Client } = require("@elastic/elasticsearch");
const esb = require('elastic-builder');

const getClient = (index) => {
  const client = new Client({ node: elasticConfig.host });
  client.on("response", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      //console.log(JSON.stringify(result.body));
    }
  });
  return client;
};

const requestBody = esb.requestBodySearch()
  .size(0)
  .agg(esb.avgAggregation('wave_period', 'wave_period'))
  .agg(esb.avgAggregation('wave_height', 'wave_height'))
  .agg(esb.avgAggregation('swell_height', 'swell_height'))
  .agg(esb.avgAggregation('swell_period', 'swell_period'))
  .agg(esb.avgAggregation('water_temperature', 'water_temperature'))
  .agg(esb.avgAggregation('wind_speed', 'wind_speed'))
  .query(esb.matchQuery('user_id', '1'));
  console.log(requestBody)
  getClient()
  .search({
    index: process.env.ELASTIC_SESSIONS_INDEX,
    body: requestBody.toJSON()
  })
  .then(resp => {
    console.log(resp.body.aggregations)
  })
  .catch(err => {
    console.trace(err.message);
  });