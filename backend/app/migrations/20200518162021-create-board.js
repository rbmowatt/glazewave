'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('boards', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      manufacturer_id :
      {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: {
          model: 'Manufacturers', 
          key: 'id', 
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      model: {
        type: Sequelize.STRING
      },
      is_public: {
        type: Sequelize.BOOLEAN
      },
      created_by: {
        type: Sequelize.INTEGER(11).UNSIGNED,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('boards');
  }
};