'use strict';
module.exports = (sequelize, DataTypes) => {
  const Shaper = sequelize.define('Shaper', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    // Every spelling a feed uses for this person: "Britt Merrick",
    // "B. Merrick", "britt merrick". The loader resolves through here before
    // creating a new row, exactly as it does for a maker.
    aliases: DataTypes.JSON,
    website: DataTypes.STRING,
  }, {underscored: true, tableName: 'shapers'});
  Shaper.associate = function(models) {
    Shaper.hasMany(models.Board);
  };
  return Shaper;
};
