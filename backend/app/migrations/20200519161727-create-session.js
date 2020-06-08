'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('sessions', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING
      },
      rating: {
        type: Sequelize.INTEGER(3).UNSIGNED,
      },
      location_id :
      {
        type: Sequelize.STRING,
        references: {
          model: 'Locations', 
          key: 'id', 
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      board_id :
      {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: {
          model: 'Boards', 
          key: 'id', 
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      is_public: {
        type: Sequelize.BOOLEAN
      },
      user_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
      },
      notes: {
        type: Sequelize.TEXT
      },
      session_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
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
    return queryInterface.dropTable('sessions');
  }
};