'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ReviewImages', [
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
      },
      
    ], {});
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.bulkDelete('ReviewImages', null, {});
  }
};