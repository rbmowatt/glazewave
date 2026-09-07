'use strict';
const {getUserBoardQueue, getClient} = require('./../services/queue/BetterQueue')
const cascade = require('./../services/elastic/Cascade')

const userBoardUpsertCallback = async (board, options) => {
  getUserBoardQueue().push(board).on('finish', function (result) {
  })
  .on('failed', function (err) {
  })
}

/*
 * Sessions carry this board's name, and through board_id the catalog model,
 * manufacturer and dimensions. Renaming a board or repointing it at a different
 * model left every session it was ridden in describing the old one.
 *
 * Only on update. A board that was just created has no sessions yet, and
 * afterCreate reports every column as changed, so sharing one callback would
 * cost a pointless query on every save.
 */
const userBoardUpdateCallback = async (board, options) => {
  await userBoardUpsertCallback(board, options)
  if (cascade.changedAny(options, board, ['name', 'board_id'])) {
    await cascade.userBoardChanged(board.id)
  }
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
   UserBoard.addHook('afterCreate', userBoardUpsertCallback )
   UserBoard.addHook('afterUpdate', userBoardUpdateCallback )
   /*
    * The sessions survive the board, and their documents keep its name and
    * model until something rewrites them.
    *
    * They have to be collected BEFORE the delete. sessions.board_id is
    * ON DELETE SET NULL, so by the time afterDestroy runs MySQL has already
    * cleared the link and nothing can find them from the board any more - the
    * obvious version of this hook queues an empty list and the documents stay
    * wrong forever.
    */
   UserBoard.addHook('beforeDestroy', async (board, options) => {
    options.cascadeSessionIds = await cascade.sessionsForUserBoards([board.id])
  })
   UserBoard.addHook('afterDestroy', async (board, options) => {
    getClient().delete({id : board.id, index : process.env.ELASTIC_USER_BOARDS_INDEX})
    cascade.queueSessions(options.cascadeSessionIds || [])
  })

  UserBoard.associate = function(models) {
    UserBoard.belongsTo(models.Board);
    UserBoard.belongsTo(models.User);
    UserBoard.hasMany(models.UserBoardImage);
    UserBoard.hasMany(models.Session,  {foreignKey: 'board_id', targetKey: 'id'});
  };
  return UserBoard;
};