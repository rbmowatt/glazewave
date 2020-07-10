const SessionService = require("../services/SessionService");
const UserBoardService = require("../services/UserBoardService");
const SurflineSpotService = require("../services/SurflineSpotService");
const {
  getSessionQueue,
  getUserBoardQueue,
  getSurflineSpotsQueue,
} = require("./../services/queue/BetterQueue");
const elasticConfig = require("./../config/elastic");
const { Client } = require("@elastic/elasticsearch");
const sesssionMappings = require("./elastic/session_mappings.json");
const userBoardMappings = require("./elastic/user_board_mappings.json");

const getClient = (index) => {
  const client = new Client({ node: elasticConfig.host });
  client.on("response", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(JSON.stringify(result.body));
    }
  });
  return client;
};

const client = getClient();

client.indices.getMapping({ index: process.env.ELASTIC_SESSIONS_INDEX });

client.indices.exists(
  { index: process.env.ELASTIC_SESSIONS_INDEX },
  (err, res, status) => {
    if (!err) {
      client.indices.delete({
        index: process.env.ELASTIC_SESSIONS_INDEX,
      });
    }
    client.indices.create(
      { index: process.env.ELASTIC_SESSIONS_INDEX, body: sesssionMappings },
      (err, res, status) => {
        let queue = getSessionQueue();
        SessionService.make()
          .all({ limit: 1000 })
          .then((data) => {
            data.forEach((session) => {
              queue.push(session).on("finish", function (result) {
                console.log(" session created ", result[0].objectID);
              });
            });
          })
          .catch((e) => console.log("error", e));
      }
    );
  }
);

client.indices.exists(
  { index: process.env.ELASTIC_USER_BOARDS_INDEX },
  (err, res, status) => {
    if (!err) {
      client.indices.delete({
        index: process.env.ELASTIC_USER_BOARDS_INDEX,
      });
    }
    client.indices.create(
      { index: process.env.ELASTIC_USER_BOARDS_INDEX, body: userBoardMappings },
      (err, res, status) => {
        let queue = getUserBoardQueue();
        UserBoardService.make()
          .all({ limit: 1000 })
          .then((data) => {
            data.forEach((board) => {
              queue.push(board).on("finish", function (result) {
                console.log(" board created ", result[0].objectID);
              });
            });
          })
          .catch((e) => console.log("error", e));
      }
    );
  }
);

/*
let queue = getSurflineSpotsQueue();
SurflineSpotService.make().all({limit : 10000, with_all_relations : false}).then(data=>{
  data.forEach(spot=>
      {
        queue.push(spot).on('finish', function (result) {
          console.log( ' surfline spot  created ' , result[0].objectID)
        })
      })
}).catch(e=>console.log('error', e))
*/
