'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Reviews', [
      {
        userId: 1, 
        spotId: 1,
        review: "This place was great!",
        stars: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Reviews', null, {});
  }
};
