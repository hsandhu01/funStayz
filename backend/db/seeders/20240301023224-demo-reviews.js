'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    let options = {};
    
    if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
      options.schema = process.env.SCHEMA; 
    }

    await queryInterface.bulkInsert({
      tableName: 'Reviews',
      ...options
    }, [
      {
        userId: 1, 
        spotId: 1, 
        review: "Great place, had a wonderful time!",
        stars: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 2, 
        spotId: 1, 
        review: "Nice location, but noisy neighbors.",
        stars: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    let options = {};
    
    if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
      options.schema = process.env.SCHEMA;
    }

    return queryInterface.bulkDelete({
      tableName: 'Reviews',
      ...options
    }, null, {});
  }
};