const SessionService = require("../services/SessionService");
const UserBoardService = require("../services/UserBoardService");
const {
  getSessionQueue,
  getUserBoardQueue,
} = require("./../services/queue/BetterQueue");
const elasticConfig = require("./../config/elastic");
const { Client } = require("@elastic/elasticsearch");
const sesssionMappings = require("./elastic/session_mappings.json");
const userBoardMappings = require("./elastic/user_board_mappings.json");

const getClient = () => {
  const client = new Client({ node: elasticConfig.host });
  client.on("response", (err, result) => {
    if (err) {
    } else {
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
              });
            });
          })
          .catch((e) => {});
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
              });
            });
          })
          .catch((e) => {});
      }
    );
  }
);

