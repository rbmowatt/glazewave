'use strict';
const {getAlgoliaClient} = require('./../services/algolia/client');
const ALGOLIA_INDEX = 'user_boards';
const ALGOLIA_PREFIX = 'user_board_';
module.exports = (sequelize, DataTypes) => {
  const UserBoard = sequelize.define('UserBoard', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    size: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    board_id: DataTypes.INTEGER,
    notes: DataTypes.TEXT,
    is_public: DataTypes.BOOLEAN
  }, {underscored: true, tableName: 'user_boards'});
   //add hooks to algolia
   UserBoard.addHook('afterCreate', 'afterUpdate',   async (board, options) => {
    board.dataValues.objectID = ALGOLIA_PREFIX + board.id;
    getAlgoliaClient(ALGOLIA_INDEX ).saveObjects([board.dataValues], {
    }).then(({ objectIDs }) => {console.log(objectIDs);});
  })
  UserBoard.addHook('afterDestroy', async (board, options) => {
    console.log('destrpyrd', board)
    getAlgoliaClient(ALGOLIA_INDEX ).deleteObject(ALGOLIA_PREFIX + board.id)
  })

  UserBoard.associate = function(models) {
    UserBoard.belongsTo(models.Board);
    UserBoard.belongsTo(models.User);
    UserBoard.hasMany(models.UserBoardImage);
    UserBoard.hasMany(models.Session,  {foreignKey: 'board_id', targetKey: 'id'});
  };
  return UserBoard;
};