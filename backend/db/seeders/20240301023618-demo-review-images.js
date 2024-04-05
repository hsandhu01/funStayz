'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    let options = {};
   
    if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
      options.schema = process.env.SCHEMA;
    }

    await queryInterface.bulkInsert({
      tableName: 'ReviewImages',
      ...options
    }, [
      {
        reviewId: 1, 
        url: 'https://sandhu.com/review-image1.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        reviewId: 2, 
        url: 'https://sandhu.com/review-image2.jpg',
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
      tableName: 'ReviewImages',
      ...options
    }, null, {});
  }
};