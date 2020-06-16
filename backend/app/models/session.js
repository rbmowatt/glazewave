'use strict';
const {getSessionQueue, getClient, ALGOLIA_SESSION_INDEX, ALGOLIA_SESSION_PREFIX} = require('./../services/queue/BetterQueue')

const sessionUpsertCallback = async (session, options) => {
  console.log(' been hit')
  getSessionQueue().push(session).on('finish', function (result) {
    console.log( ' session created ' , result)
  })
  .on('failed', function (err) {
    console.log(err)
  })
}

module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    title: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    is_public: DataTypes.BOOLEAN,
    board_id: {
      type: DataTypes.INTEGER,
    },
    location_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    notes : DataTypes.TEXT,
    session_date : DataTypes.DATE
  }, {underscored: true},
  );
  //add hooks to algolia
  Session.addHook('afterCreate', sessionUpsertCallback)
  Session.addHook('afterUpdate',sessionUpsertCallback)
  Session.addHook('afterDestroy', async (session, options) => {
    getClient(ALGOLIA_SESSION_INDEX ).deleteObject(ALGOLIA_SESSION_PREFIX + session.id)
  })

  Session.associate = function(models) {
    Session.belongsTo(models.UserBoard,  {foreignKey: 'board_id', targetKey: 'id'});
    Session.belongsTo(models.Location);
    Session.hasMany(models.SessionImage);
  };
  return Session;
};