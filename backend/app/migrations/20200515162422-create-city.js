'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Cities', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      zip: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      stateId :
      {
        type: Sequelize.INTEGER(11).UNSIGNED,
        allowNull: false,
        references: {
          model: 'State', 
          key: 'id', 
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Cities');
  }
};