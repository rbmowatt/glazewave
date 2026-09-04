'use strict';
const {getSessionQueue, getClient} = require('./../services/queue/BetterQueue')

const sessionUpsertCallback = async (session, options) => {
  getSessionQueue().push(session).on('finish', function (result) {
  })
  .on('failed', function (err) {
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
  Session.addHook('afterCreate', sessionUpsertCallback)
  Session.addHook('afterUpdate',sessionUpsertCallback)
  Session.addHook('afterDestroy', async (session, options) => {
    getClient().delete({id : session.id, index : process.env.ELASTIC_SESSIONS_INDEX})
  })

  Session.associate = function(models) {
    Session.belongsTo(models.UserBoard,  {foreignKey: 'board_id', targetKey: 'id'});
    Session.belongsTo(models.Location);
    Session.hasMany(models.SessionImage);
    Session.hasOne(models.SessionData);
  };
  return Session;
};