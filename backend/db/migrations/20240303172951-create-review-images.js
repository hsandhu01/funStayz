'use strict';

let options = {};
if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ReviewImages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reviewId: {
      type: Sequelize.INTEGER,
      references: {
      model: {
      tableName: 'Reviews',
      schema: options.schema
      },
      key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
      },
      url: {
      type: Sequelize.STRING,
      allowNull: false
      },
      createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('now')
      }
      }, options);
      },
      down: async (queryInterface, Sequelize) => {
      options.tableName = 'ReviewImages';
      await queryInterface.dropTable(options);
      }
      };