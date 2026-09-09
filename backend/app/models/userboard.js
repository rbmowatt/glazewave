'use strict';
const {getUserBoardQueue, getClient} = require('./../services/queue/BetterQueue')
const cascade = require('./../services/elastic/Cascade')
const boardRating = require('./../services/rating/BoardRating')

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

/*
 * A rating changed, or this board now points at a different catalog model.
 * Either one moves a model's community score, and repointing moves two of
 * them - the model that lost the rating and the model that gained it.
 *
 * previous() is the only way to reach the model it used to point at, and only
 * from inside this hook: afterUpdate runs before changed() is reset, and once
 * it returns the prior value is gone.
 */
const ratingRecomputeCallback = async (board, options) => {
  if (!cascade.changedAny(options, board, ['rating', 'board_id'])) return
  await boardRating.recompute([board.board_id, board.previous('board_id')])
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
    * No changed-column check on create: afterCreate reports every column as
    * changed anyway, and a board can arrive already rated - POST /api/user_board
    * passes the whole body through.
    */
   UserBoard.addHook('afterCreate', (board) => boardRating.recompute([board.board_id]))
   UserBoard.addHook('afterUpdate', ratingRecomputeCallback )
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
    // The instance keeps its own column values after the row is gone. Only
    // sessions.board_id was cleared by the delete, and that is a different
    // table, so the catalog model is still reachable from here.
    await boardRating.recompute([board.board_id])
  })

  UserBoard.associate = function(models) {
    UserBoard.belongsTo(models.Board);
    UserBoard.belongsTo(models.User);
    UserBoard.hasMany(models.UserBoardImage);
    UserBoard.hasMany(models.Session,  {foreignKey: 'board_id', targetKey: 'id'});
  };
  return UserBoard;
};