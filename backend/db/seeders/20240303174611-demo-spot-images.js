'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('SpotImages', [
      {
        spotId: 1, 
        url: "http://random.com/image1.jpg",
        preview: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('SpotImages', null, {});
  }
};
