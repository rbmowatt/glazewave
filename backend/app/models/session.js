'use strict';
const {getAlgoliaClient} = require('./../services/algolia/client');
const ALGOLIA_INDEX = 'sessions';
const ALGOLIA_PREFIX = 'session_';

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
  Session.addHook('afterCreate', 'afterUpdate',  async (session, options) => {
    session.dataValues.objectID = ALGOLIA_PREFIX + session.id;
    getAlgoliaClient(ALGOLIA_INDEX).saveObjects([session.dataValues], {
      autoGenerateObjectIDIfNotExist: true
    }).then(({ objectIDs }) => {
      console.log(objectIDs);
    });
  })
  Session.addHook('afterDestroy', async (session, options) => {
    console.log('destrpyrd', board)
    getAlgoliaClient(ALGOLIA_INDEX ).deleteObject(ALGOLIA_PREFIX + session.id)
  })

  Session.associate = function(models) {
    Session.belongsTo(models.UserBoard,  {foreignKey: 'board_id', targetKey: 'id'});
    Session.belongsTo(models.Location);
    Session.hasMany(models.SessionImage);
  };
  return Session;
};