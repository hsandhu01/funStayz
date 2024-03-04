'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; 
}

options.tableName = "Users";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(options, 'firstName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn(options, 'lastName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(options, 'firstName');
    await queryInterface.removeColumn(options, 'lastName');
  }
};