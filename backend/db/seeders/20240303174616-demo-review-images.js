'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('ReviewImages', [
      {
        reviewId: 1, 
        url: "http://random.com/demoreviewimage1.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('ReviewImages', null, {});
  }
};
