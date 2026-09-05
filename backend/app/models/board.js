'use strict';
module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define('Board', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    manufacturer_id: DataTypes.INTEGER,
    model: DataTypes.STRING,
    isPublic: DataTypes.BOOLEAN,
    // Null marks a harvested row. A row with a creator was typed by a person,
    // and the loader must never overwrite what a person typed.
    createdBy: DataTypes.INTEGER,
    slug: DataTypes.STRING,
    // Normalized maker + model. The harvest upserts on this, which is what
    // stops a second run duplicating the catalog.
    canonical_key: DataTypes.STRING,
    designer: DataTypes.STRING,
    category: DataTypes.STRING,
    discontinued: DataTypes.BOOLEAN,
    year_introduced: DataTypes.INTEGER,
    // 'field' is the only authoritative level: an actual yearIntroduced column
    // from EOS rather than a number pulled out of marketing copy.
    year_confidence: DataTypes.ENUM('field', 'stated', 'title', 'mentioned', 'boilerplate'),
    year_evidence: DataTypes.STRING,
    length_in: DataTypes.DECIMAL(6, 3),
    width_in: DataTypes.DECIMAL(6, 3),
    thickness_in: DataTypes.DECIMAL(6, 3),
    volume_l: DataTypes.DECIMAL(6, 2),
  }, {underscored: true});
  Board.associate = function(models) {
    // associations can be defined here
    Board.belongsTo(models.Manufacturer);
    Board.hasMany(models.BoardImage, {foreignKey: 'board_id'});
    Board.hasMany(models.BoardModelSource, {foreignKey: 'board_id'});
  };
  return Board;
};
