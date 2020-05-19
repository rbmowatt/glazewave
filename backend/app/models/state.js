'use strict';
module.exports = (sequelize, DataTypes) => {
  const State = sequelize.define('State', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    abbreviation: DataTypes.STRING
  }, {underscored: true});
  State.associate = function(models) {
    // associations can be defined here
  };
  return State;
};