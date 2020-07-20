'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('session_data', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      session_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: {
          model: 'sessions', 
          key: 'id', 
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      water_temperature: {
        type: Sequelize.STRING
      },
      swell_height: {
        type: Sequelize.STRING
      },
      swell_period: {
        type: Sequelize.STRING
      },
      wave_height: {
        type: Sequelize.STRING
      },
      wave_period: {
        type: Sequelize.STRING
      },
      pressure: {
        type: Sequelize.STRING
      },
      wind_speed: {
        type: Sequelize.STRING
      },
      lat: {
        type: Sequelize.STRING
      },
      lon: {
        type: Sequelize.STRING
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
    return queryInterface.dropTable('session_data');
  }
};
