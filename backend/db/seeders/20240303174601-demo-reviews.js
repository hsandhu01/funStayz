'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.bulkInsert('Reviews', [
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
      
    ], {});
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.bulkDelete('Reviews', null, {});
  }
};