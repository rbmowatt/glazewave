const elasticConfig = require("./../../config/elastic");
const { Client } = require("@elastic/elasticsearch");
const getElasticClient = (index) => {
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

module.exports = getElasticClient;