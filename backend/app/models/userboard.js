'use strict';
const {getUserBoardQueue, getClient, ALGOLIA_USER_BOARD_INDEX, ALGOLIA_USER_BOARD_PREFIX} = require('./../services/queue/BetterQueue')

const userBoardUpsertCallback = async (board, options) => {
  getUserBoardQueue().push(board).on('finish', function (result) {
    console.log(result)
  })
  .on('failed', function (err) {
    console.log(err)
  })
}

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
   UserBoard.addHook('afterCreate', userBoardUpsertCallback )
   UserBoard.addHook('afterUpdate', userBoardUpsertCallback )
   UserBoard.addHook('afterDestroy', async (board, options) => {
    console.log('destrpyrd', board)
    getClient(ALGOLIA_USER_BOARD_INDEX ).deleteObject(ALGOLIA_USER_BOARD_PREFIX + board.id)
  })

  UserBoard.associate = function(models) {
    UserBoard.belongsTo(models.Board);
    UserBoard.belongsTo(models.User);
    UserBoard.hasMany(models.UserBoardImage);
    UserBoard.hasMany(models.Session,  {foreignKey: 'board_id', targetKey: 'id'});
  };
  return UserBoard;
};